import 'server-only'
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { atomicWrite, locked } from './matchingGame'
import { quizQuestions, QUIZ_VERSION } from './quizQuestions'
import type { QuizResult, QuizSession, QuizStatistics } from './quizTypes'

const root = path.resolve(process.cwd(), 'media', '.quiz-game', QUIZ_VERSION)
const sessions = path.join(root, 'sessions')
const submissions = path.join(root, 'submissions')
const MAX_AGE = 3600000
const STATISTICS_CUTOFF = '2026-09-19T02:48:58Z'
const LEADERBOARD_CUTOFF = '2026-09-19T03:02:59Z'
const LEGACY_STATISTICS_RECORDS = new Set([
  '|75|2026-09-18T03:16:45',
  '|70|2026-09-18T03:00:09',
  '|100|2026-09-18T02:47:32',
  '星旋斗转|70|2026-09-17T16:40:31',
  '林间云天ZYX|90|2026-09-17T13:47:06',
  '111|90|2026-09-17T12:53:00',
])
type Session = {
  id: string
  nickname: string
  startedAt: number
  deviceId?: string
  selections: Record<string, string[]>
  result?: QuizResult
}
type Device = { sessionId: string; startedAt: number; completed?: boolean }
async function initialize() {
  await Promise.all([mkdir(sessions, { recursive: true }), mkdir(submissions, { recursive: true })])
}
async function readJSON<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(file, 'utf8')) as T
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}
const devicePath = (id: string) => path.join(root, `device-${id}.json`)
export async function quizDeviceCompleted(id: string) {
  return (await readJSON<Device>(devicePath(id)))?.completed === true
}
function answerPoints(selected: string[], answer: string[], multiple: boolean) {
  if (selected.length === answer.length && selected.every((id) => answer.includes(id))) return 10
  return multiple && selected.length > 0 && selected.every((id) => answer.includes(id)) ? 5 : 0
}
function includedInStatistics(result: QuizResult) {
  if (typeof result.includeInStatistics === 'boolean') return result.includeInStatistics
  if (result.finishedAt >= STATISTICS_CUTOFF) return true
  return LEGACY_STATISTICS_RECORDS.has(
    `${result.nickname}|${result.score}|${result.finishedAt.slice(0, 19)}`,
  )
}
function includedInLeaderboard(result: QuizResult, admin: boolean) {
  if (result.includeInLeaderboards === true || result.finishedAt >= LEADERBOARD_CUTOFF)
    return true
  return admin && LEGACY_STATISTICS_RECORDS.has(
    `${result.nickname}|${result.score}|${result.finishedAt.slice(0, 19)}`,
  )
}
function withoutPenalty(result: QuizResult): QuizResult {
  const answers = result.answers.map((a) => ({
    ...a,
    points: answerPoints(
      a.selected,
      a.correctAnswer,
      quizQuestions.find((q) => q.id === a.questionId)?.multiple === true,
    ),
  }))
  return {
    ...result,
    answers,
    score: answers.reduce((sum, a) => sum + a.points, 0),
    penaltyMs: 0,
    elapsedMs: result.actualMs,
  }
}
function publicSession(s: Session): QuizSession {
  const {
    submitIp: _submitIp,
    includeInStatistics: _includeInStatistics,
    includeInLeaderboards: _includeInLeaderboards,
    ...publicResult
  } = s.result
    ? withoutPenalty(s.result)
    : ({} as QuizResult)
  return {
    sessionId: s.id,
    nickname: s.nickname,
    startedAt: s.startedAt,
    serverNow: Date.now(),
    selections: s.selections,
    result: s.result ? publicResult : undefined,
    // Explicitly strip the answer key and explanations until submission.
    questions: quizQuestions.map(({ answer: _answer, explanation: _explanation, ...q }) => q),
  }
}
export async function startQuiz(nickname: string, deviceId?: string) {
  await initialize()
  async function create() {
    const s: Session = {
      id: randomUUID(),
      nickname,
      deviceId,
      startedAt: Date.now(),
      selections: {},
    }
    await atomicWrite(path.join(sessions, `${s.id}.json`), s)
    if (deviceId)
      await atomicWrite(devicePath(deviceId), { sessionId: s.id, startedAt: s.startedAt })
    return publicSession(s)
  }
  if (!deviceId) return create()
  return locked(path.join(root, `device-${deviceId}.lock`), async () => {
    const d = await readJSON<Device>(devicePath(deviceId))
    if (d?.completed) throw new Error('此浏览器已完成一次答题，不能再次作答。')
    if (d && Date.now() - d.startedAt <= MAX_AGE) return quizAction(d.sessionId, 'state', deviceId)
    return create()
  })
}
function validateSelection(questionId: unknown, selected: unknown) {
  const q = quizQuestions.find((q) => q.id === questionId)
  if (
    !q ||
    !Array.isArray(selected) ||
    selected.some((v) => typeof v !== 'string' || !q.options.some((o) => o.id === v)) ||
    new Set(selected).size !== selected.length ||
    (!q.multiple && selected.length > 1)
  )
    throw new Error('游戏选项无效，请重新选择。')
  return { q, selected: [...selected].sort() as string[] }
}
async function persistFinished(s: Session) {
  if (!s.result) return
  // Session first, then an immutable result and device marker. Retrying is idempotent.
  await atomicWrite(path.join(submissions, `${s.id}.json`), s.result)
  if (s.deviceId)
    await atomicWrite(devicePath(s.deviceId), {
      sessionId: s.id,
      startedAt: s.startedAt,
      completed: true,
    })
}
export async function quizAction(
  id: string,
  action: 'state' | 'answer' | 'submit',
  deviceId?: string,
  questionId?: unknown,
  selected?: unknown,
  submitIp?: string,
) {
  if (!/^[a-f0-9-]{36}$/.test(id)) throw new Error('游戏不存在，请重新开始。')
  await initialize()
  return locked(path.join(sessions, `${id}.lock`), async () => {
    const s = await readJSON<Session>(path.join(sessions, `${id}.json`))
    if (!s || (deviceId && s.deviceId !== deviceId)) throw new Error('游戏不存在或不属于此浏览器。')
    if (s.result) {
      await persistFinished(s)
      return publicSession(s)
    }
    if (Date.now() - s.startedAt > MAX_AGE) throw new Error('游戏已超过一小时，请重新开始。')
    if (action === 'answer' || (action === 'submit' && questionId !== undefined)) {
      const v = validateSelection(questionId, selected)
      s.selections[v.q.id] = v.selected
    }
    if (action === 'submit') {
      for (const q of quizQuestions) {
        const selection = s.selections[q.id]
        validateSelection(q.id, selection)
        if (!selection.length) throw new Error('请先完成全部10道题，再提交答案。')
      }
      const answers = quizQuestions.map((q) => ({
        questionId: q.id,
        selected: s.selections[q.id],
        correct: [...s.selections[q.id]].sort().join('') === [...q.answer].sort().join(''),
        points: answerPoints(s.selections[q.id], q.answer, q.multiple),
        correctAnswer: q.answer,
        explanation: q.explanation,
      }))
      const mistakes = answers.filter((a) => !a.correct).length
      const actualMs = Math.max(0, Date.now() - s.startedAt)
      s.result = {
        submitIp,
        includeInStatistics: true,
        includeInLeaderboards: true,
        id: s.id,
        nickname: s.nickname,
        score: answers.reduce((sum, a) => sum + a.points, 0),
        actualMs,
        penaltyMs: 0,
        elapsedMs: actualMs,
        mistakes,
        finishedAt: new Date().toISOString(),
        answers,
      }
    }
    if (action !== 'state') await atomicWrite(path.join(sessions, `${id}.json`), s)
    await persistFinished(s)
    return publicSession(s)
  })
}
async function results() {
  await initialize()
  const files = (await readdir(submissions)).filter((f) => /^[a-f0-9-]{36}\.json$/.test(f))
  const values: QuizResult[] = []
  // Bounded reads avoid unbounded file handles as the activity grows.
  for (let i = 0; i < files.length; i += 25) {
    const batch = await Promise.all(
      files.slice(i, i + 25).map((f) => readJSON<QuizResult>(path.join(submissions, f))),
    )
    for (const r of batch) if (r) values.push(withoutPenalty(r))
  }
  return values
}
export function compareQuizScores(a: QuizResult, b: QuizResult) {
  return b.score - a.score || a.elapsedMs - b.elapsedMs || a.finishedAt.localeCompare(b.finishedAt)
}
export async function quizLeaderboard(admin = false) {
  return (await results())
    .filter((r) => r.nickname && includedInLeaderboard(r, admin))
    .sort(compareQuizScores)
    .slice(0, 50)
    .map(
      ({
        id: _id,
        answers: _answers,
        submitIp: _submitIp,
        includeInStatistics: _includeInStatistics,
        includeInLeaderboards: _includeInLeaderboards,
        ...r
      }, i) => ({ ...r, rank: i + 1 }),
    )
}
export async function quizStatistics(page = 1): Promise<QuizStatistics> {
  const all = (await results()).sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))
  const statistical = all.filter(includedInStatistics)
  const pages = Math.max(1, Math.ceil(all.length / 25))
  page = Math.min(pages, Math.max(1, page))
  return {
    total: all.length,
    page,
    pages,
    records: all.slice((page - 1) * 25, page * 25),
    questions: quizQuestions.map((q) => {
      const correct = statistical.filter(
        (r) => r.answers.find((a) => a.questionId === q.id)?.correct,
      ).length
      return {
        id: q.id,
        prompt: q.prompt,
        correct,
        total: statistical.length,
        rate: statistical.length ? correct / statistical.length : null,
        correctAnswer: q.answer,
      }
    }),
  }
}
