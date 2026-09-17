import 'server-only'
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile, rename, rm, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { matchingRounds, QUESTION_VERSION } from './matchingQuestions'

const root = path.resolve(process.cwd(), 'media', '.matching-game', QUESTION_VERSION)
const sessions = path.join(root, 'sessions')
const MAX_AGE = 60 * 60 * 1000
type Option = { id: string; text: string; image?: boolean }
type Round = { title: string; leftLabel: string; rightLabel: string; left: Option[]; right: Option[]; answers: Record<string, string> }
type Score = { id: string; nickname: string; elapsedMs: number; actualMs?: number; penaltyMs?: number; mistakes: number; finishedAt: string }
type Session = { id: string; nickname: string; startedAt: number; rounds: Round[]; round: number; matched: string[]; mistakes: number; deviceId?: string; result?: Score }
type Device = { sessionId: string; startedAt: number; completed?: boolean }
async function readDevice(id: string): Promise<Device | null> {
  try { return JSON.parse(await readFile(path.join(root, `device-${id}.json`), 'utf8')) } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}
export async function deviceCompleted(id: string) { return (await readDevice(id))?.completed === true }
export async function startDeviceGame(nickname: string, deviceId?: string) {
  if (!deviceId) return startGame(nickname)
  await mkdir(sessions, { recursive: true })
  return locked(path.join(root, `device-${deviceId}.lock`), async () => {
    const device = await readDevice(deviceId)
    if (device?.completed) throw new Error('此浏览器已完成一次挑战，不能再次作答。')
    if (device && Date.now() - device.startedAt <= MAX_AGE) return gameAction(device.sessionId, undefined, undefined, false, true, deviceId)
    const game = await startGame(nickname, deviceId)
    await atomicWrite(path.join(root, `device-${deviceId}.json`), { sessionId: game.sessionId, startedAt: game.startedAt })
    return game
  })
}

function shuffle<T>(items: T[]) {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
export async function atomicWrite(file: string, value: unknown) {
  const temp = `${file}.${randomUUID()}.tmp`
  await writeFile(temp, JSON.stringify(value), { mode: 0o600 })
  try { await rename(temp, file) } finally { await rm(temp, { force: true }) }
}
export async function locked<T>(lock: string, work: () => Promise<T>) {
  const deadline = Date.now() + 5000
  while (true) {
    try { await mkdir(lock); break } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
      // Recover locks left by an interrupted process; work is short and local.
      try { if (Date.now() - (await stat(lock)).mtimeMs > 30000) await rm(lock, { recursive: true }) } catch { /* another request released it */ }
      if (Date.now() > deadline) throw new Error('请求繁忙，请重试。')
      await new Promise(resolve => setTimeout(resolve, 40))
    }
  }
  try { return await work() } finally { await rm(lock, { recursive: true, force: true }) }
}
function scored(score: Score) {
  const actualMs = score.actualMs ?? score.elapsedMs
  const penaltyMs = score.mistakes * 5000
  return { ...score, actualMs, penaltyMs, elapsedMs: actualMs + penaltyMs }
}
function compareScores(a: Score, b: Score) {
  return a.elapsedMs - b.elapsedMs || a.mistakes - b.mistakes || a.finishedAt.localeCompare(b.finishedAt)
}
function publicSession(session: Session) {
  const r = session.rounds[session.round]
  return { sessionId: session.id, startedAt: session.startedAt, nickname: session.nickname,
    roundIndex: session.round, totalRounds: session.rounds.length, totalPairs: session.rounds.reduce((sum, round) => sum + round.left.length, 0),
    completedBefore: session.rounds.slice(0, session.round).reduce((sum, round) => sum + round.left.length, 0),
    matched: session.matched, matchedRight: session.matched.map(id => r.answers[id]), mistakes: session.mistakes, result: session.result && scored(session.result),
    round: r && { title: r.title, leftLabel: r.leftLabel, rightLabel: r.rightLabel, left: r.left, right: r.right },
  }
}
async function readScores(): Promise<Score[]> {
  try { return (JSON.parse(await readFile(path.join(root, 'scores.json'), 'utf8')) as Score[]).map(scored).sort(compareScores) } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }
}
export async function leaderboard() {
  await mkdir(sessions, { recursive: true })
  return (await readScores()).slice(0, 50).map(({ id: _id, ...score }, i) => ({ ...score, rank: i + 1 }))
}
async function saveScore(score: Score) {
  if (!score.nickname) return
  await locked(path.join(root, 'scores.lock'), async () => {
    const scores = await readScores()
    if (!scores.some(s => s.id === score.id)) scores.push(score)
    scores.sort(compareScores)
    await atomicWrite(path.join(root, 'scores.json'), scores.slice(0, 1000))
  })
}
export async function startGame(nickname: string, deviceId?: string) {
  await mkdir(sessions, { recursive: true })
  // Expired game sessions are not retained; leaderboard entries remain.
  const files = await readdir(sessions)
  for (const file of files) if (/^[a-f0-9-]{36}\.json$/.test(file)) {
    const target = path.join(sessions, file)
    try { if (Date.now() - (await stat(target)).mtimeMs > MAX_AGE) await rm(target, { force: true }) } catch { /* already cleaned */ }
  }
  const rounds = matchingRounds.map(r => {
    const left: Option[] = [], right: Option[] = [], answers: Record<string, string> = {}
    for (const [a, b] of r.pairs) {
      const l = randomUUID(), rr = randomUUID()
      left.push({ id: l, text: a }); right.push({ id: rr, text: b, image: r.images === true }); answers[l] = rr
    }
    return { title: r.title, leftLabel: r.leftLabel, rightLabel: r.rightLabel, left: shuffle(left), right: shuffle(right), answers }
  })
  const session: Session = { id: randomUUID(), nickname, startedAt: Date.now(), rounds, round: 0, matched: [], mistakes: 0, deviceId }
  await atomicWrite(path.join(sessions, `${session.id}.json`), session)
  return publicSession(session)
}
export async function gameAction(id: string, leftId?: string, rightId?: string, advance = false, resume = false, deviceId?: string) {
  if (!/^[a-f0-9-]{36}$/.test(id)) throw new Error('游戏无效，请重新开始。')
  await mkdir(sessions, { recursive: true })
  return locked(path.join(sessions, `${id}.lock`), async () => {
    let session: Session
    try { session = JSON.parse(await readFile(path.join(sessions, `${id}.json`), 'utf8')) } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') throw new Error('游戏已失效，请重新开始。')
      throw error
    }
    if (deviceId && session.deviceId !== deviceId) throw new Error('游戏不属于此浏览器，请重新开始。')
    if (Date.now() - session.startedAt > MAX_AGE) throw new Error('游戏超过一小时，请重新开始。')
    let correct: boolean | undefined
    if (!session.result && !resume) {
      const round = session.rounds[session.round]
      if (advance) {
        if (session.matched.length !== round.left.length || session.round === session.rounds.length - 1) throw new Error('请先完成本组配对。')
        session.round++; session.matched = []
      } else {
        if (!leftId || !rightId || !round.answers[leftId] || !round.right.some(o => o.id === rightId)) throw new Error('请选择本组的两个选项。')
        correct = round.answers[leftId] === rightId
        if (correct && !session.matched.includes(leftId)) session.matched.push(leftId)
        else if (!correct) session.mistakes++
        if (session.round === session.rounds.length - 1 && session.matched.length === round.left.length) {
          session.result = scored({ id, nickname: session.nickname, elapsedMs: Date.now() - session.startedAt, mistakes: session.mistakes, finishedAt: new Date().toISOString() })
        }
      }
      // Persist finish first. A retry can safely resume a failed leaderboard write.
      await atomicWrite(path.join(sessions, `${id}.json`), session)
    }
    if (session.result) {
      if (session.deviceId) await atomicWrite(path.join(root, `device-${session.deviceId}.json`), { sessionId: id, startedAt: session.startedAt, completed: true })
      await saveScore(scored(session.result))
    }
    return { ...publicSession(session), correct }
  })
}
