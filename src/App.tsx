import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useStore } from './store'
import CharacterHeader from './components/CharacterHeader'
import Dashboard from './components/Dashboard'
import Missions from './components/Missions'
import Study from './components/Study'
import Schedule from './components/Schedule'
import JiuJitsu from './components/JiuJitsu'
import Leitura from './components/Leitura'
import Rewards from './components/Rewards'
import Achievements from './components/Achievements'
import Settings from './components/Settings'

const TABS = [
  { id: 'painel', label: 'Painel', icon: '🏰' },
  { id: 'missoes', label: 'Missões', icon: '⚔️' },
  { id: 'estudos', label: 'Arsenal', icon: '📜' },
  { id: 'grade', label: 'Grade', icon: '🗓️' },
  { id: 'jiujitsu', label: 'Jiu-Jitsu', icon: '🥋' },
  { id: 'leitura', label: 'Leitura', icon: '📚' },
  { id: 'loja', label: 'Loja', icon: '💰' },
  { id: 'conquistas', label: 'Conquistas', icon: '🏆' },
  { id: 'config', label: 'Config', icon: '⚙️' },
] as const

type TabId = (typeof TABS)[number]['id']

function Toasts() {
  const toasts = useStore((s) => s.toasts)
  const dismissToast = useStore((s) => s.dismissToast)
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-80 flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            onClick={() => dismissToast(t.id)}
            className="card-raised pointer-events-auto cursor-pointer px-4 py-3 text-left text-sm font-semibold"
            style={{
              borderColor:
                t.tone === 'xp' ? 'var(--gold-deep)' : t.tone === 'level' ? 'var(--c-jiujitsu)' : 'var(--border-strong)',
              color: t.tone === 'xp' ? 'var(--gold)' : 'var(--ink)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            }}
          >
            {t.text}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState<TabId>('painel')

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-5 px-4 py-6">
      <CharacterHeader />

      <nav
        className="card sticky top-3 z-40 flex gap-1 overflow-x-auto p-1.5"
        style={{ backdropFilter: 'blur(8px)', background: 'rgba(36,28,64,0.9)' }}
        aria-label="Seções do painel"
      >
        {TABS.map((t) => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="relative flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors"
              style={{ color: active ? 'var(--gold)' : 'var(--ink-2)' }}
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-lg"
                  style={{ background: 'var(--surface-3)', border: '1px solid var(--border-strong)' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
              <span className="relative" aria-hidden>
                {t.icon}
              </span>
              <span className="relative">{t.label}</span>
            </button>
          )
        })}
      </nav>

      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {tab === 'painel' && <Dashboard />}
            {tab === 'missoes' && <Missions />}
            {tab === 'estudos' && <Study />}
            {tab === 'grade' && <Schedule />}
            {tab === 'jiujitsu' && <JiuJitsu />}
            {tab === 'leitura' && <Leitura />}
            {tab === 'loja' && <Rewards />}
            {tab === 'conquistas' && <Achievements />}
            {tab === 'config' && <Settings />}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="pb-2 text-center text-[11px]" style={{ color: 'var(--ink-3)' }}>
        Guilda ITA — farme XP, suba de faixa, resgate a recompensa. Oss! 🥋
      </footer>

      <Toasts />
    </div>
  )
}
