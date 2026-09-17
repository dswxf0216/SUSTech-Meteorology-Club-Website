import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
const base = process.env.GAME_TEST_URL || 'http://localhost:3104'
const endpoint = `${base}/api/game/quiz`
const answers = ['B', 'D', 'C', 'C', 'D', 'D', 'B', 'B', ['B', 'C'], ['A', 'C']]
function client() {
  let cookie = ''
  return async function request(body, origin = base) {
    const r = await fetch(endpoint, {
      method: body ? 'POST' : 'GET',
      headers: {
        Cookie: cookie,
        ...(body ? { 'Content-Type': 'application/json', Origin: origin } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    const token = r.headers.get('set-cookie')?.split(';')[0]
    if (token) cookie = token
    return { status: r.status, data: await r.json() }
  }
}
const request = client()
assert.equal((await request()).status, 200)
const start = await request({ action: 'start', nickname: `测试${randomUUID().slice(0, 8)}` })
assert.equal(start.status, 200)
assert.equal(start.data.questions.length, 10)
assert.equal(start.data.questions.filter((q) => q.multiple).length, 2)
assert.equal(
  start.data.questions.some((q) => 'answer' in q || 'explanation' in q),
  false,
)
const id = start.data.sessionId
const resumed = await Promise.all([
  request({ action: 'start', nickname: '换名' }),
  request({ action: 'start', nickname: '换名' }),
])
assert.ok(resumed.every((r) => r.data.sessionId === id))
assert.equal((await request({ action: 'submit', sessionId: id })).status, 400)
assert.equal(
  (await request({ action: 'answer', sessionId: id, questionId: '1', selected: ['A', 'B'] }))
    .status,
  400,
)
assert.equal(
  (await request({ action: 'answer', sessionId: id, questionId: '9', selected: ['B', 'B'] }))
    .status,
  400,
)
assert.equal(
  (await request({ action: 'answer', sessionId: id, questionId: '1', selected: ['Z'] })).status,
  400,
)
for (let i = 0; i < 10; i++) {
  // Partial multi-select must receive zero points rather than partial credit.
  const selected = i === 8 ? ['B'] : Array.isArray(answers[i]) ? answers[i] : [answers[i]]
  const r = await request({ action: 'answer', sessionId: id, questionId: String(i + 1), selected })
  assert.equal(r.status, 200)
  assert.equal('result' in r.data, false)
  assert.equal(JSON.stringify(r.data).includes('correctAnswer'), false)
}
const final = await request({ action: 'submit', sessionId: id })
assert.equal(final.status, 200)
assert.equal(final.data.result.score, 90)
assert.equal(final.data.result.penaltyMs, 5000)
assert.equal(final.data.result.elapsedMs, final.data.result.actualMs + 5000)
assert.equal(final.data.result.answers.length, 10)
assert.equal(final.data.result.answers[8].correct, false)
assert.deepEqual(
  (await request({ action: 'submit', sessionId: id })).data.result,
  final.data.result,
)
assert.equal((await request({ action: 'start', nickname: '绕过', admin: true })).status, 400)
assert.equal((await request()).data.completed, true)
assert.equal((await client()({ action: 'state', sessionId: id })).status, 400)
assert.equal((await request({ action: 'state', sessionId: '../secret' })).status, 400)
assert.equal(
  (await request({ action: 'start', nickname: '' }, 'https://wrong.example')).status,
  403,
)
assert.equal((await fetch(`${endpoint}/stats`)).status, 403)

async function finish(nickname, mistakes = 0) {
  const c = client()
  await c()
  const { data: g } = await c({ action: 'start', nickname })
  for (let i = 0; i < 10; i++)
    await c({
      action: 'answer',
      sessionId: g.sessionId,
      questionId: String(i + 1),
      selected: i < mistakes ? ['A'] : Array.isArray(answers[i]) ? answers[i] : [answers[i]],
    })
  return (await c({ action: 'submit', sessionId: g.sessionId })).data.result
}
const name = `测试满分${randomUUID().slice(0, 6)}`
const perfect = await finish(name)
assert.equal(perfect.score, 100)
assert.equal(perfect.penaltyMs, 0)
const anonymous = await finish('')
assert.equal(anonymous.nickname, '')
const board = (await request()).data.scores
assert.equal(board.filter((s) => s.nickname === start.data.nickname).length, 1)
assert.ok(
  board.findIndex((s) => s.nickname === name) <
    board.findIndex((s) => s.nickname === start.data.nickname),
)
assert.ok(board.every((s) => s.nickname && !('answers' in s) && !('id' in s)))
for (let i = 1; i < board.length; i++)
  assert.ok(
    board[i - 1].score > board[i].score ||
      (board[i - 1].score === board[i].score && board[i - 1].elapsedMs <= board[i].elapsedMs),
  )
console.log(
  'PASS: 10 questions; no early answers; exact multi-select; server timing + penalty; score-first leaderboard; resume; one browser once; anonymous privacy; administrator stats protected.',
)
