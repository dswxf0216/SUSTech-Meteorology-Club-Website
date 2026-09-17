'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { formatGameTime as time } from '@/utilities/formatGameTime'
import type { QuizQuestion, QuizScore, QuizSession } from '@/utilities/quizTypes'

const sessionKey = 'club-quiz-session-v1'
async function api(body?: object) {
  const response = await fetch('/api/game/quiz', {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
    signal: AbortSignal.timeout(20000),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || '请求失败，请稍后重试。')
  return data
}
function QuestionImages({ q }: { q: QuizQuestion }) {
  return q.image ? (
    <a
      className="quiz-image-link"
      href={q.image}
      target="_blank"
      rel="noreferrer"
      aria-label="打开题目原图"
    >
      <Image unoptimized src={q.image} alt={`第${q.id}题参考图`} width={900} height={600} />
      <span>查看原图 ↗</span>
    </a>
  ) : null
}

export function QuizGame() {
  const [game, setGame] = useState<QuizSession | null>(null)
  const [nickname, setNickname] = useState('')
  const [scores, setScores] = useState<QuizScore[]>([])
  const [admin, setAdmin] = useState(false),
    [completed, setCompleted] = useState(false),
    [ready, setReady] = useState(false)
  const [index, setIndex] = useState(0),
    [selected, setSelected] = useState<string[]>([])
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const flight = useRef(false),
    clock = useRef({ elapsed: 0, at: 0 }),
    heading = useRef<HTMLHeadingElement>(null)

  const load = useCallback(async () => {
    setError('')
    try {
      const data = await api()
      setScores(data.scores)
      setAdmin(data.admin)
      setCompleted(data.completed)
      setReady(true)
      let id: string | null = null
      try {
        id = localStorage.getItem(sessionKey)
      } catch {
        /* private browsers can still play */
      }
      if (id) {
        try {
          const next: QuizSession = await api({ action: 'state', sessionId: id })
          setGame(next)
          const first = next.questions.findIndex((q) => !next.selections[q.id]?.length)
          const i = first < 0 ? 0 : first
          setIndex(i)
          setSelected(next.selections[next.questions[i].id] || [])
          clock.current = { elapsed: next.serverNow - next.startedAt, at: performance.now() }
        } catch {
          try {
            localStorage.removeItem(sessionKey)
          } catch {
            /* no storage */
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '无法连接答题服务，请重试。')
    }
  }, [])
  useEffect(() => {
    void Promise.resolve().then(load)
  }, [load])
  useEffect(() => {
    if (!game || game.result) return
    const tick = () => setElapsed(clock.current.elapsed + performance.now() - clock.current.at)
    tick()
    const timer = setInterval(tick, 100)
    return () => clearInterval(timer)
  }, [game?.sessionId, game?.result]) // eslint-disable-line react-hooks/exhaustive-deps

  const run = useCallback(async (body: object): Promise<QuizSession | null> => {
    if (flight.current) return null
    flight.current = true
    setBusy(true)
    setError('')
    try {
      const next: QuizSession = await api(body)
      setGame(next)
      clock.current = {
        elapsed: Math.max(0, next.serverNow - next.startedAt),
        at: performance.now(),
      }
      try {
        localStorage.setItem(sessionKey, next.sessionId)
      } catch {
        /* server cookie still enforces one attempt */
      }
      return next
    } catch (e) {
      setError(e instanceof Error ? e.message : '请求未完成，请重试。')
      return null
    } finally {
      flight.current = false
      setBusy(false)
    }
  }, [])
  function focusHeading() {
    requestAnimationFrame(() => {
      heading.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
      heading.current?.focus({ preventScroll: true })
    })
  }
  async function start() {
    const next = await run({ action: 'start', nickname })
    if (next) {
      const first = next.questions.findIndex((q) => !next.selections[q.id]?.length),
        i = first < 0 ? 0 : first
      setIndex(i)
      setSelected(next.selections[next.questions[i].id] || [])
      focusHeading()
    }
  }
  async function move(nextIndex: number) {
    if (!game) return
    const next = await run({
      action: 'answer',
      sessionId: game.sessionId,
      questionId: game.questions[index].id,
      selected,
    })
    if (next) {
      setIndex(nextIndex)
      setSelected(next.selections[next.questions[nextIndex].id] || [])
      focusHeading()
    }
  }
  async function submit() {
    if (!game) return
    const next = await run({
      action: 'submit',
      sessionId: game.sessionId,
      questionId: game.questions[index].id,
      selected,
    })
    if (next?.result) {
      setCompleted(true)
      focusHeading()
      try {
        const data = await api()
        setScores(data.scores)
      } catch {
        /* result remains visible, board has its own refresh */
      }
    }
  }
  const q = game?.questions[index]
  const answered = game
    ? game.questions.filter(
        (q) => (q.id === game.questions[index].id ? selected : game.selections[q.id])?.length,
      ).length
    : 0

  return (
    <main className="quiz-page container">
      {!game && (
        <section className="quiz-intro">
          <h1>气象答题挑战</h1>
          <p>10道题，每题10分。全部提交后查看答案与解析。</p>
          <ul className="quiz-rules">
            <li>8道单选、2道多选；多选全部选对得10分，只漏选得5分，错选不得分。</li>
            <li>同一浏览器只能完成一次本游戏；中断后1小时内可恢复，期间继续计时。</li>
          </ul>
          {admin && <p className="quiz-success">管理员模式：可不限次数作答。</p>}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void start()
            }}
          >
            <label htmlFor="quiz-nickname">昵称（选填）</label>
            <input
              id="quiz-nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={16}
              autoComplete="off"
              aria-describedby="quiz-privacy"
            />
            <p id="quiz-privacy" className="quiz-muted">
              留空不参与排行，填写后昵称会公开显示
            </p>
            <button
              className="quiz-primary"
              disabled={busy || !ready || (completed && !admin)}
              aria-busy={busy}
            >
              {busy ? '正在开始…' : completed && !admin ? '此浏览器已完成答题' : '开始或恢复答题'}
            </button>
          </form>
          {!ready && !error && <p role="status">正在连接答题服务…</p>}
        </section>
      )}
      {game && !game.result && (
        <section className="quiz-playing">
          <div className="quiz-toolbar">
            <span>已作答 {answered}/10</span>
            <strong aria-label="实际用时">{time(elapsed)}</strong>
          </div>
          <nav className="quiz-progress" aria-label="跳转题目">
            {game.questions.map((question, i) => (
              <button
                key={question.id}
                type="button"
                aria-current={i === index ? 'step' : undefined}
                aria-label={`第${i + 1}题${(question.id === q?.id ? selected : game.selections[question.id])?.length ? '，已作答' : '，未作答'}`}
                data-answered={
                  (question.id === q?.id ? selected : game.selections[question.id])?.length
                    ? 'true'
                    : undefined
                }
                disabled={busy}
                onClick={() => void move(i)}
              >
                {i + 1}
              </button>
            ))}
          </nav>
          {q && (
            <>
              <h1 ref={heading} tabIndex={-1}>
                第{index + 1}题 <small>{q.multiple ? '多选题' : '单选题'} · 10分</small>
              </h1>
              <p className="quiz-prompt" id="quiz-question">
                {q.prompt}
              </p>
              <QuestionImages q={q} />
              <fieldset
                className={`quiz-options${q.options.some((o) => o.image) ? ' quiz-picture-options' : ''}`}
                aria-labelledby="quiz-question"
                disabled={busy}
              >
                {q.multiple && <legend className="quiz-muted">可选择多个选项</legend>}
                {q.options.map((o) => (
                  <label
                    className="quiz-option"
                    key={o.id}
                    data-selected={selected.includes(o.id) ? 'true' : undefined}
                  >
                    <input
                      type={q.multiple ? 'checkbox' : 'radio'}
                      name={`question-${q.id}`}
                      checked={selected.includes(o.id)}
                      onChange={() =>
                        setSelected(
                          q.multiple
                            ? selected.includes(o.id)
                              ? selected.filter((id) => id !== o.id)
                              : [...selected, o.id].sort()
                            : [o.id],
                        )
                      }
                    />
                    <span className="quiz-option-letter">{o.id}</span>
                    {o.image ? (
                      <Image unoptimized src={o.image} alt={o.text} width={500} height={500} />
                    ) : (
                      <span>{o.text}</span>
                    )}
                  </label>
                ))}
              </fieldset>
              <div className="quiz-actions">
                <button disabled={busy || index === 0} onClick={() => void move(index - 1)}>
                  上一题
                </button>
                {index < 9 ? (
                  <button
                    className="quiz-primary"
                    disabled={busy || !selected.length}
                    onClick={() => void move(index + 1)}
                  >
                    {busy ? '正在保存…' : '保存并下一题'}
                  </button>
                ) : (
                  <button
                    className="quiz-primary"
                    disabled={busy || answered !== 10}
                    aria-busy={busy}
                    onClick={() => void submit()}
                  >
                    {busy ? '正在提交…' : '提交全部答案'}
                  </button>
                )}
              </div>
              <p className="quiz-muted">
                选择会在切换题目或提交时保存；不会提前显示对错。
                {index === 9 && answered !== 10
                  ? '请完成所有题目后再提交。'
                  : !selected.length
                    ? '请先选择答案。'
                    : ''}
              </p>
            </>
          )}
        </section>
      )}
      {game?.result && (
        <section className="quiz-result">
          <h1 ref={heading} tabIndex={-1}>
            答题完成
          </h1>
          <p className="quiz-result-score">
            <strong>{game.result.score}</strong> / 100分
          </p>
          <h2>用时 {time(game.result.actualMs)}</h2>
          <p>
            答对 {10 - game.result.mistakes}/10 题，答错 {game.result.mistakes}题。
            {!game.nickname && '匿名作答，不参与排行榜。'}
          </p>
          <h2>答案与解析</h2>
          {game.questions.map((question) => {
            const a = game.result!.answers.find((a) => a.questionId === question.id)!
            return (
              <article className="quiz-explanation" key={question.id}>
                <h3>
                  第{question.id}题 · {a.correct ? '答对' : a.points === 5 ? '漏选' : '答错'} ·{' '}
                  {a.points}分
                </h3>
                <p>{question.prompt}</p>
                <QuestionImages q={question} />
                <div className={question.options.some((o) => o.image) ? 'quiz-answer-images' : ''}>
                  {question.options.map((o) => (
                    <p key={o.id}>
                      {o.id}{' '}
                      {o.image ? (
                        <Image
                          unoptimized
                          src={o.image}
                          alt={o.text}
                          width={500}
                          height={500}
                          loading="lazy"
                        />
                      ) : (
                        o.text
                      )}
                    </p>
                  ))}
                </div>
                <p className={a.correct ? 'quiz-success' : 'quiz-error'}>
                  你的答案：{a.selected.join('、')}；正确答案：{a.correctAnswer.join('、')}
                </p>
                <p className="quiz-explanation-text">{a.explanation}</p>
              </article>
            )
          })}
          {admin && (
            <button
              className="quiz-primary"
              onClick={() => {
                setGame(null)
                setError('')
                try {
                  localStorage.removeItem(sessionKey)
                } catch {
                  /* no storage */
                }
              }}
            >
              管理员再答一次
            </button>
          )}
        </section>
      )}
      {error && (
        <div className="quiz-error" role="alert">
          <p>{error}</p>
          {!ready && <button onClick={() => void load()}>重新连接</button>}
        </div>
      )}
      <section className="quiz-ranking">
        <div className="quiz-section-head">
          <h2>答题排行榜</h2>
          <button
            disabled={busy}
            onClick={async () => {
              try {
                const d = await api()
                setScores(d.scores)
                setError('')
              } catch (e) {
                setError(e instanceof Error ? e.message : '排行榜读取失败，请重试。')
              }
            }}
          >
            刷新排行
          </button>
        </div>
        <p className="quiz-muted">先按分数，再按实际用时排序。</p>
        {scores.length ? (
          <ol className="quiz-board">
            {scores.map((s, i) => (
              <li key={`${s.finishedAt}-${i}`}>
                <span>{s.rank}</span>
                <span className="quiz-board-name">{s.nickname}</span>
                <strong>{s.score}分</strong>
                <span className="quiz-number">{time(s.elapsedMs)}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p>暂无完成记录。填写昵称并完成答题后即可参与排行。</p>
        )}
        {admin && <Link href="/quiz/admin">查看每题正确率与作答记录 →</Link>}
      </section>
      <section className="quiz-scan">
        <a href="https://nkweather.top/quiz">
          <Image
            unoptimized
            src="/quiz-qr.png"
            alt="扫码体验气象答题挑战"
            width={232}
            height={232}
            loading="lazy"
          />
        </a>
        <p>扫码在手机上体验答题游戏</p>
        <Link href="/game">体验配对游戏 →</Link>
      </section>
    </main>
  )
}
