import { motion } from 'motion/react'
import { useStore } from '../store'
import { balance, fmtPts, rankFor, streakDays, totalXp } from '../lib/helpers'

/** Faixa de jiu-jitsu com graus — o "nível" do personagem. */
export function Belt({ color, edge, degree, isBlack }: { color: string; edge: string; degree: number; isBlack: boolean }) {
  return (
    <div
      className="relative h-6 w-40 shrink-0 overflow-hidden rounded"
      style={{ background: color, border: `1px solid ${edge}` }}
      aria-hidden
    >
      {/* textura do tecido */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          background:
            'repeating-linear-gradient(90deg, transparent 0 6px, rgba(0,0,0,0.25) 6px 7px)',
        }}
      />
      {/* ponteira (onde entram os graus) */}
      <div
        className="absolute top-0 right-4 flex h-full w-14 items-center justify-center gap-1"
        style={{ background: isBlack ? '#d1452f' : '#17131f' }}
      >
        {Array.from({ length: degree }).map((_, i) => (
          <span key={i} className="h-full w-1" style={{ background: 'var(--gold)' }} />
        ))}
      </div>
    </div>
  )
}

export default function CharacterHeader() {
  const ledger = useStore((s) => s.ledger)
  const heroName = useStore((s) => s.heroName)

  const xp = totalXp(ledger)
  const pts = balance(ledger)
  const streak = streakDays(ledger)
  const rank = rankFor(xp)

  return (
    <header className="card-raised relative overflow-hidden p-5">
      {/* brasão de fundo */}
      <div
        className="pointer-events-none absolute -top-8 -right-6 text-[120px] opacity-[0.06] select-none"
        aria-hidden
      >
        ⚔️
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.18em] uppercase" style={{ color: 'var(--ink-3)' }}>
            Guilda ITA · 1º Fund
          </p>
          <h1 className="font-display truncate text-2xl font-extrabold" style={{ color: 'var(--gold)' }}>
            {heroName}
          </h1>
          <p className="mt-0.5 text-sm font-semibold" style={{ color: 'var(--ink-2)' }}>
            {rank.title}
          </p>
        </div>

        <Belt
          color={rank.belt.color}
          edge={rank.belt.edge}
          degree={rank.degree}
          isBlack={rank.belt.name === 'Faixa Preta'}
        />

        <div className="ml-auto flex items-center gap-6 text-right">
          <div>
            <p className="label mb-0">Saldo</p>
            <p className="font-mono text-xl font-bold" style={{ color: 'var(--gold)' }}>
              {fmtPts(pts)} <span className="text-xs font-medium" style={{ color: 'var(--ink-3)' }}>pts</span>
            </p>
          </div>
          <div>
            <p className="label mb-0">XP total</p>
            <p className="font-mono text-xl font-bold">{fmtPts(xp)}</p>
          </div>
          <div>
            <p className="label mb-0">Sequência</p>
            <p className="font-mono text-xl font-bold" style={{ color: streak > 0 ? 'var(--ember)' : 'var(--ink-3)' }}>
              {streak > 0 ? `🔥 ${streak}d` : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Barra de XP até o próximo grau/faixa */}
      <div className="mt-4">
        <div className="mb-1 flex items-baseline justify-between text-xs">
          <span style={{ color: 'var(--ink-3)' }}>
            Progresso para {rank.degree >= 4 ? 'a próxima faixa' : `o ${rank.degree + 1}º grau`}
          </span>
          <span className="font-mono" style={{ color: 'var(--ink-2)' }}>
            {fmtPts(xp)} / {fmtPts(rank.nextAt)} XP
          </span>
        </div>
        <div
          className="relative h-3.5 overflow-hidden rounded-full"
          style={{ background: 'var(--bg)', border: '1px solid var(--border-strong)' }}
          role="progressbar"
          aria-valuenow={Math.round(rank.progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso de XP"
        >
          <motion.div
            className="relative h-full overflow-hidden rounded-full"
            style={{ background: 'linear-gradient(90deg, var(--gold-deep), var(--gold))' }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(2, rank.progress * 100)}%` }}
            transition={{ type: 'spring', stiffness: 60, damping: 18 }}
          >
            <div
              className="xp-shine absolute inset-y-0 w-16"
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)',
              }}
            />
          </motion.div>
        </div>
      </div>
    </header>
  )
}
