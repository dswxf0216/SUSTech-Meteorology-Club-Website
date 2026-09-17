import assert from 'node:assert/strict'

const base = process.env.GAME_TEST_URL || 'http://localhost:3104'
let cookie = ''
const expected = [
  {'山竹':'2018年','苏拉':'2023年','摩羯':'2024年','桦加沙':'2025年','红霞':'2026年'},
  {'深圳':'亚热带季风气候','哈尔滨':'温带季风气候','阿姆斯特丹':'温带海洋性气候','芝加哥':'温带大陆性气候','孟买':'热带季风气候'},
  {'积云':'/game-clouds/image1.png','卷云':'/game-clouds/image2.jpeg','层云':'/game-clouds/image3.jpeg','积雨云':'/game-clouds/image4.jpeg'},
  {'回南天':'华南','梅雨':'长江中下游地区','华西秋雨':'西南、关中','冷流雪':'胶东半岛'},
  {'雪深杆':'/game-equipment/image5.jpeg','百叶箱':'/game-equipment/image6.jpeg','风速计':'/game-equipment/image7.jpeg','雨量筒':'/game-equipment/image8.jpeg'},
]
async function post(body, status = 200) {
  const response = await fetch(`${base}/api/game/matching`, {method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify(body)})
  const setCookie = response.headers.get('set-cookie')
  if(setCookie) cookie = setCookie.split(';')[0]
  const data = await response.json()
  assert.equal(response.status,status,JSON.stringify(data)); return data
}
const scores = () => fetch(`${base}/api/game/matching`).then(r=>r.json())
async function complete(nickname) {
  cookie = '' // A separate browser for each test player.
  let game = await post({action:'start',nickname})
  const resumed = await post({action:'start',nickname:'不要创建新游戏'})
  assert.equal(resumed.sessionId,game.sessionId)
  assert.equal(game.totalPairs,22); assert.equal(game.totalRounds,5); assert.equal(game.round.answers,undefined)
  const first = game.round.left[0], right = game.round.right.find(r=>r.text !== expected[0][first.text])
  game = await post({action:'match',sessionId:game.sessionId,leftId:first.id,rightId:right.id})
  assert.equal(game.correct,false); assert.equal(game.matched.length,0); assert.equal(game.mistakes,1)
  await post({action:'next',sessionId:game.sessionId},400)
  let lastRequest
  for(let i=0;i<5;i++) {
    assert.equal(game.roundIndex,i)
    assert.equal(game.completedBefore,[0,5,10,14,18][i])
    for(const left of game.round.left) {
      const right = game.round.right.find(r=>r.text===expected[i][left.text]); assert.ok(right)
      lastRequest={action:'match',sessionId:game.sessionId,leftId:left.id,rightId:right.id}
      game=await post(lastRequest); assert.equal(game.correct,true)
    }
    if(i<4) { assert.equal(game.result,undefined); game=await post({action:'next',sessionId:game.sessionId}) }
  }
  assert.ok(game.result); assert.ok(game.result.elapsedMs>0); assert.equal(game.result.mistakes,1)
  assert.equal(game.result.penaltyMs,5000)
  assert.equal(game.result.elapsedMs,game.result.actualMs+5000)
  const retry=await post(lastRequest); assert.deepEqual(retry.result,game.result)
  await post({action:'start',nickname},400)
  const savedCookie = cookie
  cookie = 'matching-device=forged'
  await post({action:'state',sessionId:game.sessionId},400)
  cookie = savedCookie
  return game
}
const before=(await scores()).scores.length
await complete('')
assert.equal((await scores()).scores.length,before,'Anonymous players must not rank')
const nickname=`测试${Date.now().toString().slice(-8)}`
const named=await complete(nickname)
const after=(await scores()).scores
assert.equal(after.filter(s=>s.nickname===nickname).length,1,'Finished retries must not duplicate scores')
assert.equal(after.find(s=>s.nickname===nickname).elapsedMs,named.result.elapsedMs)
assert.ok(after.every((s,i)=>!i||after[i-1].elapsedMs<=s.elapsedMs))
await post({action:'start',nickname:'a'.repeat(17)},400)
await post({action:'match',sessionId:'../scores'},400)
console.log('PASS: five rounds, penalties, resume, one completion per browser, forged cookie rejection, anonymous exclusion, rankings, idempotent finish')
