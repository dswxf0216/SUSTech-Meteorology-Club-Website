export type MatchingAttempt = {
  at: number
  round: number
  left: string
  right: string
  correct: boolean
}
export type MatchingRecord = {
  submitIp?: string
  submitRegion?: string
  id: string
  nickname: string
  startedAt: number
  updatedAt: number
  status: 'completed' | 'playing' | 'expired'
  completedPairs: number
  totalPairs: number
  actualMs: number
  penaltyMs: number
  elapsedMs: number
  mistakes: number
  attempts: MatchingAttempt[]
  legacy: boolean
}
export type MatchingRecords = {
  total: number
  page: number
  pages: number
  records: MatchingRecord[]
}
