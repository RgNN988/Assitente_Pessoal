// Sincronização na nuvem: mantém o estado do painel igual em todos os
// dispositivos via /api/state (Vercel Blob).
//
// - O acesso exige a senha do painel, digitada uma vez por dispositivo
//   (fica no localStorage). Nada de chave embutida no site.
// - `base` é a versão da nuvem com que este dispositivo está sincronizado.
//   Todo envio diz "estou alterando a versão X"; se a nuvem já estiver em
//   outra versão, o servidor recusa (409) e devolve a versão atual, que é
//   MESCLADA com a local antes de reenviar. Assim um dispositivo
//   desatualizado nunca apaga o progresso feito em outro.
// - `dirty` marca alterações locais ainda não confirmadas pela nuvem.
// - Toda alteração local agenda um envio (debounce de 1,5s). Ao abrir o app,
//   ao voltar para a aba e a cada 30s: busca a nuvem.
import { create } from 'zustand'
import { useStore } from '../store'

const SYNC_URL = (import.meta.env.VITE_SYNC_URL as string | undefined) || '/api/state'
const PASS_KEY = 'guilda-ita-sync-pass'
const BASE_KEY = 'guilda-ita-sync-base'
const DIRTY_KEY = 'guilda-ita-sync-dirty'
const LEGACY_SAVED_AT_KEY = 'guilda-ita-sync-savedAt'

interface SyncStatus {
  /** locked = falta a senha; loading = primeira sincronização em andamento. */
  status: 'locked' | 'loading' | 'idle' | 'syncing' | 'ok' | 'error'
  lastSyncAt: number | null
  error: string | null
}

export const useSyncStatus = create<SyncStatus>(() => ({
  status: localStorage.getItem(PASS_KEY) ? 'loading' : 'locked',
  lastSyncAt: null,
  error: null,
}))

type Data = Record<string, unknown>
interface Remote {
  savedAt: number
  data: Data
}

class AuthError extends Error {}
class ConflictError extends Error {
  constructor(public current: Remote | null) {
    super('conflito')
  }
}

let base = Number(localStorage.getItem(BASE_KEY) || 0)
let dirty = localStorage.getItem(DIRTY_KEY) === '1'
let changeCount = 0
let lastSerialized = ''
let applyingRemote = false
let pushTimer: number | undefined
let pushing: Promise<void> | null = null
let pushAgain = false
let started = false

function setBase(v: number) {
  base = v
  localStorage.setItem(BASE_KEY, String(v))
}

function setDirty(v: boolean) {
  dirty = v
  localStorage.setItem(DIRTY_KEY, v ? '1' : '0')
}

async function request(method: 'GET' | 'PUT', query = '', body?: unknown): Promise<unknown> {
  const pass = localStorage.getItem(PASS_KEY) || ''
  const res = await fetch(SYNC_URL + query, {
    method,
    headers: { 'content-type': 'application/json', 'x-sync-key': pass },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (res.status === 401) throw new AuthError('senha inválida')
  if (res.status === 409) {
    const j = (await res.json()) as { current: Remote | null }
    throw new ConflictError(j.current)
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

function fail(e: unknown) {
  if (e instanceof AuthError) {
    localStorage.removeItem(PASS_KEY)
    useSyncStatus.setState({ status: 'locked', error: 'Senha inválida.' })
    return
  }
  useSyncStatus.setState({ status: 'error', error: String(e) })
}

function localData(): Data {
  return JSON.parse(useStore.getState().exportData()) as Data
}

/** Aplica dados no store sem marcá-los como alteração local. */
function applyData(data: Data): boolean {
  applyingRemote = true
  try {
    const ok = useStore.getState().importData(JSON.stringify(data))
    if (ok) lastSerialized = useStore.getState().exportData()
    return ok
  } finally {
    applyingRemote = false
  }
}

// ---------- Mesclagem (usada só quando dois dispositivos divergem) ----------

type WithId = { id: string }
const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])

/** União por id; em itens presentes nos dois lados, vence a versão local. */
function mergeById(local: unknown, remote: unknown): WithId[] {
  const l = arr<WithId>(local)
  const ids = new Set(l.map((x) => x.id))
  return [...l, ...arr<WithId>(remote).filter((x) => !ids.has(x.id))]
}

function mergeSet(local: unknown, remote: unknown): string[] {
  return [...new Set([...arr<string>(local), ...arr<string>(remote)])].sort()
}

export function mergeData(local: Data, remote: Data): Data {
  const rank = (d: Data) => Number(d.jjBeltIndex ?? 0) * 10 + Number(d.jjDegree ?? 0)
  const jj = rank(remote) > rank(local) ? remote : local
  return {
    ...remote,
    ...local,
    weights: { ...(remote.weights as object), ...(local.weights as object) },
    categories: mergeById(local.categories, remote.categories),
    tasks: mergeById(local.tasks, remote.tasks),
    studyItems: mergeById(local.studyItems, remote.studyItems),
    ledger: mergeById(local.ledger, remote.ledger),
    rewards: mergeById(local.rewards, remote.rewards),
    schedule: mergeById(local.schedule, remote.schedule),
    trainings: mergeSet(local.trainings, remote.trainings),
    readings: mergeSet(local.readings, remote.readings),
    seenAchievements: mergeSet(local.seenAchievements, remote.seenAchievements),
    jjBeltIndex: jj.jjBeltIndex,
    jjDegree: jj.jjDegree,
    jjPromotedAt: jj.jjPromotedAt,
  }
}

// ---------------------------------------------------------------------------

async function doPush(): Promise<void> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const sentAt = changeCount
    try {
      const res = (await request('PUT', '', {
        savedAt: Date.now(),
        baseSavedAt: base,
        data: localData(),
      })) as { savedAt: number }
      setBase(res.savedAt)
      if (changeCount === sentAt) setDirty(false)
      useSyncStatus.setState({ status: 'ok', lastSyncAt: Date.now(), error: null })
      return
    } catch (e) {
      if (!(e instanceof ConflictError)) throw e
      // A nuvem mudou desde a última sincronização: mescla e tenta de novo.
      const current = e.current
      if (current) applyData(mergeData(localData(), current.data))
      setBase(current?.savedAt ?? 0)
    }
  }
  throw new Error('conflitos repetidos ao sincronizar')
}

export async function pushNow(): Promise<void> {
  if (pushing) {
    pushAgain = true
    return pushing
  }
  useSyncStatus.setState({ status: 'syncing' })
  pushing = (async () => {
    try {
      do {
        pushAgain = false
        await doPush()
      } while (pushAgain)
    } catch (e) {
      fail(e)
    } finally {
      pushing = null
    }
  })()
  return pushing
}

export async function pullNow(): Promise<void> {
  if (!localStorage.getItem(PASS_KEY)) return
  if (dirty) return pushNow() // o envio já detecta e mescla mudanças da nuvem
  if (useSyncStatus.getState().status !== 'loading') useSyncStatus.setState({ status: 'syncing' })
  try {
    const remote = (await request('GET')) as Remote | null
    if (dirty) return pushNow() // houve alteração local durante a busca
    if (!remote) {
      setDirty(true)
      return pushNow()
    }
    if (remote.savedAt !== base && applyData(remote.data)) setBase(remote.savedAt)
    useSyncStatus.setState({ status: 'ok', lastSyncAt: Date.now(), error: null })
  } catch (e) {
    fail(e)
  }
}

function start(): void {
  if (started) return
  started = true

  // Migração do modelo antigo: se este dispositivo ainda não tem `base`, os
  // dados locais podem conter progresso que não está na nuvem. Marcamos como
  // pendentes para que sejam MESCLADOS (e não substituídos) na primeira sync.
  if (localStorage.getItem(BASE_KEY) === null) {
    const s = useStore.getState()
    const hasData =
      s.ledger.length + s.tasks.length + s.studyItems.length + s.trainings.length + s.readings.length > 0
    setBase(0)
    setDirty(hasData)
    localStorage.removeItem(LEGACY_SAVED_AT_KEY)
  }

  lastSerialized = useStore.getState().exportData()

  useStore.subscribe((state) => {
    if (applyingRemote) return
    const serialized = state.exportData()
    // exportData ignora campos efêmeros (toasts), então mudanças que não
    // precisam de sync não disparam envio.
    if (serialized === lastSerialized) return
    lastSerialized = serialized
    changeCount++
    setDirty(true)
    window.clearTimeout(pushTimer)
    pushTimer = window.setTimeout(() => void pushNow(), 1500)
  })

  const onVisible = () => {
    if (document.visibilityState === 'visible') void pullNow()
  }
  document.addEventListener('visibilitychange', onVisible)
  window.addEventListener('focus', onVisible)
  window.setInterval(onVisible, 30_000)

  void pullNow()
}

export function initSync(): void {
  if (localStorage.getItem(PASS_KEY)) start()
}

/** Valida a senha na nuvem; se correta, guarda neste dispositivo e inicia a sync. */
export async function unlock(pass: string): Promise<boolean> {
  localStorage.setItem(PASS_KEY, pass)
  useSyncStatus.setState({ status: 'loading', error: null })
  try {
    await request('GET', '?history=1')
  } catch (e) {
    fail(e)
    return false
  }
  start()
  return true
}

/** Esquece a senha neste dispositivo. */
export function lock(): void {
  localStorage.removeItem(PASS_KEY)
  location.reload()
}

// ---------- Backups ----------

export interface Backup {
  pathname: string
  uploadedAt: string
}

export async function listBackups(): Promise<Backup[]> {
  return (await request('GET', '?history=1')) as Backup[]
}

/** Substitui o estado atual por um backup (o estado atual também vira backup). */
export async function restoreBackup(pathname: string): Promise<boolean> {
  const snap = (await request('GET', `?snapshot=${encodeURIComponent(pathname)}`)) as Remote
  return useStore.getState().importData(JSON.stringify(snap.data))
}
