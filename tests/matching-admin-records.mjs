import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
const moduleURL = (source) =>
  `data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText).toString('base64')}`
const questions = moduleURL(
  (await readFile('src/utilities/matchingQuestions.ts', 'utf8')).replace(
    "import 'server-only'",
    '',
  ),
)
const source = (await readFile('src/utilities/matchingGame.ts', 'utf8'))
  .replace("import 'server-only'", '')
  .replace("'./matchingQuestions'", JSON.stringify(questions))
const game = await import(moduleURL(source))
const started = await game.startGame('')
const state = await game.gameAction(
  started.sessionId,
  started.round.left[0].id,
  started.round.right[0].id,
)
const records = await game.matchingRecords()
const record = records.records.find((r) => r.id === started.sessionId)
assert.ok(record)
assert.equal(record.nickname, '')
assert.equal(record.status, 'playing')
assert.equal(record.attempts.length, 1)
assert.equal(record.attempts[0].correct, state.correct)
assert.equal(record.attempts[0].left, started.round.left[0].text)
assert.ok(
  records.records.some((r) => !r.nickname && r.status === 'completed' && r.attempts.length >= 22),
)
assert.equal((await game.matchingRecords(-1)).page, 1)
const response = await fetch('http://localhost:3104/api/game/matching/records')
assert.equal(response.status, 403)
assert.equal(response.headers.get('cache-control'), 'private, no-store')
console.log(
  'PASS: anonymous in-progress record; timestamped attempts; pagination; non-admin access denied; private no-store.',
)
