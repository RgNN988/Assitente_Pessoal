import { useRef, useState } from 'react'
import { useStore } from '../store'
import { pullNow, useSyncStatus } from '../lib/sync'
import { GROUPS, GROUP_IDS } from '../data/defaults'
import type { Group } from '../types'
import { SectionTitle } from './ui'

export default function Settings() {
  const heroName = useStore((s) => s.heroName)
  const setHeroName = useStore((s) => s.setHeroName)
  const categories = useStore((s) => s.categories)
  const weights = useStore((s) => s.weights)
  const setWeight = useStore((s) => s.setWeight)
  const addCategory = useStore((s) => s.addCategory)
  const updateCategory = useStore((s) => s.updateCategory)
  const deleteCategory = useStore((s) => s.deleteCategory)
  const exportData = useStore((s) => s.exportData)
  const importData = useStore((s) => s.importData)
  const resetPoints = useStore((s) => s.resetPoints)
  const resetAll = useStore((s) => s.resetAll)
  const pushToast = useStore((s) => s.pushToast)

  const sync = useSyncStatus()

  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmPoints, setConfirmPoints] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const [newIcon, setNewIcon] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newGroup, setNewGroup] = useState<Group>('pessoal')
  const [newPoints, setNewPoints] = useState('20')

  const submitNewCategory = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLabel.trim()) return
    addCategory(newLabel.trim(), newIcon.trim(), newGroup, Math.max(0, Number(newPoints) || 0))
    setNewIcon('')
    setNewLabel('')
    setNewPoints('20')
  }

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
        <SectionTitle>Categorias e pontos</SectionTitle>
        <p className="mb-4 text-xs" style={{ color: 'var(--ink-3)' }}>
          Edite nome, ícone, grupo e pontos de cada categoria — ou crie novas.
          Os pontos são o valor padrão de cada missão ao ser criada.
        </p>

        {/* Cabeçalho (só em telas maiores) */}
        <div
          className="mb-1 hidden gap-2 px-1 text-[11px] uppercase tracking-wide sm:grid sm:grid-cols-[3rem_1fr_10rem_5rem_4.5rem]"
          style={{ color: 'var(--ink-3)' }}
        >
          <span>Ícone</span>
          <span>Nome</span>
          <span>Grupo</span>
          <span className="text-center">Pontos</span>
          <span />
        </div>

        <ul className="flex flex-col gap-2">
          {categories.map((c) => (
            <li
              key={c.id}
              className="grid grid-cols-[3rem_1fr_4.5rem] items-center gap-2 sm:grid-cols-[3rem_1fr_10rem_5rem_4.5rem]"
            >
              <input
                className="input px-1 text-center"
                value={c.icon}
                maxLength={4}
                onChange={(e) => updateCategory(c.id, { icon: e.target.value })}
                aria-label={`Ícone de ${c.label}`}
              />
              <input
                className="input min-w-0"
                value={c.label}
                onChange={(e) => updateCategory(c.id, { label: e.target.value })}
                aria-label={`Nome da categoria ${c.label}`}
              />
              <select
                className="input col-start-1 col-end-3 row-start-2 sm:col-auto sm:row-auto"
                value={c.group}
                onChange={(e) => updateCategory(c.id, { group: e.target.value as Group })}
                aria-label={`Grupo de ${c.label}`}
              >
                {GROUP_IDS.map((g) => (
                  <option key={g} value={g}>
                    {GROUPS[g].label}
                  </option>
                ))}
              </select>
              <input
                className="input text-center font-mono"
                type="number"
                min={0}
                value={weights[c.id] ?? 0}
                onChange={(e) => setWeight(c.id, Number(e.target.value))}
                aria-label={`Pontos de ${c.label}`}
              />
              {confirmDelete === c.id ? (
                <span className="col-start-3 row-start-2 flex items-center justify-end gap-1 sm:col-auto sm:row-auto">
                  <button
                    className="btn px-2 py-1 text-xs"
                    style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
                    onClick={() => {
                      deleteCategory(c.id)
                      setConfirmDelete(null)
                    }}
                    aria-label={`Confirmar exclusão de ${c.label}`}
                  >
                    ✓
                  </button>
                  <button
                    className="btn-ghost btn px-2 py-1 text-xs"
                    onClick={() => setConfirmDelete(null)}
                    aria-label="Cancelar exclusão"
                  >
                    ✕
                  </button>
                </span>
              ) : (
                <button
                  className="btn-ghost btn col-start-3 row-start-2 justify-self-end px-2 py-1 text-xs sm:col-auto sm:row-auto sm:justify-self-auto"
                  onClick={() => setConfirmDelete(c.id)}
                  aria-label={`Excluir categoria ${c.label}`}
                  title="Excluir categoria"
                >
                  🗑
                </button>
              )}
            </li>
          ))}
        </ul>

        <form
          onSubmit={submitNewCategory}
          className="mt-4 grid grid-cols-[3rem_1fr] items-center gap-2 border-t pt-4 sm:grid-cols-[3rem_1fr_10rem_5rem_auto]"
          style={{ borderColor: 'var(--border)' }}
        >
          <input
            className="input px-1 text-center"
            placeholder="⭐"
            value={newIcon}
            maxLength={4}
            onChange={(e) => setNewIcon(e.target.value)}
            aria-label="Ícone da nova categoria"
          />
          <input
            className="input min-w-0"
            placeholder="Nova categoria (ex.: Academia)"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            aria-label="Nome da nova categoria"
          />
          <select
            className="input col-start-1 col-end-3 sm:col-auto"
            value={newGroup}
            onChange={(e) => setNewGroup(e.target.value as Group)}
            aria-label="Grupo da nova categoria"
          >
            {GROUP_IDS.map((g) => (
              <option key={g} value={g}>
                {GROUPS[g].label}
              </option>
            ))}
          </select>
          <input
            className="input text-center font-mono"
            type="number"
            min={0}
            value={newPoints}
            onChange={(e) => setNewPoints(e.target.value)}
            aria-label="Pontos da nova categoria"
          />
          <button type="submit" className="btn btn-gold col-start-2 justify-self-end sm:col-auto sm:justify-self-auto">
            ➕ Adicionar
          </button>
        </form>
      </section>

      <section className="card p-5">
        <SectionTitle>Dados</SectionTitle>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="text-sm" style={{ color: sync.status === 'error' ? 'var(--danger)' : 'var(--ink-3)' }}>
            {sync.status === 'syncing' && '☁️ Sincronizando…'}
            {sync.status === 'ok' &&
              `☁️ Sincronizado entre seus dispositivos${
                sync.lastSyncAt
                  ? ` · ${new Date(sync.lastSyncAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                  : ''
              }`}
            {sync.status === 'error' && '⚠️ Sem conexão com a nuvem — dados salvos só neste aparelho'}
            {sync.status === 'idle' && '☁️ Preparando sincronização…'}
          </span>
          <button className="btn px-3 py-1 text-xs" onClick={() => void pullNow()}>
            🔄 Sincronizar agora
          </button>
        </div>
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
          Seus dados são sincronizados automaticamente na nuvem entre computador e celular.
          O backup manual continua disponível por garantia.
        </p>
      </section>
    </div>
  )
}
