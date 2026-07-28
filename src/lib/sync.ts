// Sincronização na nuvem: mantém o estado do painel igual em todos os
// dispositivos via /api/state (Vercel Blob). Estratégia: estado completo com
// carimbo de tempo (savedAt) — a versão mais recente vence.
//
// - Toda alteração local agenda um push (debounce de 1,5s).
// - Ao abrir o app, ao voltar para a aba e a cada 30s: pull da nuvem.
// - `savedAt` identifica a versão do estado local; só aplicamos a nuvem
//   quando ela é mais nova, evitando ping-pong entre dispositivos.
import { create } from 'zustand'
import { useStore } from '../store'

const SYNC_URL = (import.meta.env.VITE_SYNC_URL as string | undefined) || '/api/state'
const SYNC_KEY = (import.meta.env.VITE_SYNC_KEY as string | undefined) || ''
const SAVED_AT_KEY = 'guilda-ita-sync-savedAt'

interface SyncStatus {
  status: 'idle' | 'syncing' | 'ok' | 'error'
  lastSyncAt: number | null
  error: string | null
}

export const useSyncStatus = create<SyncStatus>(() => ({
  status: 'idle',
  lastSyncAt: null,
  error: null,
}))

let savedAt = Number(localStorage.getItem(SAVED_AT_KEY) || 0)
let lastSerialized = ''
let applyingRemote = false
let pushTimer: number | undefined
let started = false

function rememberSavedAt(v: number) {
  savedAt = v
  localStorage.setItem(SAVED_AT_KEY, String(v))
}

async function request(method: 'GET' | 'PUT', body?: unknown): Promise<unknown> {
  const res = await fetch(SYNC_URL, {
    method,
    headers: { 'content-type': 'application/json', 'x-sync-key': SYNC_KEY },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function pushNow(): Promise<void> {
  useSyncStatus.setState({ status: 'syncing' })
  try {
    if (savedAt === 0) rememberSavedAt(Date.now())
    const data = JSON.parse(useStore.getState().exportData())
    await request('PUT', { savedAt, data })
    useSyncStatus.setState({ status: 'ok', lastSyncAt: Date.now(), error: null })
  } catch (e) {
    useSyncStatus.setState({ status: 'error', error: String(e) })
  }
}

export async function pullNow(): Promise<void> {
  useSyncStatus.setState({ status: 'syncing' })
  try {
    const remote = (await request('GET')) as { savedAt: number; data: unknown } | null
    if (remote && typeof remote.savedAt === 'number' && remote.savedAt > savedAt) {
      applyingRemote = true
      try {
        const ok = useStore.getState().importData(JSON.stringify(remote.data))
        if (ok) {
          rememberSavedAt(remote.savedAt)
          lastSerialized = useStore.getState().exportData()
        }
      } finally {
        applyingRemote = false
      }
    } else if (!remote || savedAt > remote.savedAt) {
      // Local é mais novo (ou a nuvem está vazia): envia o estado atual.
      await pushNow()
      return
    }
    useSyncStatus.setState({ status: 'ok', lastSyncAt: Date.now(), error: null })
  } catch (e) {
    useSyncStatus.setState({ status: 'error', error: String(e) })
  }
}

export function initSync(): void {
  if (started) return
  started = true

  lastSerialized = useStore.getState().exportData()

  useStore.subscribe((state) => {
    if (applyingRemote) return
    const serialized = state.exportData()
    // exportData ignora campos efêmeros (toasts), então mudanças que não
    // precisam de sync não disparam push.
    if (serialized === lastSerialized) return
    lastSerialized = serialized
    rememberSavedAt(Date.now())
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
