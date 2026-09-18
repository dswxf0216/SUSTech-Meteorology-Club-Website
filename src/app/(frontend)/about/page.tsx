import Image from 'next/image'
import type { Metadata } from 'next'
import club from './clubContent.json'
import { ClubHistory } from './ClubHistory'
import './about.css'

export const metadata: Metadata = {
  title: '社团简介',
  description: '了解南方科技大学气象社的社团宣言、校园气象服务、活动风采、社团荣誉与发展历程。',
}
const dimensions = [
  [807, 454],
  [1280, 960],
  [793, 595],
  [1280, 960],
]

function ActivityPhoto({ index, featured = false }: { index: number; featured?: boolean }) {
  const photo = club.photos[index]
  return (
    <figure className={featured ? 'club-photo club-photo-featured' : 'club-photo'}>
      <a
        href={photo.src}
        target="_blank"
        rel="noreferrer"
        aria-label={`查看原图：${photo.caption}`}
      >
        <Image
          src={photo.src}
          alt={photo.caption}
          width={dimensions[index][0]}
          height={dimensions[index][1]}
          sizes={
            featured
              ? '(min-width: 960px) 440px, 100vw'
              : '(min-width: 960px) 340px, (min-width: 640px) 45vw, 100vw'
          }
          priority={featured}
        />
      </a>
      <figcaption>{photo.caption}</figcaption>
    </figure>
  )
}

export default function AboutPage() {
  return (
    <div className="club-about">
      <div className="club-container">
        <header className="club-opening">
          <div>
            <h1>南方科技大学气象社</h1>
            <p className="club-declaration">{club.declaration}</p>
            <p className="club-opening-note">成立于2024年12月 · 学术科技类社团</p>
          </div>
          <Image
            className="club-opening-logo"
            src="/assets/sustech-meteorology-club-logo.png"
            alt="南方科技大学气象社标志"
            width={120}
            height={120}
          />
        </header>
        <section className="club-introduction" aria-labelledby="club-intro-title">
          <div className="club-prose">
            <h2 id="club-intro-title">社团简介</h2>
            {club.introduction.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <ActivityPhoto index={0} featured />
        </section>
        <section className="club-section" aria-labelledby="club-gallery-title">
          <div className="club-section-heading">
            <h2 id="club-gallery-title">社团风采</h2>
            <p>点击照片查看原图</p>
          </div>
          <div className="club-gallery">
            {club.photos.slice(1).map((photo, index) => (
              <ActivityPhoto key={photo.src} index={index + 1} />
            ))}
          </div>
        </section>
        <div className="club-achievements">
          <section className="club-honors" aria-labelledby="club-honors-title">
            <h2 id="club-honors-title">社团荣誉</h2>
            <div className="club-school-honor">
              <strong>2025—2026年度三星社团</strong>
              <span>2026年9月获评</span>
            </div>
            <ul>
              {club.honors.map((honor) => (
                <li key={honor}>
                  <span className="club-honor-year">{honor.slice(0, 4)}</span>
                  <p>{honor.slice(4).trim()}</p>
                </li>
              ))}
            </ul>
          </section>
          <ClubHistory records={club.history} />
        </div>
        <section className="club-section club-articles" aria-labelledby="club-articles-title">
          <div className="club-section-heading">
            <h2 id="club-articles-title">精选推文</h2>
            <p>微信公众号：南风之韵</p>
          </div>
          <div className="club-article-placeholder">
            <p>精选推文即将更新</p>
            <span>社团招新、专题预报与活动回顾将在这里与大家见面。</span>
          </div>
        </section>
      </div>
    </div>
  )
}
