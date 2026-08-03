import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useStore } from '../store'
import { bestStreak, currentStreak, fmtPts, todayKey } from '../lib/helpers'
import { DEFAULT_WEIGHTS } from '../data/defaults'
import PresenceMap from './PresenceMap'
import { SectionTitle } from './ui'

export default function Leitura() {
  const readings = useStore((s) => s.readings)
  const weights = useStore((s) => s.weights)
  const addReading = useStore((s) => s.addReading)
  const removeReading = useStore((s) => s.removeReading)

  const [otherDay, setOtherDay] = useState('')

  const pts = weights.leitura ?? DEFAULT_WEIGHTS.leitura
  const total = readings.length
  const today = todayKey()
  const readToday = readings.includes(today)

  const month = today.slice(0, 7)
  const thisMonth = readings.filter((d) => d.startsWith(month)).length
  const streak = currentStreak(readings)
  const best = bestStreak(readings)

  const recent = [...readings].reverse().slice(0, 12)

  return (
    <div className="flex flex-col gap-5">
      {/* Sequência de leitura */}
      <section className="card-raised relative overflow-hidden p-5">
        <div className="pointer-events-none absolute -top-6 -right-4 text-[110px] opacity-[0.06] select-none" aria-hidden>
          📚
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase" style={{ color: 'var(--ink-3)' }}>
              Biblioteca · 1h por dia, todos os dias
            </p>
            <h2 className="font-display text-xl font-extrabold" style={{ color: 'var(--c-leitura)' }}>
              {streak > 0 ? `🔥 ${streak} dia${streak === 1 ? '' : 's'} seguido${streak === 1 ? '' : 's'}` : 'Comece sua sequência hoje'}
            </h2>
            <p className="mt-0.5 text-sm" style={{ color: 'var(--ink-2)' }}>
              {fmtPts(total)} dia{total === 1 ? '' : 's'} de leitura no total · {thisMonth} neste mês
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="label mb-0">Recorde</p>
            <p className="font-mono text-2xl font-bold" style={{ color: 'var(--c-leitura)' }}>
              {fmtPts(best)}
            </p>
            <p className="text-xs" style={{ color: 'var(--ink-3)' }}>
              dia{best === 1 ? '' : 's'} seguido{best === 1 ? '' : 's'} — sua maior sequência
            </p>
          </div>
        </div>
      </section>

      {/* Check-in */}
      <section className="card p-5">
        <SectionTitle>Check-in de leitura</SectionTitle>
        <div className="flex flex-wrap items-end gap-4">
          <button
            className={`btn ${readToday ? '' : 'btn-gold'} px-6 py-3 text-base`}
            disabled={readToday}
            onClick={() => addReading(today)}
            style={readToday ? { opacity: 0.6, cursor: 'default' } : undefined}
          >
            {readToday ? '✅ Leitura de hoje registrada!' : `📚 Registrar 1h de leitura de hoje (+${pts} pts)`}
          </button>
          <div className="flex items-end gap-2">
            <div>
              <label className="label" htmlFor="read-other">Esqueceu um dia? Registre aqui</label>
              <input
                id="read-other"
                className="input"
                type="date"
                max={today}
                value={otherDay}
                onChange={(e) => setOtherDay(e.target.value)}
              />
            </div>
            <button
              className="btn"
              disabled={!otherDay || readings.includes(otherDay)}
              onClick={() => {
                if (otherDay) {
                  addReading(otherDay)
                  setOtherDay('')
                }
              }}
            >
              Adicionar
            </button>
          </div>
        </div>
      </section>

      {/* Presença */}
      <section className="card p-5">
        <SectionTitle
          right={
            <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--ink-3)' }}>
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: 'var(--c-leitura)' }} />
              leitura feita
            </span>
          }
        >
          Presença — últimas 12 semanas
        </SectionTitle>
        <PresenceMap days={readings} color="var(--c-leitura)" emoji="📚" />
      </section>

      {/* Histórico */}
      {recent.length > 0 && (
        <section>
          <SectionTitle>Últimas leituras</SectionTitle>
          <ul className="flex flex-col gap-1.5">
            <AnimatePresence mode="popLayout">
              {recent.map((d) => (
                <motion.li
                  key={d}
                  layout
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  className="card flex items-center gap-3 px-4 py-2 text-sm"
                >
                  <span aria-hidden>📚</span>
                  <span className="flex-1" style={{ color: 'var(--ink-2)' }}>
                    {new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </span>
                  <button
                    className="btn-ghost btn px-2 py-1 text-xs"
                    onClick={() => removeReading(d)}
                    aria-label={`Remover leitura de ${d}`}
                  >
                    🗑
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </section>
      )}
    </div>
  )
}
