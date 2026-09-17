import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import '../quiz/quiz.css'
import './baitu.css'
export const metadata: Metadata = { title: '百团专区' }
export default function BaituPage() {
  return (
    <div className="quiz-page container">
      <h1>百团专区</h1>
      <div className="baitu-games">
        <section className="baitu-game">
          <h2>配对游戏</h2>
          <Link href="/game" aria-label="体验配对游戏">
            <Image unoptimized src="/game-qr.png" alt="扫码体验配对游戏" width={232} height={232} />
          </Link>
          <p>完成5组、共22对气象配对题，选项随机排列；配错后可重试，每错一次加5秒。</p>
          <p>总用时＝实际用时＋配错惩罚，按总用时从短到长排行。</p>
          <Link href="/game">打开配对游戏 →</Link>
        </section>
        <section className="baitu-game">
          <h2>答题游戏</h2>
          <Link href="/quiz" aria-label="体验答题游戏">
            <Image unoptimized src="/quiz-qr.png" alt="扫码体验答题游戏" width={232} height={232} />
          </Link>
          <p>共10题，每题10分，满分100分；多选题须完整选对，全部提交后才显示答案与解析。</p>
          <p>先按分数从高到低，同分再按实际用时从短到长排行；答错不加时。</p>
          <Link href="/quiz">打开答题游戏 →</Link>
        </section>
      </div>
      <p className="quiz-muted">
        两个游戏均可不填昵称，但匿名不参与排行。同一浏览器每个游戏只能完成一次，管理员不限次数。
      </p>
    </div>
  )
}
