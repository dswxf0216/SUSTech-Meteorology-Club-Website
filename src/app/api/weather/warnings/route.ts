const HOME_URL = 'https://szqxapp1.121.com.cn/sztq-app/v6/v7/homepage/index?obtId=G3565'
const ORIGIN = 'https://szqxapp1.121.com.cn'

export const runtime = 'nodejs'

type AlarmSummary = {
  area?: string[]
  icon?: string
  issueTime?: string
  name?: string
  signalLevel?: string
  signalType?: string
  url?: string
}

type AlarmDetail = {
  alarmMean?: string
  area?: string
  desc?: string
  id?: string
  issueTime?: string
  measure?: string
  name?: string
  name1?: string
}

type WarningItem = {
  alarmMean?: string
  area?: string[] | string
  category: 'local' | 'other' | 'citywide'
  desc?: string
  id?: string
  issueTime?: string
  iconUrl: string | null
  measure?: string
  name?: string
  signalLevel?: string
  signalType?: string
  url?: string
}

let cached: { retrievedAt: string; warnings: WarningItem[] } | null = null
let pending: Promise<void> | null = null
const MAX_AGE = 10 * 60_000

function textOnly(value?: string) {
  return value?.replace(/<br\s*\/?\s*>/gi, '\n').replace(/<[^>]+>/g, '').trim() || undefined
}

function alarmKey(alarm: AlarmSummary) {
  return `${alarm.name || alarm.signalType}-${alarm.issueTime || ''}`
}

function categoryFor(alarm: AlarmSummary, localKeys: Set<string>): WarningItem['category'] {
  if (localKeys.has(alarmKey(alarm))) return 'local'
  const areas = alarm.area || []
  if (!alarm.name?.includes('分区') || areas.length === 0 || areas.some(area => area.includes('全市'))) return 'citywide'
  return 'other'
}

async function readDetails(url?: string): Promise<AlarmDetail[]> {
  if (!url) return []
  try {
    const page = await fetch(new URL(url, ORIGIN), {
      cache: 'no-store',
      headers: { 'User-Agent': 'SUSTech-Meteorology-Club-Website/1.0' },
      signal: AbortSignal.timeout(10_000),
    })
    const query = new URL(page.url).searchParams
    const data = JSON.stringify({
      lon: query.get('lon') || '', lat: query.get('lat') || '', uid: query.get('uid') || '',
      mtype: query.get('mtype') || '', pcity: query.get('pcity') || '', type: query.get('type') || '1',
      os: query.get('os') || '', uname: query.get('uname') || '', token: query.get('token') || '',
      parea: query.get('parea') || '',
      Param: {
        index: query.get('index') || '0', w: query.get('w') || '1080', h: query.get('h') || '1920',
        lat: query.get('plat') || '22.5416666667', lon: query.get('plon') || '114.0052777778',
      },
    })
    const response = await fetch(`${ORIGIN}/phone/api/AlarmSignal.do`, {
      method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(10_000),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'User-Agent': 'SUSTech-Meteorology-Club-Website/1.0' },
      body: new URLSearchParams({ data }),
    })
    if (!response.ok) return []
    const body = await response.json()
    return Array.isArray(body?.returnData?.list) ? body.returnData.list : []
  } catch {
    return []
  }
}

async function readWarnings() {
  const response = await fetch(HOME_URL, {
    cache: 'no-store', signal: AbortSignal.timeout(10_000),
    headers: { 'User-Agent': 'SUSTech-Meteorology-Club-Website/1.0' },
  })
  if (!response.ok) throw new Error(`Upstream HTTP ${response.status}`)
  const body = await response.json()
  if (!body?.success || !body.result) throw new Error('Invalid warning response')

  const local: AlarmSummary[] = Array.isArray(body.result.areaAlarmList) ? body.result.areaAlarmList : []
  const city: AlarmSummary[] = Array.isArray(body.result.cityAlarmList) ? body.result.cityAlarmList : []
  const localKeys = new Set(local.map(alarmKey))
  const summaries = [...local, ...city].filter((alarm, index, all) => all.findIndex(item => alarmKey(item) === alarmKey(alarm)) === index)
  const detailGroups = await Promise.all([...new Set(summaries.map(item => item.url).filter(Boolean))].map(readDetails))
  const details = detailGroups.flat()

  const warnings: WarningItem[] = summaries.map(alarm => {
    const detail = details.find(item => item.name === alarm.name || (item.issueTime === alarm.issueTime && item.name1?.includes(alarm.signalType || '')))
    return {
      ...alarm,
      ...detail,
      alarmMean: textOnly(detail?.alarmMean),
      measure: textOnly(detail?.measure),
      category: categoryFor(alarm, localKeys),
      iconUrl: alarm.icon ? new URL(alarm.icon, ORIGIN).toString() : null,
    }
  })
  return { retrievedAt: new Date().toISOString(), warnings }
}

export async function GET() {
  const age = () => cached ? Date.now() - Date.parse(cached.retrievedAt) : Infinity
  if (age() > 60_000 && !pending) {
    pending = readWarnings().then(result => { cached = result }).catch(error => {
      console.warn('[weather-warnings]', error instanceof Error ? error.message : 'Unknown error')
    }).finally(() => { pending = null })
  }
  if (pending) await pending
  if (cached && age() < MAX_AGE) return Response.json({ available: true, ...cached }, { headers: { 'Cache-Control': 'no-store' } })
  return Response.json({ available: false, warnings: [] }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
}
