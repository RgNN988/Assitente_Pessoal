// API de sincronização do painel Guilda ITA.
// Guarda um único JSON ({ savedAt, data }) num Vercel Blob privado.
//
// GET                    -> devolve o estado salvo (ou null se a nuvem estiver vazia)
// GET ?history=1         -> lista os backups ({ pathname, uploadedAt }[])
// GET ?snapshot=<path>   -> devolve um backup
// PUT { savedAt, baseSavedAt, data }
//                        -> substitui o estado salvo, mas SÓ se `baseSavedAt`
//                           for a versão que está na nuvem agora. Se outro
//                           dispositivo salvou antes, responde 409 com o estado
//                           atual para o cliente mesclar (nunca sobrescreve às cegas).
//
// Protegida pela senha do painel (header x-sync-key = env SYNC_KEY). A senha é
// digitada pelo usuário em cada dispositivo — não vai embutida no site.
//
// Backups: antes da primeira gravação de cada hora, o estado anterior é copiado
// para guilda/history/<AAAA-MM-DDTHH>.json; antes de qualquer gravação que
// remova registros (zerar, apagar), sempre. Backups com mais de 60 dias são apagados.
import { timingSafeEqual } from 'node:crypto'
import { del, get, list, put } from '@vercel/blob'

const PATHNAME = 'guilda/state.json'
const HISTORY_PREFIX = 'guilda/history/'
const HISTORY_DAYS = 60

function keyOk(given, expected) {
  const a = Buffer.from(String(given ?? ''))
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

async function readJson(pathname) {
  let result = null
  try {
    result = await get(pathname, { access: 'private', useCache: false })
  } catch (err) {
    if (err?.name !== 'BlobNotFoundError') throw err
  }
  if (!result || !result.stream) return null
  return new Response(result.stream).text()
}

/** Quantidade de registros — se a nova versão tiver menos, algo está sendo apagado. */
function size(data) {
  const n = (v) => (Array.isArray(v) ? v.length : 0)
  return n(data?.ledger) + n(data?.trainings) + n(data?.readings) + n(data?.tasks) + n(data?.studyItems)
}

async function backup(currentText, removesData) {
  // Gravação que apaga dados: backup próprio, sempre. Demais: um por hora.
  const slot = removesData
    ? new Date().toISOString().replace(/[:.]/g, '-')
    : new Date().toISOString().slice(0, 13) // AAAA-MM-DDTHH (UTC)
  const pathname = `${HISTORY_PREFIX}${slot}.json`
  const { blobs } = await list({ prefix: HISTORY_PREFIX })
  if (blobs.some((b) => b.pathname === pathname)) return
  await put(pathname, currentText, {
    access: 'private',
    allowOverwrite: true,
    contentType: 'application/json',
  })
  const cutoff = Date.now() - HISTORY_DAYS * 86_400_000
  const old = blobs.filter((b) => new Date(b.uploadedAt).getTime() < cutoff).map((b) => b.url)
  if (old.length) await del(old)
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'content-type, x-sync-key')
  res.setHeader('Cache-Control', 'no-store')
  if (req.method === 'OPTIONS') return res.status(204).end()

  const key = process.env.SYNC_KEY
  if (!key) return res.status(500).json({ error: 'SYNC_KEY não configurada no servidor' })
  if (!keyOk(req.headers['x-sync-key'], key)) {
    // Atraso para dificultar tentativas de adivinhar a senha.
    await new Promise((r) => setTimeout(r, 1000))
    return res.status(401).json({ error: 'senha inválida' })
  }

  try {
    if (req.method === 'GET') {
      if (req.query.history) {
        const { blobs } = await list({ prefix: HISTORY_PREFIX })
        const items = blobs
          .map((b) => ({ pathname: b.pathname, uploadedAt: new Date(b.uploadedAt).toISOString() }))
          .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
        return res.status(200).json(items)
      }
      if (req.query.snapshot) {
        const pathname = String(req.query.snapshot)
        if (!pathname.startsWith(HISTORY_PREFIX) || pathname.includes('..')) {
          return res.status(400).json({ error: 'backup inválido' })
        }
        const text = await readJson(pathname)
        if (text === null) return res.status(404).json({ error: 'backup não encontrado' })
        res.setHeader('Content-Type', 'application/json')
        return res.status(200).send(text)
      }
      const text = await readJson(PATHNAME)
      if (text === null) return res.status(200).json(null)
      res.setHeader('Content-Type', 'application/json')
      return res.status(200).send(text)
    }

    if (req.method === 'PUT') {
      const body = req.body
      if (
        !body ||
        typeof body.savedAt !== 'number' ||
        typeof body.baseSavedAt !== 'number' ||
        !body.data ||
        !Array.isArray(body.data.ledger)
      ) {
        return res.status(400).json({ error: 'corpo inválido' })
      }

      const currentText = await readJson(PATHNAME)
      const current = currentText ? JSON.parse(currentText) : null
      const currentSavedAt = current?.savedAt ?? 0
      if (currentSavedAt !== body.baseSavedAt) {
        // Outro dispositivo salvou depois da última sincronização deste.
        return res.status(409).json({ error: 'conflito', current })
      }

      if (currentText) await backup(currentText, size(body.data) < size(current.data))

      // Garante versão estritamente crescente mesmo com relógios desajustados.
      const savedAt = Math.max(body.savedAt, currentSavedAt + 1)
      await put(PATHNAME, JSON.stringify({ savedAt, data: body.data }), {
        access: 'private',
        allowOverwrite: true,
        contentType: 'application/json',
      })
      return res.status(200).json({ ok: true, savedAt })
    }

    return res.status(405).json({ error: 'método não suportado' })
  } catch (err) {
    return res.status(500).json({ error: String(err?.message ?? err) })
  }
}
