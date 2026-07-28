import { useRef, useState } from 'react'
import { useStore } from '../store'
import { CATEGORIES, CATEGORY_IDS } from '../data/defaults'
import { SectionTitle } from './ui'

export default function Settings() {
  const heroName = useStore((s) => s.heroName)
  const setHeroName = useStore((s) => s.setHeroName)
  const weights = useStore((s) => s.weights)
  const setWeight = useStore((s) => s.setWeight)
  const exportData = useStore((s) => s.exportData)
  const importData = useStore((s) => s.importData)
  const resetPoints = useStore((s) => s.resetPoints)
  const resetAll = useStore((s) => s.resetAll)
  const pushToast = useStore((s) => s.pushToast)

  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmPoints, setConfirmPoints] = useState(false)

  const doExport = () => {
    const blob = new Blob([exportData()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `guilda-ita-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const doImport = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const ok = importData(String(reader.result))
      pushToast(ok ? '📦 Dados importados!' : 'Arquivo inválido — importação cancelada', ok ? 'level' : 'spend')
    }
    reader.readAsText(file)
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="card-raised p-5">
        <SectionTitle>Personagem</SectionTitle>
        <label className="label" htmlFor="hero-name">Nome do guerreiro</label>
        <input
          id="hero-name"
          className="input max-w-sm"
          value={heroName}
          onChange={(e) => setHeroName(e.target.value)}
        />
      </section>

      <section className="card p-5">
        <SectionTitle>Pontos por categoria</SectionTitle>
        <p className="mb-4 text-xs" style={{ color: 'var(--ink-3)' }}>
          Valor padrão de cada missão ao ser criada (você ainda pode personalizar missão a missão).
          Estudo para prova deve seguir sendo o mais valioso.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORY_IDS.map((c) => (
            <div key={c} className="flex items-center gap-3">
              <span className="text-lg" aria-hidden>
                {CATEGORIES[c].icon}
              </span>
              <label className="min-w-0 flex-1 text-sm" style={{ color: 'var(--ink-2)' }} htmlFor={`w-${c}`}>
                {CATEGORIES[c].label}
              </label>
              <input
                id={`w-${c}`}
                className="input w-20 text-center font-mono"
                type="number"
                min={0}
                value={weights[c]}
                onChange={(e) => setWeight(c, Number(e.target.value))}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <SectionTitle>Dados</SectionTitle>
        <div className="flex flex-wrap gap-3">
          <button className="btn" onClick={doExport}>
            ⬇️ Exportar backup (JSON)
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            ⬆️ Importar backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) doImport(f)
              e.target.value = ''
            }}
          />
          {confirmPoints ? (
            <span className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--gold)' }}>
                Zerar XP, saldo e sequência? (missões, arsenal, loja e grade ficam)
              </span>
              <button
                className="btn"
                style={{ borderColor: 'var(--gold-deep)', color: 'var(--gold)' }}
                onClick={() => {
                  resetPoints()
                  setConfirmPoints(false)
                }}
              >
                Sim, nova temporada
              </button>
              <button className="btn-ghost btn" onClick={() => setConfirmPoints(false)}>
                Cancelar
              </button>
            </span>
          ) : (
            <button
              className="btn"
              style={{ borderColor: 'var(--gold-deep)', color: 'var(--gold)' }}
              onClick={() => setConfirmPoints(true)}
            >
              🌅 Zerar pontos
            </button>
          )}
          {confirmReset ? (
            <span className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--danger)' }}>
                Apagar TUDO (missões, XP, histórico)?
              </span>
              <button
                className="btn"
                style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
                onClick={() => {
                  resetAll()
                  setConfirmReset(false)
                }}
              >
                Sim, zerar
              </button>
              <button className="btn-ghost btn" onClick={() => setConfirmReset(false)}>
                Cancelar
              </button>
            </span>
          ) : (
            <button
              className="btn"
              style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
              onClick={() => setConfirmReset(true)}
            >
              🗑 Zerar tudo
            </button>
          )}
        </div>
        <p className="mt-3 text-xs" style={{ color: 'var(--ink-3)' }}>
          Os dados vivem no localStorage deste navegador. Exporte um backup de vez em quando.
        </p>
      </section>
    </div>
  )
}
