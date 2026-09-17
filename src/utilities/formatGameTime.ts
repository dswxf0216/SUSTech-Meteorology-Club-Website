/** Minutes : seconds : centiseconds (570 milliseconds is displayed as 57). */
export function formatGameTime(ms: number) {
  const safe = Math.max(0, Math.floor(ms))
  const seconds = Math.floor(safe / 1000)
  return [Math.floor(seconds / 60), seconds % 60, Math.floor((safe % 1000) / 10)]
    .map((n) => String(n).padStart(2, '0'))
    .join(':')
}
