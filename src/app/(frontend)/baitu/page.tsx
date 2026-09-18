import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import '../quiz/quiz.css'
import './baitu.css'
export const metadata: Metadata = { title: '百团专区' }
const sticker = '一张贴纸'
const stickerDraw = '一张贴纸＋参与抽奖'
const draw = '一张贴纸或一个文件袋＋参与抽奖'
const bottle = '一张贴纸或一个文件袋＋一个气象瓶'
function Rewards({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="baitu-rewards">
      {rows.map(([condition, prize]) => (
        <div key={condition}>
          <dt>{condition}</dt>
          <dd>{prize}</dd>
        </div>
      ))}
    </dl>
  )
}
function GameCode({ href, src, name }: { href: string; src: string; name: string }) {
  return (
    <div className="baitu-code">
      <Link href={href} aria-label={`打开${name}`}>
        <Image unoptimized src={src} alt={`扫码体验${name}`} width={168} height={168} />
      </Link>
      <p>扫码体验，或直接打开</p>
      <Link className="baitu-open" href={href}>
        打开{name} →
      </Link>
    </div>
  )
}
export default function BaituPage() {
  return (
    <div className="quiz-page baitu-page container">
      <div className="baitu-intro">
        <div className="baitu-welcome">
          <h1>气象社百团活动介绍</h1>
          <p className="baitu-lead">欢迎大家参与！</p>
        </div>
        <aside className="baitu-join" aria-label="社团交流与关注二维码">
          <figure className="baitu-qq-entry">
            <figcaption>
              <h2>社团QQ群</h2>
              <p className="baitu-group-number">群号：784685108</p>
            </figcaption>
            <div className="baitu-qq-frame">
              <Image
                className="baitu-qq-image"
                unoptimized
                src="/club-qq-code.jpg"
                alt="南科大气象爱好者QQ群二维码，群号784685108"
                width={1080}
                height={1920}
              />
            </div>
          </figure>
          <figure className="baitu-wechat-entry">
            <figcaption>
              <h2>社团微信公众号：</h2>
              <p>南风之韵</p>
            </figcaption>
            <Image
              className="baitu-wechat-image"
              unoptimized
              src="/club-wechat-code.jpg"
              alt="社团微信公众号南风之韵二维码"
              width={430}
              height={430}
            />
          </figure>
        </aside>
      </div>
      <div className="baitu-activities">
        <section className="baitu-activity">
          <h2>1. 光影溯源</h2>
          <p>
            抽取一张照片，以“月份＋旬”猜测拍摄时间，例如“9月下旬”。每人可猜三次，取最接近实际时间的一次；每次作答后可能获得提示。
          </p>
          <p>和好友一起参加时，可各猜不同照片，也可共同猜同一张。</p>
          <h3>评奖标准</h3>
          <Rewards
            rows={[
              ['相差不超过三个月', sticker],
              ['相差不超过三旬', stickerDraw],
              ['精确猜对旬', '一张贴纸＋该张明信片'],
            ]}
          />
          <p className="baitu-note">
            例如：猜6月下旬、实际9月下旬，符合“三个月”；猜8月下旬、实际9月下旬，符合“三旬”。
          </p>
        </section>
        <section className="baitu-activity">
          <h2>2. 冷暖先知</h2>
          <p>
            竞猜不同观测环境中的设备所记录的实时温度，精确到0.1℃。环境可能包括草坪、桌椅和塑胶跑道，以现场实际布置为准。
          </p>
          <h3>评奖标准</h3>
          <Rewards
            rows={[
              ['正确判断温度高低', sticker],
              ['任选两个，猜对温差（四舍五入至整数）', stickerDraw],
              ['任选一个，猜测温度与实际相差不超过0.5℃', bottle],
            ]}
          />
          <p className="baitu-note">
            例如：猜温差2℃、实际1.8℃，符合温差条件；猜32.5℃、实际32.1℃，符合具体温度条件。
          </p>
        </section>
        <section className="baitu-activity baitu-forecast">
          <div>
            <h2>3. 预报体验</h2>
            <p>参与预报员模拟体验小游戏，体验预报员的判断过程。</p>
            <h3>评奖标准</h3>
            <Rewards
              rows={[
                ['C等级及以上', sticker],
                ['A等级', draw],
              ]}
            />
          </div>
          <div className="baitu-code">
            <Image
              unoptimized
              src="/forecast-experience-code.png"
              alt="预报体验微信小程序码"
              width={168}
              height={168}
            />
            <p>使用微信扫码体验预报员模拟小游戏</p>
          </div>
        </section>
        <section className="baitu-activity">
          <h2>4. 气象配对</h2>
          <div className="baitu-game-layout">
            <div>
              <p>
                完成5组、共22对配对题。选项随机排列，配错后可重试，每配错一次加5秒；总用时为实际用时与惩罚用时之和。
              </p>
              <h3>评奖标准</h3>
              <Rewards
                rows={[
                  ['总用时3分钟以内', sticker],
                  ['总用时1分30秒以内', stickerDraw],
                  ['总用时40秒以内', bottle],
                ]}
              />
            </div>
            <GameCode href="/game" src="/game-qr.png" name="配对游戏" />
          </div>
        </section>
        <section className="baitu-activity">
          <h2>5. 气象答题</h2>
          <div className="baitu-game-layout">
            <div>
              <p>
                共10题，每题10分，满分100分。多选全对得10分，只漏选得5分，错选不得分；全部提交后显示答案与解析。
              </p>
              <h3>评奖标准</h3>
              <Rewards
                rows={[
                  ['30分及以上', sticker],
                  ['60分及以上', draw],
                  ['90分及以上', bottle],
                ]}
              />
            </div>
            <GameCode href="/quiz" src="/quiz-qr.png" name="答题游戏" />
          </div>
        </section>
      </div>
      <p className="baitu-note">
        配对与答题游戏均可不填昵称，匿名不参与排行榜。同一浏览器每个游戏只能完成一次，管理员不限次数。配对按总用时排行；答题先按分数，同分按用时排行。
      </p>
      <section className="baitu-lottery">
        <div>
          <h2>抽奖规则</h2>
          <p>
            关注微信公众号“南风之韵”，回复“抽奖”，点击链接加入抽奖。百团临近尾声时统一开奖，请及时关注微信服务通知；中奖后可回到摊位兑奖。
          </p>
        </div>
        <div>
          <h3>抽奖奖品</h3>
          <Rewards
            rows={[
              ['一等奖 · 共5人', '气象瓶×1或气象书籍×1（二者任选）'],
              ['二等奖 · 共10人', '明信片×4'],
              ['三等奖 · 共30人', '贴纸或文件袋×5'],
            ]}
          />
          <p className="baitu-note">奖项和中奖人数可能视实际情况调整。</p>
        </div>
      </section>
      <p className="baitu-final-note">
        注：贴纸可以自选；明信片、文件袋和气象瓶数量有限，先到先得。
      </p>
    </div>
  )
}
