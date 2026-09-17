export type QuizOption = { id: string; text: string; image?: string }
export type QuizQuestion = {
  id: string
  prompt: string
  multiple: boolean
  image?: string
  options: QuizOption[]
}
export type QuizAnswer = {
  questionId: string
  selected: string[]
  correct: boolean
  points: number
  correctAnswer: string[]
  explanation: string
}
export type QuizResult = {
  id: string
  nickname: string
  score: number
  actualMs: number
  penaltyMs: number
  elapsedMs: number
  mistakes: number
  finishedAt: string
  answers: QuizAnswer[]
}
export type QuizSession = {
  sessionId: string
  nickname: string
  startedAt: number
  serverNow: number
  questions: QuizQuestion[]
  selections: Record<string, string[]>
  result?: QuizResult
}
export type QuizScore = Omit<QuizResult, 'id' | 'answers'> & { rank: number }
export type QuizStatistics = {
  total: number
  questions: {
    id: string
    prompt: string
    correct: number
    total: number
    rate: number | null
    correctAnswer: string[]
  }[]
  records: QuizResult[]
  page: number
  pages: number
}
