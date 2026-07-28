import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useStore } from '../store'
import { dayKey, fmtPts, jjTitle, todayKey } from '../lib/helpers'
import { BELTS } from '../data/defaults'
import { Belt } from './CharacterHeader'
import { SectionTitle } from './ui'

const WEEKS = 12
const DAY_LABELS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']

/** Mapa de presença: últimas 12 semanas, colunas = semanas, linhas = seg→dom. */
function PresenceMap({ trainings }: { trainings: string[] }) {
  const got = new Set(trainings)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = todayKey()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) - 7 * (WEEKS - 1))

  const columns = []
  for (let w = 0; w < WEEKS; w++) {
    const days = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + w * 7 + d)
      const key = dayKey(date)
      days.push({
        key,
        future: date > today,
        trained: got.has(key),
        isToday: key === todayStr,
        label: date.toLocaleDateString('pt-BR'),
      })
    }
    columns.push(days)
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
        {columns.map((days, w) => (
          <div key={w} className="flex flex-col gap-1">
            {days.map((d) => (
              <span
                key={d.key}
                title={d.trained ? `🥋 ${d.label}` : d.label}
                className="h-3.5 w-3.5 rounded-[4px]"
                style={{
                  background: d.trained ? 'var(--c-jiujitsu)' : 'var(--surface-3)',
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

export default function JiuJitsu() {
  const trainings = useStore((s) => s.trainings)
  const weights = useStore((s) => s.weights)
  const addTraining = useStore((s) => s.addTraining)
  const removeTraining = useStore((s) => s.removeTraining)
  const jjBeltIndex = useStore((s) => s.jjBeltIndex)
  const jjDegree = useStore((s) => s.jjDegree)
  const jjPromotedAt = useStore((s) => s.jjPromotedAt)
  const promoteJJ = useStore((s) => s.promoteJJ)

  const [otherDay, setOtherDay] = useState('')
  const [confirmPromote, setConfirmPromote] = useState(false)

  const total = trainings.length
  const belt = BELTS[jjBeltIndex]
  const today = todayKey()
  const trainedToday = trainings.includes(today)

  const month = today.slice(0, 7)
  const thisMonth = trainings.filter((d) => d.startsWith(month)).length
  const sincePromotion = trainings.filter((d) => !jjPromotedAt || d > jjPromotedAt).length

  const nextTitle =
    jjDegree < 4
      ? jjTitle(jjBeltIndex, jjDegree + 1)
      : jjBeltIndex < BELTS.length - 1
        ? jjTitle(jjBeltIndex + 1, 0)
        : null

  const recent = [...trainings].reverse().slice(0, 12)

  return (
    <div className="flex flex-col gap-5">
      {/* Graduação do tatame */}
      <section className="card-raised relative overflow-hidden p-5">
        <div className="pointer-events-none absolute -top-6 -right-4 text-[110px] opacity-[0.06] select-none" aria-hidden>
          🥋
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase" style={{ color: 'var(--ink-3)' }}>
              Dojo · graduação real
            </p>
            <h2 className="font-display text-xl font-extrabold" style={{ color: 'var(--c-jiujitsu)' }}>
              {jjTitle(jjBeltIndex, jjDegree)}
            </h2>
            <p className="mt-0.5 text-sm" style={{ color: 'var(--ink-2)' }}>
              {fmtPts(total)} treino{total === 1 ? '' : 's'} no total · {thisMonth} neste mês
              {jjPromotedAt && (
                <>
                  {' '}· graduado em {new Date(jjPromotedAt + 'T12:00:00').toLocaleDateString('pt-BR')}
                </>
              )}
            </p>
          </div>
          <Belt
            color={belt.color}
            edge={belt.edge}
            degree={jjDegree}
            isBlack={belt.name === 'Faixa Preta'}
          />
          <div className="ml-auto flex items-center gap-5">
            <div className="text-right">
              <p className="label mb-0">Nesta graduação</p>
              <p className="font-mono text-2xl font-bold" style={{ color: 'var(--c-jiujitsu)' }}>
                {fmtPts(sincePromotion)}
              </p>
              <p className="text-xs" style={{ color: 'var(--ink-3)' }}>
                treino{sincePromotion === 1 ? '' : 's'} desde a última faixa/grau
              </p>
            </div>
            {nextTitle &&
              (confirmPromote ? (
                <span className="flex flex-col items-end gap-1.5">
                  <span className="text-xs" style={{ color: 'var(--ink-2)' }}>
                    Virou <strong style={{ color: 'var(--c-jiujitsu)' }}>{nextTitle}</strong> no tatame?
                  </span>
                  <span className="flex gap-2">
                    <button
                      className="btn"
                      style={{ borderColor: 'var(--c-jiujitsu)', color: 'var(--c-jiujitsu)' }}
                      onClick={() => {
                        promoteJJ()
                        setConfirmPromote(false)
                      }}
                    >
                      Sim, oss! 🥋
                    </button>
                    <button className="btn-ghost btn" onClick={() => setConfirmPromote(false)}>
                      Cancelar
                    </button>
                  </span>
                </span>
              ) : (
                <button
                  className="btn"
                  style={{ borderColor: 'var(--c-jiujitsu)', color: 'var(--c-jiujitsu)' }}
                  onClick={() => setConfirmPromote(true)}
                  title={`Registrar graduação para ${nextTitle}`}
                >
                  ⬆️ Evoluir
                </button>
              ))}
          </div>
        </div>
      </section>

      {/* Check-in */}
      <section className="card p-5">
        <SectionTitle>Check-in de treino</SectionTitle>
        <div className="flex flex-wrap items-end gap-4">
          <button
            className={`btn ${trainedToday ? '' : 'btn-gold'} px-6 py-3 text-base`}
            disabled={trainedToday}
            onClick={() => addTraining(today)}
            style={trainedToday ? { opacity: 0.6, cursor: 'default' } : undefined}
          >
            {trainedToday ? '✅ Treino de hoje registrado. Oss!' : `🥋 Registrar treino de hoje (+${weights.jiujitsu} pts)`}
          </button>
          <div className="flex items-end gap-2">
            <div>
              <label className="label" htmlFor="jj-other">Esqueceu um dia? Registre aqui</label>
              <input
                id="jj-other"
                className="input"
                type="date"
                max={today}
                value={otherDay}
                onChange={(e) => setOtherDay(e.target.value)}
              />
            </div>
            <button
              className="btn"
              disabled={!otherDay || trainings.includes(otherDay)}
              onClick={() => {
                if (otherDay) {
                  addTraining(otherDay)
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
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: 'var(--c-jiujitsu)' }} />
              treino feito
            </span>
          }
        >
          Presença — últimas 12 semanas
        </SectionTitle>
        <PresenceMap trainings={trainings} />
      </section>

      {/* Histórico */}
      {recent.length > 0 && (
        <section>
          <SectionTitle>Últimos treinos</SectionTitle>
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
                  <span aria-hidden>🥋</span>
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
                    onClick={() => removeTraining(d)}
                    aria-label={`Remover treino de ${d}`}
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
