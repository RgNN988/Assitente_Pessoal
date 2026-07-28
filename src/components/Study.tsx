import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useStore } from '../store'
import { fmtPts } from '../lib/helpers'
import { DEFAULT_WEIGHTS } from '../data/defaults'
import type { StudyItem, StudyKind } from '../types'
import { EmptyState, SectionTitle } from './ui'

const KINDS: Record<StudyKind, { label: string; icon: string }> = {
  prova: { label: 'Estudo de prova', icon: '⚔️' },
  lista: { label: 'Lista de exercícios', icon: '📜' },
  material: { label: 'Material / leitura', icon: '📖' },
}

const KIND_TO_CATEGORY = { prova: 'prova', lista: 'lista', material: 'material' } as const

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - now.getTime()) / 86400000)
}

function StudyRow({ item }: { item: StudyItem }) {
  const setStudyProgress = useStore((s) => s.setStudyProgress)
  const deleteStudyItem = useStore((s) => s.deleteStudyItem)
  const finished = item.doneUnits >= item.totalUnits
  const pct = Math.round((item.doneUnits / item.totalUnits) * 100)
  const days = item.examDate ? daysUntil(item.examDate) : null

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 30 }}
      className="card p-4"
      style={finished ? { opacity: 0.55 } : undefined}
    >
      <div className="flex items-center gap-3">
        <span className="text-lg" aria-hidden>
          {KINDS[item.kind].icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold" style={{ color: 'var(--ink)' }}>
            <span style={{ color: 'var(--gold)' }}>{item.subject}</span> · {item.title}
          </p>
          <p className="text-xs" style={{ color: 'var(--ink-3)' }}>
            {KINDS[item.kind].label}
            {days !== null && !finished && (
              <span
                className="ml-2 rounded px-1.5 py-0.5 font-semibold"
                style={{
                  background: days <= 3 ? 'rgba(224,82,82,0.18)' : 'var(--surface-3)',
                  color: days <= 3 ? '#f08c8c' : 'var(--ink-2)',
                }}
              >
                {days < 0 ? 'prova passou' : days === 0 ? '⚠️ prova HOJE' : `prova em ${days}d`}
              </span>
            )}
          </p>
        </div>
        <span className="font-mono text-xs font-bold" style={{ color: 'var(--gold)' }}>
          {fmtPts(item.awarded)}/{fmtPts(item.points)} pts
        </span>
        <button
          className="btn-ghost btn px-2 py-1 text-xs"
          onClick={() => deleteStudyItem(item.id)}
          aria-label={`Excluir ${item.title}`}
        >
          🗑
        </button>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          className="btn px-2.5 py-1 text-sm"
          onClick={() => setStudyProgress(item.id, item.doneUnits - 1)}
          disabled={item.doneUnits <= 0}
          aria-label="Diminuir progresso"
        >
          −
        </button>
        <div className="relative h-3 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{
              background: finished
                ? 'linear-gradient(90deg, #3a8a63, var(--good))'
                : 'linear-gradient(90deg, var(--gold-deep), var(--gold))',
            }}
            animate={{ width: `${pct}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
        </div>
        <button
          className="btn px-2.5 py-1 text-sm"
          onClick={() => setStudyProgress(item.id, item.doneUnits + 1)}
          disabled={finished}
          aria-label="Avançar progresso"
        >
          +
        </button>
        <span className="w-16 text-right font-mono text-xs" style={{ color: 'var(--ink-2)' }}>
          {item.doneUnits}/{item.totalUnits} {finished ? '🏁' : ''}
        </span>
      </div>
    </motion.li>
  )
}

export default function Study() {
  const studyItems = useStore((s) => s.studyItems)
  const weights = useStore((s) => s.weights)
  const addStudyItem = useStore((s) => s.addStudyItem)

  const [subject, setSubject] = useState('')
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<StudyKind>('lista')
  const [units, setUnits] = useState('10')
  const [points, setPoints] = useState('')
  const [examDate, setExamDate] = useState('')

  const suggested =
    (weights[KIND_TO_CATEGORY[kind]] ?? DEFAULT_WEIGHTS[KIND_TO_CATEGORY[kind]]) *
    Math.max(1, Math.ceil(Number(units || 1) / 5))

  const open = studyItems.filter((i) => i.doneUnits < i.totalUnits)
  const finished = studyItems.filter((i) => i.doneUnits >= i.totalUnits)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !subject.trim()) return
    const total = Math.max(1, Number(units) || 1)
    addStudyItem({
      title: title.trim(),
      subject: subject.trim().toUpperCase(),
      kind,
      totalUnits: total,
      points: points ? Math.max(1, Number(points)) : suggested,
      examDate: examDate || null,
    })
    setTitle('')
    setPoints('')
    setExamDate('')
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="card-raised p-5">
        <SectionTitle>Adicionar ao arsenal</SectionTitle>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="label" htmlFor="st-subject">Matéria</label>
            <input
              id="st-subject"
              className="input"
              placeholder="Ex.: MAT-22"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              list="subjects"
            />
            <datalist id="subjects">
              {['MAT-22', 'MAT-27', 'FIS-15', 'FIS-16', 'QUI-28', 'CES-11', 'HUM-01', 'HUM-70'].map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="label" htmlFor="st-title">Item</label>
            <input
              id="st-title"
              className="input"
              placeholder="Ex.: Lista 12 — Integrais"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="st-kind">Tipo</label>
            <select id="st-kind" className="input" value={kind} onChange={(e) => setKind(e.target.value as StudyKind)}>
              {(Object.keys(KINDS) as StudyKind[]).map((k) => (
                <option key={k} value={k}>
                  {KINDS[k].icon} {KINDS[k].label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="st-units">Etapas (exercícios/sessões)</label>
            <input
              id="st-units"
              className="input"
              type="number"
              min={1}
              value={units}
              onChange={(e) => setUnits(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="st-points">Pontos ao completar</label>
            <input
              id="st-points"
              className="input"
              type="number"
              min={1}
              placeholder={`sugestão: ${suggested}`}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="st-exam">Data da prova (opcional)</label>
            <input
              id="st-exam"
              className="input"
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <button type="submit" className="btn btn-gold w-full sm:w-auto">
              📜 Adicionar ao arsenal
            </button>
          </div>
        </form>
      </section>

      <section>
        <SectionTitle
          right={
            <span className="text-xs" style={{ color: 'var(--ink-3)' }}>
              {open.length} em aberto
            </span>
          }
        >
          Arsenal de estudos
        </SectionTitle>
        {open.length === 0 ? (
          <EmptyState
            icon="🗡️"
            text="Arsenal vazio"
            hint="Adicione listas, provas e materiais — cada avanço rende XP proporcional."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            <AnimatePresence mode="popLayout">
              {open.map((i) => (
                <StudyRow key={i.id} item={i} />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>

      {finished.length > 0 && (
        <section>
          <SectionTitle>Dominados 🏁</SectionTitle>
          <ul className="flex flex-col gap-2">
            <AnimatePresence mode="popLayout">
              {finished.map((i) => (
                <StudyRow key={i.id} item={i} />
              ))}
            </AnimatePresence>
          </ul>
        </section>
      )}
    </div>
  )
}
