import { useState } from 'react'
import { motion } from 'motion/react'
import { useStore } from '../store'
import { balance, fmtPts } from '../lib/helpers'
import { SectionTitle } from './ui'

export default function Rewards() {
  const rewards = useStore((s) => s.rewards)
  const ledger = useStore((s) => s.ledger)
  const addReward = useStore((s) => s.addReward)
  const deleteReward = useStore((s) => s.deleteReward)
  const redeemReward = useStore((s) => s.redeemReward)

  const pts = balance(ledger)
  const redeemed = ledger.filter((e) => e.group === 'resgate')

  const [name, setName] = useState('')
  const [cost, setCost] = useState('')
  const [icon, setIcon] = useState('🎁')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !Number(cost)) return
    addReward(name.trim(), Math.max(1, Number(cost)), icon || '🎁')
    setName('')
    setCost('')
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="card-raised flex items-center justify-between gap-4 px-5 py-4">
        <div>
          <p className="label mb-0">Seu tesouro</p>
          <p className="font-mono text-3xl font-bold" style={{ color: 'var(--gold)' }}>
            {fmtPts(pts)} <span className="text-sm" style={{ color: 'var(--ink-3)' }}>pts</span>
          </p>
        </div>
        <p className="max-w-xs text-right text-xs" style={{ color: 'var(--ink-3)' }}>
          Farme pontos completando missões e estudos. Gaste aqui sem culpa — recompensa faz parte do treino.
        </p>
      </div>

      <section>
        <SectionTitle>Loja da guilda</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...rewards]
            .sort((a, b) => a.cost - b.cost)
            .map((r) => {
              const affordable = pts >= r.cost
              const pct = Math.min(100, Math.round((pts / r.cost) * 100))
              return (
                <motion.div
                  key={r.id}
                  layout
                  className="card group relative flex flex-col gap-2 p-4"
                  whileHover={{ y: -2 }}
                >
                  <button
                    className="absolute top-2 right-2 hidden cursor-pointer rounded px-1.5 text-xs group-hover:block"
                    style={{ background: 'var(--surface-3)', color: 'var(--ink-3)' }}
                    onClick={() => deleteReward(r.id)}
                    aria-label={`Excluir ${r.name}`}
                  >
                    ✕
                  </button>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl" aria-hidden>
                      {r.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{r.name}</p>
                      <p className="font-mono text-xs" style={{ color: 'var(--gold)' }}>
                        {fmtPts(r.cost)} pts
                      </p>
                    </div>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--bg)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: affordable ? 'var(--good)' : 'linear-gradient(90deg, var(--gold-deep), var(--gold))',
                      }}
                    />
                  </div>
                  <button
                    className={`btn ${affordable ? 'btn-gold' : ''} w-full`}
                    disabled={!affordable}
                    onClick={() => redeemReward(r.id)}
                    style={!affordable ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                  >
                    {affordable ? '💰 Resgatar' : `Faltam ${fmtPts(r.cost - pts)} pts`}
                  </button>
                </motion.div>
              )
            })}
        </div>
      </section>

      <section className="card-raised p-5">
        <SectionTitle>Criar recompensa</SectionTitle>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[64px_1fr_auto_auto]">
          <input
            className="input text-center"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            aria-label="Emoji da recompensa"
            maxLength={4}
          />
          <input
            className="input"
            placeholder="Ex.: Tarde de futebol com os amigos"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Nome da recompensa"
          />
          <input
            className="input sm:w-28"
            type="number"
            min={1}
            placeholder="Custo"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            aria-label="Custo em pontos"
          />
          <button type="submit" className="btn btn-gold">
            Adicionar
          </button>
        </form>
      </section>

      {redeemed.length > 0 && (
        <section>
          <SectionTitle>Resgates</SectionTitle>
          <ul className="flex flex-col gap-1.5">
            {[...redeemed].reverse().map((e) => (
              <li key={e.id} className="card flex items-center gap-3 px-4 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate" style={{ color: 'var(--ink-2)' }}>
                  {e.label}
                </span>
                <span className="font-mono text-xs" style={{ color: 'var(--c-pessoal)' }}>
                  {fmtPts(e.points)} pts
                </span>
                <span className="font-mono text-[10px]" style={{ color: 'var(--ink-3)' }}>
                  {new Date(e.ts).toLocaleDateString('pt-BR')}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
