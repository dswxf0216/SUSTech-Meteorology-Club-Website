export default function Loading() {
  return (
    <section className="loading-state container" aria-live="polite" aria-busy="true">
      <span className="loading-indicator" aria-hidden="true" />
      <p>正在加载页面内容…</p>
    </section>
  )
}
