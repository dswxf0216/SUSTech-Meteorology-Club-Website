'use client'

import { useState } from 'react'

type HistoryRecord = { number: number; date: string; event: string; year: string }
const important = new Set([4, 6, 14, 15, 23, 30, 40, 41, 48, 60, 64, 66])

export function ClubHistory({ records }: { records: HistoryRecord[] }) {
  const years = [...new Set(records.map((record) => record.year))].sort().reverse()
  const [year, setYear] = useState(years[0] || '全部')
  const visible = year === '全部' ? records : records.filter((record) => record.year === year)
  return (
    <section className="club-history" aria-labelledby="club-history-title">
      <h2 id="club-history-title">气象社大事记</h2>
      <div className="club-year-filter" role="group" aria-label="选择大事记年份">
        {['全部', ...years].map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={year === value}
            aria-controls="club-history-records"
            onClick={() => setYear(value)}
          >
            {value}
          </button>
        ))}
      </div>
      <div
        id="club-history-records"
        className="club-history-scroll"
        tabIndex={0}
        role="region"
        aria-label={`${year}大事记`}
      >
        <table>
          <thead>
            <tr>
              <th scope="col">序号</th>
              <th scope="col">日期</th>
              <th scope="col">事件</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((record) => (
              <tr
                key={record.number}
                className={important.has(record.number) ? 'club-history-important' : undefined}
              >
                <td className="club-history-number">{record.number}</td>
                <td className="club-history-date">{record.date}</td>
                <td>{record.event}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="club-history-count" aria-live="polite">
        显示{visible.length}条 · 共{records.length}条大事记
      </p>
    </section>
  )
}
