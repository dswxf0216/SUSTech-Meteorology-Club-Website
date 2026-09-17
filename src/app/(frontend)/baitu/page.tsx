import type { Metadata } from 'next'
import Image from 'next/image'
import '../quiz/quiz.css'
export const metadata: Metadata = { title: '百团专区' }
export default function BaituPage() {
  return (
    <main className="quiz-page container">
      <section className="quiz-scan">
        <a href="https://nkweather.top/games" aria-label="打开百团游戏选择页面">
          <Image
            unoptimized
            src="/baitu-qr.png"
            alt="扫描二维码选择配对游戏或答题游戏"
            width={320}
            height={320}
          />
        </a>
      </section>
    </main>
  )
}
