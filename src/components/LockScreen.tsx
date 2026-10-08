import { useState } from 'react'
import { unlock, useSyncStatus } from '../lib/sync'

/** Tela exibida enquanto o dispositivo não tem a senha do painel ou carrega a nuvem. */
export default function LockScreen() {
  const status = useSyncStatus((s) => s.status)
  const error = useSyncStatus((s) => s.error)
  const [pass, setPass] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pass) return
    setBusy(true)
    const ok = await unlock(pass)
    setBusy(false)
    if (!ok) setPass('')
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-4">
      <div className="card-raised flex flex-col gap-4 p-6">
        <div className="text-center">
          <div className="text-4xl" aria-hidden>
            🏰
          </div>
          <h1 className="mt-2 text-lg font-bold" style={{ color: 'var(--gold)' }}>
            Guilda ITA
          </h1>
        </div>
        {status === 'loading' ? (
          <p className="text-center text-sm" style={{ color: 'var(--ink-2)' }}>
            ☁️ Carregando seus dados…
          </p>
        ) : (
          <form className="flex flex-col gap-3" onSubmit={submit}>
            <label className="text-sm" style={{ color: 'var(--ink-2)' }} htmlFor="lock-pass">
              Senha do painel
            </label>
            <input
              id="lock-pass"
              type="password"
              className="input"
              autoFocus
              autoComplete="current-password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
            />
            {error && (
              <p className="text-xs" style={{ color: 'var(--danger)' }}>
                {error}
              </p>
            )}
            <button className="btn-gold btn" disabled={busy || !pass}>
              {busy ? 'Verificando…' : 'Entrar'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
