import assert from 'node:assert/strict'
import { readFile, mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import ts from 'typescript'

const cwd = process.cwd()
const source = async (file) =>
  (await readFile(path.join(cwd, 'src/utilities', file), 'utf8')).replace(
    "import 'server-only'",
    '',
  )
const url = (source) =>
  `data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText).toString('base64')}`
const { submissionIp } = await import(url(await source('submissionIp.ts')))
const ip = (headers) => submissionIp(new Request('http://localhost', { headers }))
assert.equal(ip({ 'x-real-ip': '2001:db8::1', 'x-forwarded-for': '192.0.2.1' }), '2001:db8::1')
assert.equal(ip({ 'x-forwarded-for': 'spoofed, 192.0.2.2' }), '192.0.2.2')
assert.equal(ip({ 'x-real-ip': 'not-an-ip', 'x-forwarded-for': ' 192.0.2.3 ' }), '192.0.2.3')
assert.equal(ip({ 'x-forwarded-for': '<script>' }), undefined)
assert.equal(ip({}), undefined)
const matchingQuestions = url(await source('matchingQuestions.ts'))
const quizQuestions = url(await source('quizQuestions.ts'))
const matching = url(
  (await source('matchingGame.ts')).replace(
    "'./matchingQuestions'",
    JSON.stringify(matchingQuestions),
  ),
)
const quiz = url(
  (await source('quizGame.ts'))
    .replace("'./matchingGame'", JSON.stringify(matching))
    .replace("'./quizQuestions'", JSON.stringify(quizQuestions)),
)
// Isolated test storage: never touch real game records or the production server.
process.chdir(await mkdtemp(path.join(tmpdir(), 'club-game-ip-test-')))
try {
  const m = await import(matching)
  const q = await import(quiz)
  const { matchingRounds } = await import(matchingQuestions)
  const { quizQuestions: questions } = await import(quizQuestions)
  for (const nickname of ['', '测试昵称']) {
    let state = await m.startGame(nickname)
    for (const round of matchingRounds) {
      for (const [left, right] of round.pairs) {
        state = await m.gameAction(
          state.sessionId,
          state.round.left.find((o) => o.text === left).id,
          state.round.right.find((o) => o.text === right).id,
          false,
          false,
          undefined,
          '192.0.2.4',
        )
      }
      if (!state.result) state = await m.gameAction(state.sessionId, undefined, undefined, true)
    }
    assert.equal('submitIp' in state, false)
    assert.equal('submitIp' in state.result, false)
    assert.equal(
      (await m.matchingRecords()).records.find((r) => r.id === state.sessionId).submitIp,
      '192.0.2.4',
    )
    await m.gameAction(state.sessionId, undefined, undefined, false, true, undefined, '192.0.2.9')
    assert.equal(
      (await m.matchingRecords()).records.find((r) => r.id === state.sessionId).submitIp,
      '192.0.2.4',
    )
    const started = await q.startQuiz(nickname)
    for (const question of questions)
      await q.quizAction(started.sessionId, 'answer', undefined, question.id, question.answer)
    const completed = await q.quizAction(
      started.sessionId,
      'submit',
      undefined,
      undefined,
      undefined,
      '2001:db8::5',
    )
    assert.equal('submitIp' in completed.result, false)
    assert.equal(
      (await q.quizStatistics()).records.find((r) => r.id === started.sessionId).submitIp,
      '2001:db8::5',
    )
    await q.quizAction(started.sessionId, 'submit', undefined, undefined, undefined, '192.0.2.9')
    assert.equal(
      (await q.quizStatistics()).records.find((r) => r.id === started.sessionId).submitIp,
      '2001:db8::5',
    )
  }
  assert.ok((await q.quizLeaderboard()).every((r) => !('submitIp' in r)))
  assert.ok((await m.leaderboard()).every((r) => !('submitIp' in r)))
  console.log(
    'PASS: IPv4/IPv6 validation, anonymous and named submissions, private admin records, no public IP disclosure, retries preserve original IP.',
  )
} finally {
  process.chdir(cwd)
}
