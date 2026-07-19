import { readFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'
import { createHash } from 'crypto'
import { gzipSync } from 'zlib'
import { JWT } from 'google-auth-library'

const KEY_PATH = join(import.meta.dirname, '..', 'stadiumvault-007-service-account.json')
const DIST = join(import.meta.dirname, '..', 'dist')
const PROJECT = 'stadiumvault-007'
const SITE = 'stadiumvault-007'

const BASE = `projects/${PROJECT}/sites/${SITE}`
const API = 'https://firebasehosting.googleapis.com/v1beta1'

let _auth = null
async function getAuth() {
  if (_auth) return _auth
  const key = JSON.parse(readFileSync(KEY_PATH, 'utf-8'))
  const client = new JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ['https://www.googleapis.com/auth/firebase', 'https://www.googleapis.com/auth/cloud-platform'],
  })
  const res = await client.authorize()
  _auth = res.access_token
  return _auth
}

function collectFiles(dir) {
  const files = []
  function walk(d) {
    for (const e of readdirSync(d)) {
      const p = join(d, e)
      const s = statSync(p)
      if (s.isDirectory()) walk(p)
      else files.push({ path: p.replace(dir + '/', ''), content: readFileSync(p) })
    }
  }
  walk(dir)
  return files
}

async function api(method, path, body, contentType) {
  const token = await getAuth()
  const url = `${API}/${path}`
  const opts = { method, headers: { Authorization: `Bearer ${token}` } }
  if (body) {
    opts.headers['Content-Type'] = contentType || 'application/json'
    opts.body = body
  }
  const res = await fetch(url, opts)
  if (!res.ok) throw new Error(`${res.status} ${path}: ${await res.text()}`)
  return res.status === 204 ? null : res.json()
}

async function deploy() {
  const files = collectFiles(DIST)
  console.log(`[deploy] ${files.length} files`)

  // Compute gzipped hashes (path must start with /)
  const fileHashes = {}
  const gzippedContents = {}
  for (const f of files) {
    const gz = gzipSync(f.content)
    const hash = createHash('sha256').update(gz).digest('hex')
    fileHashes['/' + f.path] = hash
    gzippedContents[hash] = gz
  }

  // 1. Create version
  console.log('[deploy] Creating version...')
  const version = await api('POST', `${BASE}/versions`, JSON.stringify({}))
  const vname = version.name
  console.log(`[deploy] Version: ${vname}`)

  // 2. Populate files
  console.log('[deploy] Populating file hashes...')
  const popResult = await api('POST', `${vname}:populateFiles`, JSON.stringify({ files: fileHashes }))

  // 3. Upload required hashes
  if (popResult.uploadRequiredHashes?.length > 0) {
    console.log(`[deploy] Uploading ${popResult.uploadRequiredHashes.length} file hashes...`)
    const uploadUrl = popResult.uploadUrl
    for (const hash of popResult.uploadRequiredHashes) {
      const content = gzippedContents[hash]
      if (!content) {
        console.log(`[deploy] Warning: no content for hash ${hash}, skipping`)
        continue
      }
      const token = await getAuth()
      const res = await fetch(`${uploadUrl}/${hash}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/octet-stream',
        },
        body: content,
      })
      if (!res.ok) throw new Error(`Upload ${hash}: ${res.status} ${await res.text()}`)
    }
    console.log(`[deploy] Uploaded ${popResult.uploadRequiredHashes.length} files`)
  } else {
    console.log('[deploy] No files need uploading (all cached)')
  }

  // 4. Finalize (PATCH status to FINALIZED)
  console.log('[deploy] Finalizing...')
  await api('PATCH', `${vname}?updateMask=status`, JSON.stringify({ status: 'FINALIZED' }))

  // 5. Release (versionName is query param, not body)
  console.log('[deploy] Releasing...')
  await api('POST', `${BASE}/releases?versionName=${encodeURIComponent(vname)}`, JSON.stringify({}))

  console.log(`[deploy] Live at https://${SITE}.web.app`)
}

deploy().catch(e => { console.error('[deploy]', e.message); process.exit(1) })
