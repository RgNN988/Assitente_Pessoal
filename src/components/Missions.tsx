import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useStore } from '../store'
import { GROUPS, categoryInfo } from '../data/defaults'
import type { CategoryId, Task } from '../types'
import { EmptyState, SectionTitle } from './ui'

function TaskRow({ task }: { task: Task }) {
  const toggleTask = useStore((s) => s.toggleTask)
  const deleteTask = useStore((s) => s.deleteTask)
  const categories = useStore((s) => s.categories)
  const cat = categoryInfo(categories, task.category)
  const done = !!task.doneAt

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 30 }}
      className="card flex items-center gap-3 px-4 py-3"
      style={done ? { opacity: 0.55 } : undefined}
    >
      <button
        onClick={() => toggleTask(task.id)}
        aria-label={done ? `Desfazer ${task.title}` : `Completar ${task.title}`}
        className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md border text-xs font-bold transition-colors"
        style={{
          borderColor: done ? 'var(--gold)' : 'var(--border-strong)',
          background: done ? 'linear-gradient(180deg, #f0c465, var(--gold-deep))' : 'transparent',
          color: '#241a05',
        }}
      >
        {done ? '✓' : ''}
      </button>
      <span className="text-lg" aria-hidden>
        {cat.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className="truncate text-sm font-semibold"
          style={{ color: 'var(--ink)', textDecoration: done ? 'line-through' : 'none' }}
        >
          {task.title}
        </p>
        <p className="text-xs" style={{ color: 'var(--ink-3)' }}>
          {cat.label} · {GROUPS[cat.group].label}
        </p>
      </div>
      <span className="font-mono text-sm font-bold" style={{ color: 'var(--gold)' }}>
        +{task.points}
      </span>
      <button
        className="btn-ghost btn px-2 py-1 text-xs"
        onClick={() => deleteTask(task.id)}
        aria-label={`Excluir ${task.title}`}
      >
        🗑
      </button>
    </motion.li>
  )
}

export default function Missions() {
  const tasks = useStore((s) => s.tasks)
  const weights = useStore((s) => s.weights)
  const categories = useStore((s) => s.categories)
  const addTask = useStore((s) => s.addTask)

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<CategoryId>('prova')
  const [points, setPoints] = useState('')

  // Se a categoria selecionada foi excluída, cai na primeira disponível.
  const activeCategory = categories.some((c) => c.id === category)
    ? category
    : categories[0]?.id ?? ''

  const pending = tasks.filter((t) => !t.doneAt)
  const done = tasks.filter((t) => t.doneAt)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !activeCategory) return
    const pts = points ? Math.max(1, Number(points)) : undefined
    addTask(title.trim(), activeCategory, pts)
    setTitle('')
    setPoints('')
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="card-raised p-5">
        <SectionTitle>Nova missão</SectionTitle>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
          <input
            className="input"
            placeholder="Ex.: Estudar MAT-22 para a prova de terça"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Título da missão"
          />
          <select
            className="input sm:w-56"
            value={activeCategory}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Categoria"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.label} (+{weights[c.id] ?? 0})
              </option>
            ))}
          </select>
          <input
            className="input sm:w-24"
            type="number"
            min={1}
            placeholder={`+${weights[activeCategory] ?? 0}`}
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            aria-label="Pontos personalizados (opcional)"
            title="Pontos (opcional — usa o padrão da categoria)"
          />
          <button type="submit" className="btn btn-gold">
            ⚔️ Aceitar missão
          </button>
        </form>
      </section>

      <section>
        <SectionTitle
          right={
            <span className="text-xs" style={{ color: 'var(--ink-3)' }}>
              {pending.length} pendente{pending.length === 1 ? '' : 's'}
            </span>
          }
        >
          Missões ativas
        </SectionTitle>
        {pending.length === 0 ? (
          <EmptyState
            icon="🏕️"
            text="Nenhuma missão ativa"
            hint="Aceite uma missão acima — estudar para prova é a que mais rende XP."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            <AnimatePresence mode="popLayout">
              {pending.map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>

      {done.length > 0 && (
        <section>
          <SectionTitle
            right={
              <span className="text-xs" style={{ color: 'var(--ink-3)' }}>
                {done.length} concluída{done.length === 1 ? '' : 's'}
              </span>
            }
          >
            Concluídas
          </SectionTitle>
          <ul className="flex flex-col gap-2">
            <AnimatePresence mode="popLayout">
              {done.map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
            </AnimatePresence>
          </ul>
        </section>
      )}
    </div>
  )
}
