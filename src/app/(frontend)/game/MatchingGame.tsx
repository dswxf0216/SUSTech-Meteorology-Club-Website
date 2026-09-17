'use client'

import { useEffect, useRef, useState } from 'react'

type Option = { id: string; text: string; image?: boolean }
type Score = { nickname: string; elapsedMs: number; actualMs: number; penaltyMs: number; mistakes: number; finishedAt: string; rank?: number }
type Game = { sessionId: string; startedAt: number; nickname: string; roundIndex: number; totalRounds: number; totalPairs: number; matched: string[]; matchedRight: string[]; mistakes: number; correct?: boolean; result?: Score; round: { title: string; leftLabel: string; rightLabel: string; left: Option[]; right: Option[] } }
export function formatTime(ms: number) {
  const seconds = Math.floor(ms / 1000)
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}.${Math.floor(ms % 1000 / 100)}`
}
export function MatchingGame() {
  const [nickname, setNickname] = useState('')
  const [game, setGame] = useState<Game | null>(null)
  const [left, setLeft] = useState<string | null>(null), [right, setRight] = useState<string | null>(null)
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('')
  const [networkError, setNetworkError] = useState(false)
  const [feedback, setFeedback] = useState<'error' | 'success' | ''>('')
  const [elapsed, setElapsed] = useState(0)
  const [scores, setScores] = useState<Score[]>([]), [rankError, setRankError] = useState('')
  const [rankBusy, setRankBusy] = useState(false), [imageFailed, setImageFailed] = useState(false)
  const clock = useRef({ start: 0, base: 0 }), inFlight = useRef(false)
  const heading = useRef<HTMLHeadingElement>(null)
  async function refreshScores() {
    setRankBusy(true); setRankError('')
    try {
      const r = await fetch('/api/game/matching', { cache: 'no-store' }), body = await r.json()
      if (!r.ok) throw new Error(body.error)
      setScores(body.scores)
    } catch { setRankError('排行榜暂时无法读取，请点击刷新重试。') }
    finally { setRankBusy(false) }
  }
  useEffect(() => { void refreshScores() }, [])
  useEffect(() => {
    if (!game || game.result) return
    const tick = () => setElapsed(clock.current.base + performance.now() - clock.current.start)
    tick(); const id = window.setInterval(tick, 100)
    return () => window.clearInterval(id)
  }, [game?.sessionId, game?.result])
  // Preload supplied cloud assets before timing so the picture round is fair.
  const [imagesReady, setImagesReady] = useState(false)
  useEffect(() => {
    let live = true
    Promise.all(['/game-clouds/image1.png', '/game-clouds/image2.jpeg', '/game-clouds/image3.jpeg', '/game-clouds/image4.jpeg'].map(src => new Promise<void>((resolve, reject) => {
      const img = new window.Image(); img.onload = () => resolve(); img.onerror = () => reject(); img.src = src
    }))).then(() => { if (live) setImagesReady(true) }).catch(() => { if (live) setImageFailed(true) })
    return () => { live = false }
  }, [])
  async function action(data: Record<string, unknown>) {
    if (inFlight.current) return
    inFlight.current = true; setBusy(true); setMessage(''); setFeedback(''); setNetworkError(false)
    const sentAt = performance.now()
    try {
      const r = await fetch('/api/game/matching', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      const body = await r.json()
      if (!r.ok) throw new Error(body.error || '请求失败，请重试。')
      const next = body as Game
      if (data.action === 'start') {
        clock.current = { base: performance.now() - sentAt, start: performance.now() }; setElapsed(clock.current.base)
      }
      setGame(next)
      if (next.correct === false) { setMessage('配对不正确，总用时 +5秒，请重新选择。'); setFeedback('error'); setRight(null) }
      else { setLeft(null); setRight(null); if (next.correct) { setMessage('配对正确。'); setFeedback('success') } }
      if (next.result) { setElapsed(next.result.elapsedMs); void refreshScores() }
      if (data.action !== 'match' || next.result) requestAnimationFrame(() => {
        heading.current?.focus({ preventScroll: true })
        heading.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
      })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '网络连接失败，请重试。'); setFeedback('error'); setNetworkError(true)
    } finally { inFlight.current = false; setBusy(false) }
  }
  function pick(side: 'left' | 'right', id: string) {
    if (busy) return
    setMessage(''); setFeedback('')
    const l = side === 'left' ? id : left, rr = side === 'right' ? id : right
    if (side === 'left') setLeft(id); else setRight(id)
    if (l && rr && game) void action({ action: 'match', sessionId: game.sessionId, leftId: l, rightId: rr })
  }
  const roundDone = game && game.matched.length === game.round.left.length
  const completed = game ? (game.roundIndex === 0 ? 0 : game.roundIndex === 1 ? 5 : game.roundIndex === 2 ? 10 : 14) + game.matched.length : 0
  return <div className="matching-page">
    <div className="matching-wrap">
      <header className="matching-heading"><h1>气象配对挑战</h1><p>南科大气象社 · 百团大战</p></header>
      <div className="matching-layout">
        <section className="matching-play" aria-label="配对游戏">
          {!game ? <>
            <h2 ref={heading} tabIndex={-1}>从台风到云，找出正确搭档。</h2>
            <p>依次完成四组共18对题目。各组选项随机排列，点击左右两边各一个选项进行配对，配错可继续尝试。</p>
            <p className="matching-penalty-rule"><strong>每配错一次，总用时增加5秒。最终成绩 = 实际用时 + 配错惩罚用时。</strong></p>
            <form onSubmit={event => { event.preventDefault(); void action({ action: 'start', nickname }) }}>
              <label htmlFor="game-nickname">昵称（可不填）</label>
              <input id="game-nickname" value={nickname} maxLength={16} onChange={event => setNickname(event.target.value)} autoComplete="off" aria-describedby="nickname-help" disabled={busy} />
              <p id="nickname-help">填写昵称即同意在公开排行榜展示昵称、用时和配错次数。留空可正常玩，但不参与排行；请勿填写真实姓名或联系方式。</p>
              <button className="matching-primary" disabled={busy || !imagesReady} type="submit">{busy ? '正在开始…' : !imagesReady ? '正在加载题图…' : '开始计时挑战'}</button>
              {imageFailed && <p role="alert">题图加载失败，请刷新页面重试。</p>}
            </form>
          </> : game.result ? <>
            <h2 ref={heading} tabIndex={-1}>全部配对完成</h2>
            <strong className="matching-time matching-final-time">{formatTime(game.result.elapsedMs)}</strong>
            <p>总用时 = 实际用时 <span className="matching-time">{formatTime(game.result.actualMs)}</span> + 配错惩罚用时 <span className="matching-time">{formatTime(game.result.penaltyMs)}</span>（{game.result.mistakes} × 5秒）</p>
            <p>完成18对 · 配错{game.result.mistakes}次</p>
            <p>{game.nickname ? `成绩已记入排行榜，昵称：${game.nickname}` : '本次为匿名挑战，成绩不参与排行榜。'}</p>
            <button className="matching-primary" disabled={busy} onClick={() => { setGame(null); setElapsed(0); setMessage(''); setLeft(null); setRight(null) }}>再挑战一次</button>
          </> : <>
            <div className="matching-status"><span>第{game.roundIndex + 1} / {game.totalRounds}组 · 已完成{completed} / 18对</span><strong className="matching-time" aria-label="当前总用时">{formatTime(elapsed + game.mistakes * 5000)}</strong></div>
            <progress max={18} value={completed} aria-label="完成进度" />
            <h2 ref={heading} tabIndex={-1}>{game.round.title}</h2>
            <p className="matching-instruction">点击两侧各一个选项完成配对。配错次数：{game.mistakes}</p>
            <div className="matching-columns">
              {(['left', 'right'] as const).map(side => <div key={side}>
                <h3>{side === 'left' ? game.round.leftLabel : game.round.rightLabel}</h3>
                <div className="matching-options">{game.round[side].map((option, index) => {
                  const done = (side === 'left' ? game.matched : game.matchedRight).includes(option.id)
                  const selected = (side === 'left' ? left : right) === option.id
                  return <button key={option.id} className={`matching-option${selected ? ' is-selected' : ''}${done ? ' is-matched' : ''}`} aria-pressed={selected} aria-label={option.image ? `照片${index + 1}${done ? '，已配对' : ''}` : `${option.text}${done ? '，已配对' : ''}`} disabled={busy || done} onClick={() => pick(side, option.id)}>
                    {option.image ? <><img src={option.text} alt={`待配对云照片${index + 1}`} width={300} height={180} /><span>照片{index + 1}</span></> : <span>{option.text}</span>}
                    {done && <span className="matching-check">✓ 已配对</span>}
                  </button>
                })}</div>
              </div>)}
            </div>
            {roundDone && <button className="matching-primary" disabled={busy} onClick={() => void action({ action: 'next', sessionId: game.sessionId })}>{busy ? '正在加载…' : '进入下一组'}</button>}
            {feedback === 'error' && left && right && <button disabled={busy} onClick={() => void action({ action: 'match', sessionId: game.sessionId, leftId: left, rightId: right })}>重试本次配对</button>}
          </>}
          <p className={`matching-feedback ${feedback}`} role="status" aria-live="polite">{busy ? '正在核对…' : message}</p>
          {game && networkError && <button disabled={busy} onClick={() => void action({ action: 'state', sessionId: game.sessionId })}>恢复游戏状态</button>}
          <p className="matching-rules">计时包含配错重试、组间停留与切换页面时间，不设暂停。每配错一次加5秒，排行榜按实际用时与惩罚用时相加后的总用时排序，同用时按配错次数排序。题目与图片依据活动题单。</p>
        </section>
        <aside className="matching-ranking" aria-label="通关排行榜">
          <div className="matching-ranking-heading"><h2>通关排行榜</h2><button disabled={rankBusy} onClick={() => void refreshScores()}>{rankBusy ? '读取中…' : '刷新'}</button></div>
          <p>全站共享 · 总用时越短，排名越靠前（含每次配错5秒惩罚）</p>
          {rankError ? <p role="alert">{rankError}</p> : !scores.length ? <p>{rankBusy ? '正在读取成绩…' : '还没有通关记录，来留下第一份成绩。'}</p> : <ol>{scores.map((score, index) => <li key={`${score.finishedAt}-${index}`}><span className="matching-rank-number">{index + 1}</span><div><strong>{score.nickname}</strong><span>配错{score.mistakes}次</span></div><strong className="matching-time">{formatTime(score.elapsedMs)}</strong></li>)}</ol>}
        </aside>
      </div>
      <section className="matching-qr" aria-label="扫码体验">
        <img src="/game-qr.png" alt="扫码打开气象配对挑战：https://nkweather.top/game" width={232} height={232} />
        <div><h2>扫码体验气象配对挑战</h2><p>使用手机扫码即可开始游戏，无需下载。</p><a href="https://nkweather.top/game">nkweather.top/game</a></div>
      </section>
    </div>
  </div>
}
