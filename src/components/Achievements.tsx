import { motion } from 'motion/react'
import { useStore, unlockedAchievements } from '../store'
import { ACHIEVEMENTS } from '../data/defaults'
import { SectionTitle } from './ui'

export default function Achievements() {
  const tasks = useStore((s) => s.tasks)
  const studyItems = useStore((s) => s.studyItems)
  const ledger = useStore((s) => s.ledger)

  const unlocked = new Set(unlockedAchievements({ tasks, studyItems, ledger }))

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle
        right={
          <span className="font-mono text-xs" style={{ color: 'var(--ink-3)' }}>
            {unlocked.size}/{ACHIEVEMENTS.length}
          </span>
        }
      >
        Salão de conquistas
      </SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ACHIEVEMENTS.map((a, i) => {
          const got = unlocked.has(a.id)
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="card flex items-center gap-3 p-4"
              style={
                got
                  ? { borderColor: 'var(--gold-deep)', background: 'linear-gradient(180deg, rgba(232,180,76,0.08), var(--surface))' }
                  : { opacity: 0.55 }
              }
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl"
                style={{
                  background: got ? 'rgba(232,180,76,0.15)' : 'var(--surface-2)',
                  border: `1px solid ${got ? 'var(--gold-deep)' : 'var(--border)'}`,
                  filter: got ? 'none' : 'grayscale(1)',
                }}
                aria-hidden
              >
                {got ? a.icon : '🔒'}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold" style={{ color: got ? 'var(--gold)' : 'var(--ink-2)' }}>
                  {a.name}
                </p>
                <p className="text-xs" style={{ color: 'var(--ink-3)' }}>
                  {a.desc}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
