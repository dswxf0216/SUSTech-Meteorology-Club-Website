import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'

const source = ts.transpileModule(fs.readFileSync('src/utilities/ipRegion.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText
const { ipRegion } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'))
assert.equal(await ipRegion(), '未记录')
assert.equal(await ipRegion('invalid'), '无法识别')
for (const ip of ['127.0.0.1', '10.1.2.3', '172.16.0.1', '192.168.1.1', '100.64.0.1', '169.254.1.1', '::', '::1', 'fc00::1', 'fe80::1', 'ff02::1']) {
  assert.equal(await ipRegion(ip), '内网/保留地址', ip)
}
assert.match(await ipRegion('114.114.114.114'), /中国/)
assert.match(await ipRegion('8.8.8.8'), /United States/)
assert.equal(await ipRegion('::ffff:8.8.8.8'), await ipRegion('8.8.8.8'))
assert.equal(await ipRegion('::ffff:0808:0808'), await ipRegion('8.8.8.8'))
assert.match(await ipRegion('2001:4860:4860::8888'), /United States/)
assert.equal(await ipRegion('2001:4860:4860:0:0:0:0:8888'), await ipRegion('2001:4860:4860::8888'))
for (const route of ['quiz/stats', 'matching/records']) {
  const source = fs.readFileSync(`src/app/(frontend)/api/game/${route}/route.ts`, 'utf8')
  assert.ok(source.indexOf('isGameAdmin(request)') < source.indexOf('await ipRegion('))
  assert.match(source, /private, no-store/)
}
console.log('Offline IPv4/IPv6 region and admin-only integration tests passed')
