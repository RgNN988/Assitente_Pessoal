// API de sincronização do painel Guilda ITA.
// Guarda um único JSON ({ savedAt, data }) num Vercel Blob privado.
// GET  -> devolve o estado salvo (ou null se a nuvem estiver vazia)
// PUT  -> substitui o estado salvo
// Protegida por chave compartilhada no header x-sync-key (env SYNC_KEY).
import { get, put } from '@vercel/blob'

const PATHNAME = 'guilda/state.json'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'content-type, x-sync-key')
  res.setHeader('Cache-Control', 'no-store')
  if (req.method === 'OPTIONS') return res.status(204).end()

  const key = process.env.SYNC_KEY
  if (key && req.headers['x-sync-key'] !== key) {
    return res.status(401).json({ error: 'chave de sincronização inválida' })
  }

  try {
    if (req.method === 'GET') {
      let result = null
      try {
        result = await get(PATHNAME, { access: 'private', useCache: false })
      } catch (err) {
        if (err?.name !== 'BlobNotFoundError') throw err
      }
      if (!result || !result.stream) return res.status(200).json(null)
      const text = await new Response(result.stream).text()
      res.setHeader('Content-Type', 'application/json')
      return res.status(200).send(text)
    }

    if (req.method === 'PUT') {
      const body = req.body
      if (
        !body ||
        typeof body.savedAt !== 'number' ||
        !body.data ||
        !Array.isArray(body.data.ledger)
      ) {
        return res.status(400).json({ error: 'corpo inválido' })
      }
      await put(PATHNAME, JSON.stringify(body), {
        access: 'private',
        allowOverwrite: true,
        contentType: 'application/json',
      })
      return res.status(200).json({ ok: true, savedAt: body.savedAt })
    }

    return res.status(405).json({ error: 'método não suportado' })
  } catch (err) {
    return res.status(500).json({ error: String(err?.message ?? err) })
  }
}
