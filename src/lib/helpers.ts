import { BELTS } from '../data/defaults'
import type { LedgerEntry, Group } from '../types'

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

export const dayKey = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const todayKey = () => dayKey(new Date())

export const fmtPts = (n: number) => n.toLocaleString('pt-BR')

/** XP total = tudo que já foi ganho (nunca diminui com resgates). */
export const totalXp = (ledger: LedgerEntry[]) =>
  ledger.reduce((s, e) => s + (e.points > 0 ? e.points : 0), 0)

/** Saldo gastável = ganhos - resgates. */
export const balance = (ledger: LedgerEntry[]) =>
  ledger.reduce((s, e) => s + e.points, 0)

export interface Rank {
  beltIndex: number
  belt: (typeof BELTS)[number]
  degree: number // 0..4 graus dentro da faixa
  progress: number // 0..1 até o próximo grau/faixa
  nextAt: number // XP do próximo marco
  title: string
}

/** Progressão faixa → 4 graus → próxima faixa, sobre qualquer escala de marcos. */
function rankCore(value: number, marks: number[]): Rank {
  let beltIndex = 0
  for (let i = marks.length - 1; i >= 0; i--) {
    if (value >= marks[i]) {
      beltIndex = i
      break
    }
  }
  const belt = BELTS[beltIndex]
  const next = marks[beltIndex + 1]
  if (next === undefined) {
    return { beltIndex, belt, degree: 4, progress: 1, nextAt: marks[beltIndex], title: belt.name }
  }
  const span = next - marks[beltIndex]
  const into = value - marks[beltIndex]
  const degreeSpan = span / 5 // 4 graus + a troca de faixa
  const degree = Math.min(4, Math.floor(into / degreeSpan))
  const stepStart = marks[beltIndex] + degree * degreeSpan
  const nextAt = Math.round(stepStart + degreeSpan)
  const progress = Math.min(1, (value - stepStart) / degreeSpan)
  const title = degree === 0 ? belt.name : `${belt.name} · ${degree}º grau`
  return { beltIndex, belt, degree, progress, nextAt, title }
}

export function rankFor(xp: number): Rank {
  return rankCore(xp, BELTS.map((b) => b.xp))
}

/** Título da graduação real do tatame (controlada manualmente pelo usuário). */
export function jjTitle(beltIndex: number, degree: number): string {
  const name = BELTS[Math.min(beltIndex, BELTS.length - 1)].name
  return degree === 0 ? name : `${name} · ${degree}º grau`
}

/** Dias consecutivos (terminando hoje ou ontem) com ganho de pontos. */
export function streakDays(ledger: LedgerEntry[]): number {
  const days = new Set(
    ledger.filter((e) => e.points > 0).map((e) => dayKey(new Date(e.ts))),
  )
  if (days.size === 0) return 0
  const cursor = new Date()
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  while (days.has(dayKey(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

/** Série diária dos últimos N dias, empilhada por grupo. */
export function dailySeries(ledger: LedgerEntry[], nDays: number) {
  const byDay = new Map<string, Record<Group, number>>()
  for (const e of ledger) {
    if (e.points <= 0 || e.group === 'resgate') continue
    const k = dayKey(new Date(e.ts))
    const row =
      byDay.get(k) ?? { estudos: 0, iniciativas: 0, jiujitsu: 0, pessoal: 0 }
    row[e.group] += e.points
    byDay.set(k, row)
  }
  const out: Array<{ day: string; label: string } & Record<Group, number>> = []
  const d = new Date()
  d.setDate(d.getDate() - (nDays - 1))
  for (let i = 0; i < nDays; i++) {
    const k = dayKey(d)
    const row =
      byDay.get(k) ?? { estudos: 0, iniciativas: 0, jiujitsu: 0, pessoal: 0 }
    out.push({
      day: k,
      label: `${d.getDate()}/${d.getMonth() + 1}`,
      ...row,
    })
    d.setDate(d.getDate() + 1)
  }
  return out
}

/** Total por grupo (identidade → cores categóricas fixas). */
export function groupTotals(ledger: LedgerEntry[]) {
  const totals: Record<Group, number> = {
    estudos: 0,
    iniciativas: 0,
    jiujitsu: 0,
    pessoal: 0,
  }
  for (const e of ledger) {
    if (e.points > 0 && e.group !== 'resgate') totals[e.group] += e.points
  }
  return totals
}

export const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + (m || 0)
}
