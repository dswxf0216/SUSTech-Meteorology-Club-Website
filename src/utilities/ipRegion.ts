import { readFile } from 'node:fs/promises'
import { isIP } from 'node:net'
import path from 'node:path'

// Offline ip2region XDB format: https://github.com/lionsoul2014/ip2region
// Only administrative record endpoints use this helper. No IP is sent off-site.
const databases = new Map<number, Promise<Buffer>>()
const regions = new Map<string, string>()

function bytesOf(ip: string, version: number): Buffer {
  if (version === 4) return Buffer.from(ip.split('.').map(Number))
  let value = ip
  if (value.includes('.')) {
    const start = value.lastIndexOf(':') + 1
    const octets = value.slice(start).split('.').map(Number)
    value =
      value.slice(0, start) +
      ((octets[0] << 8) | octets[1]).toString(16) +
      ':' +
      ((octets[2] << 8) | octets[3]).toString(16)
  }
  const [left, right] = value.split('::')
  const head = left ? left.split(':') : []
  const tail = right ? right.split(':') : []
  const groups =
    right === undefined
      ? head
      : [...head, ...Array(8 - head.length - tail.length).fill('0'), ...tail]
  const bytes = Buffer.alloc(16)
  groups.forEach((group, i) => bytes.writeUInt16BE(parseInt(group, 16), i * 2))
  return bytes
}

async function database(version: number) {
  let pending = databases.get(version)
  if (!pending) {
    pending = readFile(
      path.join(process.cwd(), 'data', 'ip-region', `ip2region_v${version}.xdb`),
    ).then((buffer) => {
      const format = buffer.readUInt16LE(0)
      if (
        buffer.length < 524544 ||
        ![2, 3].includes(format) ||
        (format === 3 && (buffer.readUInt16LE(16) !== version || buffer.readUInt16LE(18) !== 4))
      )
        throw new Error('Unsupported IP database')
      return buffer
    })
    databases.set(version, pending)
    // Allow retry after a missing/corrupt database; record retrieval still works.
    void pending.catch(() => databases.delete(version))
  }
  return pending
}

export async function ipRegion(input?: string): Promise<string> {
  if (!input) return '未记录'
  const version = isIP(input)
  if (!version) return '无法识别'
  const bytes = bytesOf(input, version)
  if (
    version === 6 &&
    bytes.subarray(0, 10).every((byte) => byte === 0) &&
    bytes.readUInt16BE(10) === 65535
  )
    return ipRegion([...bytes.subarray(12)].join('.'))
  if (
    version === 4 &&
    (bytes[0] === 0 ||
      bytes[0] === 10 ||
      bytes[0] === 127 ||
      bytes[0] >= 224 ||
      (bytes[0] === 172 && bytes[1] >= 16 && bytes[1] <= 31) ||
      (bytes[0] === 192 && bytes[1] === 168) ||
      (bytes[0] === 169 && bytes[1] === 254) ||
      (bytes[0] === 100 && bytes[1] >= 64 && bytes[1] <= 127))
  )
    return '内网/保留地址'
  if (
    version === 6 &&
    (bytes.every((byte, i) => byte === 0 || (i === 15 && byte === 1)) ||
      (bytes[0] & 254) === 252 ||
      (bytes[0] === 254 && (bytes[1] & 192) === 128) ||
      bytes[0] === 255)
  )
    return '内网/保留地址'
  const key = bytes.toString('hex')
  const cached = regions.get(key)
  if (cached) return cached
  try {
    const buffer = await database(version)
    const vector = 256 + (bytes[0] * 256 + bytes[1]) * 8
    const start = buffer.readUInt32LE(vector)
    const end = buffer.readUInt32LE(vector + 4)
    const width = bytes.length * 2 + 6
    let low = 0
    let high = Math.floor((end - start) / width)
    const compare = (offset: number) =>
      version === 4
        ? bytes.readUInt32BE(0) - buffer.readUInt32LE(offset)
        : bytes.compare(buffer, offset, offset + 16)
    while (start > 0 && low <= high) {
      const middle = Math.floor((low + high) / 2)
      const offset = start + middle * width
      if (compare(offset) < 0) high = middle - 1
      else if (compare(offset + bytes.length) > 0) low = middle + 1
      else {
        const length = buffer.readUInt16LE(offset + bytes.length * 2)
        const pointer = buffer.readUInt32LE(offset + bytes.length * 2 + 2)
        if (pointer + length > buffer.length) throw new Error('Invalid IP database pointer')
        const parts = buffer
          .toString('utf8', pointer, pointer + length)
          .split('|')
          .slice(0, 3)
          .filter((part) => part && part !== '0')
        const region = [...new Set(parts)].join(' · ') || '未知地区'
        if (regions.size >= 2000) regions.clear()
        regions.set(key, region)
        return region
      }
    }
    return '未知地区'
  } catch {
    return '暂无法查询'
  }
}
