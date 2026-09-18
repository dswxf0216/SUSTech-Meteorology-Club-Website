import { chromium } from 'playwright-core'
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'

await mkdir('output/about-qa', { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const base = process.env.ABOUT_TEST_URL || 'http://localhost:3104'
try {
  for (const width of [1280, 320, 375, 414, 768]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 })
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(base + '/about', { waitUntil: 'networkidle', timeout: 60000 })
    await page.locator('.club-declaration').waitFor()
    assert.equal(await page.locator('.club-declaration').innerText(), '绽放属于你的气象万千')
    assert.equal(await page.locator('.club-opening h1').innerText(), '南方科技大学气象社')
    assert.equal(await page.locator('.club-opening-note').count(), 0)
    assert.equal(await page.locator('.club-opening-codes figure').count(), 2)
    await page.waitForFunction(() => [...document.querySelectorAll('.club-opening-codes img')].every((image) => image.complete && image.naturalWidth > 0))
    const codeBoxes = await page.locator('.club-opening-codes figure').evaluateAll((figures) => figures.map((figure) => {
      const code = figure.querySelector('.club-qq-crop, .club-wechat-code').getBoundingClientRect()
      return { top: code.top, width: code.width, height: code.height }
    }))
    assert.ok(Math.abs(codeBoxes[0].top - codeBoxes[1].top) < 1, 'QR codes must align')
    assert.ok(Math.abs(codeBoxes[0].width - codeBoxes[1].width) < 1, 'QR codes must have equal size')
    assert.equal(await page.locator('.club-honors li').count(), 7)
    assert.equal(await page.locator('.club-history tbody tr').count(), 10)
    for (const image of await page.locator('.club-photo img').all()) await image.scrollIntoViewIfNeeded()
    await page.waitForFunction(() => [...document.querySelectorAll('.club-photo img')].every((image) => image.complete && image.naturalWidth > 0))
    await page.evaluate(() => scrollTo(0, 0))
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}`)
    await page.screenshot({ path: `output/about-qa/about-${width}.png`, fullPage: true })
    await page.getByRole('button', { name: '2024', exact: true }).click()
    assert.equal(await page.locator('.club-history tbody tr').count(), 32)
    await page.getByRole('button', { name: '全部', exact: true }).click()
    assert.equal(await page.locator('.club-history tbody tr').count(), 66)
    assert.equal(errors.length, 0, errors.join('\n'))
    console.log(JSON.stringify({ width, photos: await page.locator('.club-photo img').count(), history: 66, errors }))
    await page.close()
  }
} finally {
  await browser.close()
}
