/** Browser-compatible timeout, including reading the response body. */
export async function fetchJsonWithTimeout<T>(
  url: string,
  init: RequestInit = {},
  timeoutMs = 20000,
): Promise<T> {
  const controller = typeof AbortController === 'function' ? new AbortController() : undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  const request = async () => {
    const response = await fetch(url, { ...init, signal: controller?.signal })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || '请求失败，请稍后重试。')
    return data as T
  }
  try {
    return await Promise.race([
      request(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error('连接超时，请检查网络后重试。'))
          controller?.abort()
        }, timeoutMs)
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}
