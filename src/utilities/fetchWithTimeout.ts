export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 25_000,
  externalSignal?: AbortSignal,
) {
  const controller = new AbortController()
  const abort = () => controller.abort(externalSignal?.reason)
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  if (externalSignal?.aborted) abort()
  else externalSignal?.addEventListener('abort', abort, { once: true })

  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
    externalSignal?.removeEventListener('abort', abort)
  }
}
