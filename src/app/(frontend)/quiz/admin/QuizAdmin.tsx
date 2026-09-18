'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { QuizStatistics } from '@/utilities/quizTypes'
import { formatGameTime as time } from '@/utilities/formatGameTime'
import { fetchJsonWithTimeout } from '@/utilities/fetchJsonWithTimeout'

export function QuizAdmin() {
  const [data, setData] = useState<QuizStatistics | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false)
  async function load(page = 1) {
    setBusy(true)
    setError('')
    try {
      const d = await fetchJsonWithTimeout<QuizStatistics>(`/api/game/quiz/stats?page=${page}`, {
        cache: 'no-store',
      })
      setData(d)
    } catch (e) {
      setError(e instanceof Error ? e.message : '统计读取失败，请重试。')
    } finally {
      setBusy(false)
    }
  }
  useEffect(() => {
    void Promise.resolve().then(() => load())
  }, [])
  return (
    <main className="quiz-page container">
      <div className="quiz-section-head">
        <h1>答题统计与记录</h1>
        <button disabled={busy} onClick={() => void load(data?.page || 1)}>
          {busy ? '正在读取…' : '刷新统计'}
        </button>
      </div>
      <p>
        <Link href="/quiz">返回答题游戏</Link> · <Link href="/admin">登录管理后台</Link>
      </p>
      {error && (
        <p className="quiz-error" role="alert">
          {error}
        </p>
      )}
      {data && (
        <>
          <h2>每道题整体正确率</h2>
          <p>共 {data.total} 份完整提交。包括匿名及管理员作答；未提交的作答不计入。</p>
          <div className="quiz-admin-summary">
            {data.questions.map((q) => (
              <div className="quiz-stat-row" key={q.id}>
                <div>
                  <strong>第{q.id}题</strong>
                  <p>{q.prompt}</p>
                  <small>正确答案：{q.correctAnswer.join('、')}</small>
                </div>
                <div>
                  <strong>{q.rate === null ? '—' : `${(q.rate * 100).toFixed(1)}%`}</strong>
                  <p>
                    {q.correct}/{q.total}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <h2>用户作答记录</h2>
          {!data.records.length && <p>暂无完整提交。完成答题后，记录会显示在这里。</p>}
          {data.records.map((r) => (
            <details className="quiz-record" key={r.id}>
              <summary>
                <strong>
                  {r.nickname || '匿名用户'} · {r.score}分 · {time(r.elapsedMs)}
                </strong>
                <br />
                <small>
                  {new Date(r.finishedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
                </small>
              </summary>
              <p>
                实际用时 {time(r.actualMs)}；答错 {r.mistakes}题
              </p>
              <p className="quiz-muted">记录编号：{r.id}</p>
              <p className="quiz-muted">提交IP：{r.submitIp || '未记录'}</p>
              <p className="quiz-muted">IP归属地区：{r.submitRegion || '未知地区'}（仅供参考）</p>
              {r.answers.map((a) => (
                <p key={a.questionId}>
                  第{a.questionId}题：选择 {a.selected.join('、')}；正确答案{' '}
                  {a.correctAnswer.join('、')}；
                  {a.correct ? '正确' : a.points === 5 ? '漏选' : '错误'} · {a.points}分
                </p>
              ))}
            </details>
          ))}
          <div className="quiz-actions">
            <button disabled={busy || data.page === 1} onClick={() => void load(data.page - 1)}>
              上一页
            </button>
            <span>
              {data.page}/{data.pages}
            </span>
            <button
              disabled={busy || data.page === data.pages}
              onClick={() => void load(data.page + 1)}
            >
              下一页
            </button>
          </div>
        </>
      )}
    </main>
  )
}
