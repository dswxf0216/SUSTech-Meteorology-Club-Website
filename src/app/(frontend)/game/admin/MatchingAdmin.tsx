'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { fetchJsonWithTimeout } from '@/utilities/fetchJsonWithTimeout'
import { formatGameTime as time } from '@/utilities/formatGameTime'
import type { MatchingRecords } from '@/utilities/matchingRecordTypes'

export function MatchingAdmin() {
  const [data, setData] = useState<MatchingRecords | null>(null)
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('')
  async function load(page = 1) {
    setBusy(true)
    setError('')
    try {
      setData(
        await fetchJsonWithTimeout<MatchingRecords>(`/api/game/matching/records?page=${page}`, {
          cache: 'no-store',
        }),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : '读取失败，请重试。')
    } finally {
      setBusy(false)
    }
  }
  useEffect(() => {
    void Promise.resolve().then(() => load())
  }, [])
  const date = (at: number) => new Date(at).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
  return (
    <div className="quiz-page container">
      <div className="quiz-section-head">
        <h1>配对游戏作答记录</h1>
        <button disabled={busy} onClick={() => void load(data?.page || 1)}>
          {busy ? '读取中…' : '刷新记录'}
        </button>
      </div>
      <Link href="/game">返回配对游戏 →</Link>
      <p>包含昵称和匿名作答，以及未完成的游戏。仅管理员可查看。</p>
      {error && (
        <p className="quiz-error" role="alert">
          {error}
        </p>
      )}
      {data && (
        <>
          <p>
            共 {data.total}条记录 · 第 {data.page}/{data.pages}页
          </p>
          {data.records.map((r) => (
            <details className="quiz-record" key={r.id}>
              <summary>
                <strong>
                  {r.nickname || '匿名用户'} ·{' '}
                  {r.status === 'completed'
                    ? '已完成'
                    : r.status === 'expired'
                      ? '已超时未完成'
                      : '进行中'}{' '}
                  · {r.completedPairs}/{r.totalPairs}对
                </strong>
                <br />
                <small>开始时间：{date(r.startedAt)}</small>
              </summary>
              <p>
                用时 {time(r.actualMs)} ＋ 配错惩罚 {time(r.penaltyMs)} ＝ 总用时{' '}
                {time(r.elapsedMs)}；配错 {r.mistakes}次
              </p>
              <p className="quiz-muted">记录编号：{r.id}</p>
              <p className="quiz-muted">
                提交IP：{r.submitIp || (r.status === 'completed' ? '未记录' : '尚未提交')}
              </p>
              {r.legacy && <p className="quiz-muted">旧记录未保存完整的逐次配对明细。</p>}
              {r.attempts.length ? (
                <ol>
                  {r.attempts.map((a, i) => (
                    <li key={i}>
                      第{a.round}组：{a.left} → {a.right} ·{' '}
                      <span className={a.correct ? 'quiz-success' : 'quiz-error'}>
                        {a.correct ? '正确' : '错误'}
                      </span>{' '}
                      <small>（{date(a.at)}）</small>
                    </li>
                  ))}
                </ol>
              ) : (
                !r.legacy && <p>尚未进行配对。</p>
              )}
            </details>
          ))}
          <div className="quiz-actions">
            <button disabled={busy || data.page <= 1} onClick={() => void load(data.page - 1)}>
              上一页
            </button>
            <button
              disabled={busy || data.page >= data.pages}
              onClick={() => void load(data.page + 1)}
            >
              下一页
            </button>
          </div>
        </>
      )}
    </div>
  )
}
