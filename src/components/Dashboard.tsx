import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useStore } from '../store'
import { GROUPS, GROUP_IDS } from '../data/defaults'
import {
  balance,
  dailySeries,
  dayKey,
  fmtPts,
  groupTotals,
  todayKey,
} from '../lib/helpers'
import type { Group } from '../types'
import { SectionTitle } from './ui'

const GROUP_HEX: Record<Group, string> = {
  estudos: '#bd861f',
  iniciativas: '#1f94be',
  jiujitsu: '#9268f0',
  pessoal: '#d6527c',
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s, p) => s + (p.value || 0), 0)
  return (
    <div className="card-raised px-3 py-2 text-xs" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
      <p className="mb-1 font-semibold" style={{ color: 'var(--ink)' }}>
        {label} · <span className="font-mono">{fmtPts(total)} pts</span>
      </p>
      {payload
        .filter((p) => p.value > 0)
        .map((p) => (
          <p key={p.name} className="flex items-center gap-2" style={{ color: 'var(--ink-2)' }}>
            <span className="inline-block h-2 w-2 rounded-sm" style={{ background: p.color }} />
            {p.name}: <span className="font-mono" style={{ color: 'var(--ink)' }}>{fmtPts(p.value)}</span>
          </p>
        ))}
    </div>
  )
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: 'var(--ink-2)' }}>
      {GROUP_IDS.map((g) => (
        <span key={g} className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: GROUP_HEX[g] }} />
          {GROUPS[g].label}
        </span>
      ))}
    </div>
  )
}

function StatTile({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="card flex-1 basis-40 px-4 py-3">
      <p className="label mb-1">{label}</p>
      <p className="font-mono text-2xl font-bold" style={{ color: accent ?? 'var(--ink)' }}>
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 text-xs" style={{ color: 'var(--ink-3)' }}>
          {sub}
        </p>
      )}
    </div>
  )
}

export default function Dashboard() {
  const ledger = useStore((s) => s.ledger)
  const rewards = useStore((s) => s.rewards)
  const studyItems = useStore((s) => s.studyItems)

  const series = useMemo(() => dailySeries(ledger, 14), [ledger])
  const totals = useMemo(() => groupTotals(ledger), [ledger])
  const maxTotal = Math.max(1, ...GROUP_IDS.map((g) => totals[g]))

  const today = todayKey()
  const earnedToday = ledger
    .filter((e) => e.points > 0 && dayKey(new Date(e.ts)) === today)
    .reduce((s, e) => s + e.points, 0)
  const last7 = series.slice(-7).reduce(
    (s, d) => s + d.estudos + d.iniciativas + d.jiujitsu + d.pessoal,
    0,
  )
  const pts = balance(ledger)
  const pendingStudy = studyItems.filter((i) => i.doneUnits < i.totalUnits).length

  const nextReward = [...rewards].sort((a, b) => a.cost - b.cost).find((r) => r.cost > pts)
  const cheapest = [...rewards].sort((a, b) => a.cost - b.cost)[0]
  const affordable = cheapest && pts >= cheapest.cost

  const recent = [...ledger].reverse().slice(0, 8)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-3">
        <StatTile label="Farmado hoje" value={`${fmtPts(earnedToday)}`} sub="pontos no dia" accent={earnedToday > 0 ? 'var(--gold)' : undefined} />
        <StatTile label="Últimos 7 dias" value={fmtPts(last7)} sub="pontos na semana" />
        <StatTile label="Arsenal pendente" value={String(pendingStudy)} sub="itens de estudo abertos" />
        <StatTile
          label={affordable ? 'Recompensa liberada' : 'Próxima recompensa'}
          value={affordable ? '✅' : nextReward ? fmtPts(nextReward.cost - pts) : '—'}
          sub={
            affordable
              ? `${cheapest.name} disponível!`
              : nextReward
                ? `pts para ${nextReward.name}`
                : 'cadastre recompensas na Loja'
          }
          accent={affordable ? 'var(--good)' : undefined}
        />
      </div>

      <section className="card p-5">
        <SectionTitle right={<Legend />}>Pontos por dia — últimos 14 dias</SectionTitle>
        <div style={{ width: '100%', height: 240 }}>
          <ResponsiveContainer>
            <BarChart data={series} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />
              <XAxis
                dataKey="label"
                tick={{ fill: 'var(--ink-3)', fontSize: 11, fontFamily: 'Chakra Petch' }}
                axisLine={{ stroke: 'var(--border-strong)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--ink-3)', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(146,104,240,0.08)' }} />
              {GROUP_IDS.map((g, i) => (
                <Bar
                  key={g}
                  dataKey={g}
                  name={GROUPS[g].label}
                  stackId="pts"
                  fill={GROUP_HEX[g]}
                  stroke="var(--surface)"
                  strokeWidth={2}
                  radius={i === GROUP_IDS.length - 1 ? [4, 4, 0, 0] : 0}
                  maxBarSize={26}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <SectionTitle>Total por frente</SectionTitle>
          <div className="flex flex-col gap-3">
            {GROUP_IDS.map((g) => (
              <div key={g}>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className="flex items-center gap-2" style={{ color: 'var(--ink-2)' }}>
                    <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: GROUP_HEX[g] }} />
                    {GROUPS[g].label}
                  </span>
                  <span className="font-mono text-xs" style={{ color: 'var(--ink)' }}>
                    {fmtPts(totals[g])} pts
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--bg)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(totals[g] / maxTotal) * 100}%`, background: GROUP_HEX[g] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <SectionTitle>Atividade recente</SectionTitle>
          {recent.length === 0 ? (
            <p className="py-6 text-center text-sm" style={{ color: 'var(--ink-3)' }}>
              Complete missões para começar a farmar XP.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {recent.map((e) => (
                <li key={e.id} className="flex items-center gap-3 text-sm">
                  <span
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      background: e.group === 'resgate' ? 'var(--ink-3)' : GROUP_HEX[e.group as Group],
                    }}
                  />
                  <span className="min-w-0 flex-1 truncate" style={{ color: 'var(--ink-2)' }}>
                    {e.label}
                  </span>
                  <span
                    className="font-mono text-xs font-bold"
                    style={{ color: e.points > 0 ? 'var(--gold)' : 'var(--c-pessoal)' }}
                  >
                    {e.points > 0 ? '+' : ''}
                    {fmtPts(e.points)}
                  </span>
                  <span className="w-12 text-right font-mono text-[10px]" style={{ color: 'var(--ink-3)' }}>
                    {new Date(e.ts).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
