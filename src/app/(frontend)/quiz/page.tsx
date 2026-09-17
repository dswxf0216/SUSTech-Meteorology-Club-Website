import type { Metadata } from 'next'
import { QuizGame } from './QuizGame'
import './quiz.css'
export const metadata: Metadata = {
  title: '气象答题挑战',
  description: '南科大气象社百团大战答题游戏，10题100分，完成后查看答案解析。',
}
export default function QuizPage() {
  return <QuizGame />
}
