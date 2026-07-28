import { useState } from 'react'
import { useStore } from '../store'
import { DAY_NAMES, EVENT_KINDS, TURMAS } from '../data/defaults'
import { minutes } from '../lib/helpers'
import type { EventKind } from '../types'
import { Modal, SectionTitle } from './ui'

const START = 7 * 60 // 07:00
const END = 22 * 60 // 22:00
const SPAN = END - START
const GRID_H = 640

export default function Schedule() {
  const schedule = useStore((s) => s.schedule)
  const turma = useStore((s) => s.turma)
  const setTurma = useStore((s) => s.setTurma)
  const addEvent = useStore((s) => s.addEvent)
  const deleteEvent = useStore((s) => s.deleteEvent)

  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [day, setDay] = useState(0)
  const [start, setStart] = useState('18:00')
  const [end, setEnd] = useState('19:00')
  const [kind, setKind] = useState<EventKind>('outro')

  // Hoje: JS domingo=0 → nossa escala segunda=0
  const todayCol = (new Date().getDay() + 6) % 7

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || minutes(end) <= minutes(start)) return
    addEvent({ title: title.trim(), day, start, end, kind })
    setTitle('')
    setOpen(false)
  }

  const hours: number[] = []
  for (let h = 7; h <= 21; h++) hours.push(h)

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle
        right={
          <div className="flex items-center gap-2">
            <label className="text-xs" style={{ color: 'var(--ink-3)' }} htmlFor="turma-sel">
              Turma
            </label>
            <select
              id="turma-sel"
              className="input w-20 py-1.5"
              value={turma}
              onChange={(e) => setTurma(Number(e.target.value))}
            >
              {TURMAS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <button className="btn" onClick={() => setOpen(true)}>
              ＋ Compromisso
            </button>
          </div>
        }
      >
        Grade da semana
      </SectionTitle>

      <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--ink-2)' }}>
        {Object.entries(EVENT_KINDS).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: v.ink }} />
            {v.label}
          </span>
        ))}
      </div>

      <div className="card overflow-x-auto p-4">
        <div className="min-w-[860px]">
          <div className="grid" style={{ gridTemplateColumns: '48px repeat(7, 1fr)' }}>
            <div />
            {DAY_NAMES.map((d, i) => (
              <div
                key={d}
                className="pb-2 text-center text-xs font-bold tracking-widest uppercase"
                style={{ color: i === todayCol ? 'var(--gold)' : 'var(--ink-3)' }}
              >
                {d}
                {i === todayCol ? ' ●' : ''}
              </div>
            ))}
          </div>

          <div className="grid" style={{ gridTemplateColumns: '48px repeat(7, 1fr)' }}>
            {/* réguas de hora */}
            <div className="relative" style={{ height: GRID_H }}>
              {hours.map((h) => (
                <span
                  key={h}
                  className="absolute right-2 font-mono text-[10px]"
                  style={{ top: ((h * 60 - START) / SPAN) * GRID_H - 6, color: 'var(--ink-3)' }}
                >
                  {String(h).padStart(2, '0')}h
                </span>
              ))}
            </div>

            {DAY_NAMES.map((_, dayIdx) => (
              <div
                key={dayIdx}
                className="relative border-l"
                style={{
                  height: GRID_H,
                  borderColor: 'var(--border)',
                  background: dayIdx === todayCol ? 'rgba(232,180,76,0.04)' : 'transparent',
                }}
              >
                {hours.map((h) => (
                  <div
                    key={h}
                    className="absolute right-0 left-0 border-t"
                    style={{ top: ((h * 60 - START) / SPAN) * GRID_H, borderColor: 'var(--border)', opacity: 0.5 }}
                  />
                ))}
                {schedule
                  .filter((e) => e.day === dayIdx)
                  .map((e) => {
                    const top = ((minutes(e.start) - START) / SPAN) * GRID_H
                    const height = Math.max(18, ((minutes(e.end) - minutes(e.start)) / SPAN) * GRID_H)
                    const style = EVENT_KINDS[e.kind] ?? EVENT_KINDS.outro
                    return (
                      <div
                        key={e.id}
                        className="group absolute right-0.5 left-0.5 overflow-hidden rounded-md border px-1.5 py-1"
                        style={{
                          top,
                          height,
                          background: style.color,
                          borderColor: style.ink + '55',
                        }}
                        title={`${e.title} · ${e.start}–${e.end}`}
                      >
                        <p className="truncate text-[11px] leading-tight font-bold" style={{ color: style.ink }}>
                          {e.title}
                        </p>
                        <p className="font-mono text-[9px]" style={{ color: 'var(--ink-2)' }}>
                          {e.start}–{e.end}
                        </p>
                        <button
                          className="absolute top-0.5 right-0.5 hidden cursor-pointer rounded px-1 text-[10px] group-hover:block"
                          style={{ background: 'rgba(0,0,0,0.45)', color: 'var(--ink)' }}
                          onClick={() => deleteEvent(e.id)}
                          aria-label={`Excluir ${e.title}`}
                        >
                          ✕
                        </button>
                      </div>
                    )
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal open={open} title="Novo compromisso" onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div>
            <label className="label" htmlFor="ev-title">Título</label>
            <input
              id="ev-title"
              className="input"
              placeholder="Ex.: Reunião ITA Júnior"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="ev-day">Dia</label>
              <select id="ev-day" className="input" value={day} onChange={(e) => setDay(Number(e.target.value))}>
                {DAY_NAMES.map((d, i) => (
                  <option key={d} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="ev-kind">Tipo</label>
              <select id="ev-kind" className="input" value={kind} onChange={(e) => setKind(e.target.value as EventKind)}>
                {Object.entries(EVENT_KINDS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="ev-start">Início</label>
              <input id="ev-start" className="input" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="ev-end">Fim</label>
              <input id="ev-end" className="input" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="btn btn-gold">
            Adicionar à grade
          </button>
        </form>
      </Modal>
    </div>
  )
}
