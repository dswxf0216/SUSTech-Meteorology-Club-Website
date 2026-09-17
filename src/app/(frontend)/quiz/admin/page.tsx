import type { Metadata } from 'next'
import { QuizAdmin } from './QuizAdmin'
import '../quiz.css'
export const metadata: Metadata = {
  title: '答题统计与记录',
  robots: { index: false, follow: false },
}
export default function QuizAdminPage() {
  return <QuizAdmin />
}
