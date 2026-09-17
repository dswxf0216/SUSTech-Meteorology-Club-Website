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
    await page.locator('.baitu-code img').last().scrollIntoViewIfNeeded()
    await page.locator('.baitu-forecast img').scrollIntoViewIfNeeded()
    await page.waitForFunction(() => [...document.querySelectorAll('.baitu-code img')].length === 3 && [...document.querySelectorAll('.baitu-code img')].every(img => img.complete && img.naturalWidth > 0))
    assert.equal(await page.locator('.baitu-activity').count(), 5)
    assert.equal(await page.locator('.baitu-code img').count(), 3)
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
      return ['--color-ink', '--color-muted', '--color-accent'].map(name => 1.05 / (luminance(style.getPropertyValue(name)) + 0.05))
    })
    assert.ok(contrasts.every(ratio => ratio >= 4.5), `Contrast ratios: ${contrasts}`)
    await page.evaluate(() => scrollTo(0, 0))
    await page.screenshot({ path: `output/baitu/${width}.png`, fullPage: true })
    console.log(`PASS ${width}px: five activities, three scan codes, responsive columns, no overflow`)
  }
} finally {
  await browser.close()
}
