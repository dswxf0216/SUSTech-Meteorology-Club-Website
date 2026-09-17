import type { Metadata } from 'next'
import { MatchingAdmin } from './MatchingAdmin'
import '../../quiz/quiz.css'
export const metadata: Metadata = {
  title: '配对游戏作答记录',
  robots: { index: false, follow: false },
}
export default function Page() {
  return <MatchingAdmin />
}
