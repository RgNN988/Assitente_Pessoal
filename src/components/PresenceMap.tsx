import { dayKey, todayKey } from '../lib/helpers'

const WEEKS = 12
const DAY_LABELS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']

/** Mapa de presença estilo GitHub: últimas 12 semanas, colunas = semanas, linhas = seg→dom. */
export default function PresenceMap({
  days,
  color,
  emoji,
}: {
  days: string[]
  color: string
  emoji: string
}) {
  const got = new Set(days)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = todayKey()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) - 7 * (WEEKS - 1))

  const columns = []
  for (let w = 0; w < WEEKS; w++) {
    const cells = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + w * 7 + d)
      const key = dayKey(date)
      cells.push({
        key,
        future: date > today,
        marked: got.has(key),
        isToday: key === todayStr,
        label: date.toLocaleDateString('pt-BR'),
      })
    }
    columns.push(cells)
  }

  return (
    <div className="flex items-start gap-2 overflow-x-auto">
      <div className="flex flex-col gap-1 pt-0.5">
        {DAY_LABELS.map((l, i) => (
          <span key={i} className="h-3.5 text-[9px] leading-3.5" style={{ color: 'var(--ink-3)' }}>
            {l}
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        {columns.map((cells, w) => (
          <div key={w} className="flex flex-col gap-1">
            {cells.map((d) => (
              <span
                key={d.key}
                title={d.marked ? `${emoji} ${d.label}` : d.label}
                className="h-3.5 w-3.5 rounded-[4px]"
                style={{
                  background: d.marked ? color : 'var(--surface-3)',
                  opacity: d.future ? 0.25 : 1,
                  outline: d.isToday ? '1.5px solid var(--gold)' : 'none',
                  outlineOffset: 1,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
