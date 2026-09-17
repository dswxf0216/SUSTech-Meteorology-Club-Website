import type { Metadata } from 'next'
import Link from 'next/link'
import '../quiz/quiz.css'
export const metadata: Metadata = {
  title: '百团游戏',
  description: '选择气象配对挑战或气象答题挑战。',
}
export default function GamesPage() {
  return (
    <main className="quiz-page container">
      <h1>选择一个气象游戏</h1>
      <section className="quiz-explanation">
        <h2>配对游戏</h2>
        <p>5组配对题，找到正确搭档；配错一次加5秒。填写昵称可参与用时排行。</p>
        <Link href="/game">开始配对游戏 →</Link>
      </section>
      <section className="quiz-explanation">
        <h2>答题游戏</h2>
        <p>10道题，共100分；提交后查看答案解析。按分数、实际用时依次排名，答错不加时。</p>
        <Link href="/quiz">开始答题游戏 →</Link>
      </section>
    </main>
  )
}
