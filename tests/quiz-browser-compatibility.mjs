import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const source = await readFile('src/utilities/fetchJsonWithTimeout.ts', 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext },
}).outputText
const { fetchJsonWithTimeout } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
)
const original = {
  fetch: globalThis.fetch,
  timeout: AbortSignal.timeout,
  controller: globalThis.AbortController,
}
try {
  AbortSignal.timeout = undefined
  let signal
  globalThis.fetch = async (_url, init) => {
    signal = init.signal
    return { ok: true, json: async () => ({ connected: true }) }
  }
  assert.deepEqual(await fetchJsonWithTimeout('/test'), { connected: true })
  assert.ok(signal instanceof AbortSignal)
  globalThis.fetch = async () => ({ ok: false, json: async () => ({ error: '服务器提示' }) })
  await assert.rejects(fetchJsonWithTimeout('/test'), /服务器提示/)
  globalThis.fetch = async (_url, init) => {
    signal = init.signal
    return { ok: true, json: () => new Promise(() => {}) }
  }
  await assert.rejects(fetchJsonWithTimeout('/test', {}, 10), /连接超时/)
  assert.equal(signal.aborted, true)
  globalThis.AbortController = undefined
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ connected: true }) })
  assert.deepEqual(await fetchJsonWithTimeout('/test'), { connected: true })
  globalThis.fetch = () => new Promise(() => {})
  await assert.rejects(fetchJsonWithTimeout('/test', {}, 10), /连接超时/)
  console.log(
    'PASS: missing AbortSignal.timeout; missing AbortController; successful requests; server errors; response-body timeout; abort and timer cleanup.',
  )
} finally {
  globalThis.fetch = original.fetch
  globalThis.AbortController = original.controller
  AbortSignal.timeout = original.timeout
}
