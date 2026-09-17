import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright-core'

const browser = await chromium.launch({ channel: 'msedge', headless: true })
await mkdir('output/baitu', { recursive: true })
try {
  const page = await browser.newPage()
  for (const width of [320, 375, 414, 768, 1280, 1920]) {
    await page.setViewportSize({ width, height: 800 })
    await page.goto(`${process.env.PREVIEW_URL || 'http://localhost:3104'}/baitu`)
    await page.locator('.baitu-qq-image').scrollIntoViewIfNeeded()
    await page.waitForFunction(() => document.querySelector('.baitu-qq-image').complete && document.querySelector('.baitu-qq-image').naturalWidth > 0)
    assert.equal(await page.getByText('QQ群号：784685108', { exact: true }).count(), 1)
    await page.locator('.baitu-code img').last().scrollIntoViewIfNeeded()
    await page.locator('.baitu-forecast img').scrollIntoViewIfNeeded()
    await page.waitForFunction(() => [...document.querySelectorAll('.baitu-code img')].length === 3 && [...document.querySelectorAll('.baitu-code img')].every(img => img.complete && img.naturalWidth > 0))
    assert.equal(await page.locator('.baitu-activity').count(), 5)
    assert.equal(await page.locator('.baitu-code img').count(), 3)
    const activity = name => page.locator('.baitu-activity').filter({ has: page.getByRole('heading', { name, exact: true }) })
    assert.deepEqual(await activity('光影溯源').locator('.baitu-rewards dd').allTextContents(), ['一张贴纸', '一张贴纸＋参与抽奖', '一张贴纸＋该张明信片'])
    assert.equal(await activity('冷暖先知').locator('.baitu-rewards dd').nth(1).textContent(), '一张贴纸＋参与抽奖')
    assert.equal(await activity('气象配对').locator('.baitu-rewards dd').nth(1).textContent(), '一张贴纸＋参与抽奖')
    assert.equal(await activity('预报体验').locator('.baitu-rewards dd').nth(1).textContent(), '一张贴纸或一个文件袋＋参与抽奖')
    const metrics = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      unloaded: [...document.querySelectorAll('.baitu-code img')].some(img => !img.complete || !img.naturalWidth),
      columns: getComputedStyle(document.querySelector('.baitu-activities')).gridTemplateColumns.split(' ').length,
    }))
    assert.equal(metrics.overflow, false)
    assert.equal(metrics.unloaded, false)
    assert.equal(metrics.columns, width < 768 ? 1 : 2)
    const contrasts = await page.locator('.baitu-page').evaluate(el => {
      const context = document.createElement('canvas').getContext('2d')
      const luminance = color => {
        context.fillStyle = color
        context.fillRect(0, 0, 1, 1)
        const rgb = [...context.getImageData(0, 0, 1, 1).data].slice(0, 3).map(v => {
          const s = v / 255
          return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
        })
        return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722
      }
      const style = getComputedStyle(el)
      return [
        ['--color-ink', '--color-baitu-reward-paper'],
        ['--color-muted', '--color-baitu-lottery-paper'],
        ['--color-accent', '--color-baitu-reward-paper'],
        ['--color-baitu-reward', '--color-baitu-reward-paper'],
        ['--color-baitu-lottery', '--color-baitu-lottery-paper'],
      ].map(([ink, paper]) => (luminance(style.getPropertyValue(paper)) + 0.05) / (luminance(style.getPropertyValue(ink)) + 0.05))
    })
    assert.ok(contrasts.every(ratio => ratio >= 4.5), `Contrast ratios: ${contrasts}`)
    await page.evaluate(() => scrollTo(0, 0))
    await page.locator('.baitu-intro').screenshot({ path: `output/baitu/intro-${width}.png` })
    await page.screenshot({ path: `output/baitu/${width}.png`, fullPage: true })
    console.log(`PASS ${width}px: five activities, three scan codes, responsive columns, no overflow`)
  }
} finally {
  await browser.close()
}
