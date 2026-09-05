import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const CAPTURE_DELAY_MS = 1500

type CaptureForecastImageArgs = {
  forecastDate: string
  forecastID: number | string
  siteURL: string
}

export function scheduleForecastImageCapture(args: CaptureForecastImageArgs) {
  const timer = setTimeout(() => {
    void captureForecastImage(args).catch((error) => {
      console.error('[forecast-image] Failed to capture published forecast:', error)
    })
  }, CAPTURE_DELAY_MS)

  timer.unref()
}

export async function captureForecastImage({ forecastDate, forecastID, siteURL }: CaptureForecastImageArgs) {
  const { chromium } = await import('@playwright/test')
  const outputDirectory = path.resolve(process.env.FORECAST_SCREENSHOT_DIR || 'forecast-screenshots')
  const datePart = formatForecastDateForFilename(forecastDate)
  const captureTime = new Date().toISOString().replace(/[:.]/g, '-')
  const outputPath = path.join(outputDirectory, `${datePart}-${captureTime}-daily-forecast.png`)
  const captureURL = new URL(siteURL)
  captureURL.searchParams.set('forecastId', String(forecastID))
  captureURL.searchParams.set('capture', Date.now().toString())

  await mkdir(outputDirectory, { recursive: true })

  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium-browser',
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox'],
  })

  try {
    const page = await browser.newPage({
      deviceScaleFactor: 2,
      viewport: { width: 1600, height: 1200 },
    })
    let forecastSection = page.locator('[data-forecast-capture]').first()

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      await page.goto(captureURL.toString(), { waitUntil: 'domcontentloaded', timeout: 60_000 })
      forecastSection = page.locator('[data-forecast-capture]').first()
      await forecastSection.waitFor({ state: 'visible', timeout: 30_000 })
      if ((await forecastSection.getAttribute('data-forecast-id')) === String(forecastID)) break
      if (attempt === 5) throw new Error(`Published forecast ${forecastID} was not available on the capture page`)
      await page.waitForTimeout(2000)
    }

    await page.addStyleTag({ content: '.site-header { display: none !important; }' })
    await page.evaluate(() => document.fonts.ready)
    await forecastSection.screenshot({ animations: 'disabled', path: outputPath, type: 'png' })
    return outputPath
  } finally {
    await browser.close()
  }
}

export function formatForecastDateForFilename(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'unknown-date'
  return new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
  }).format(date)
}
