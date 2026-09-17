import 'server-only'
import type { QuizQuestion } from './quizTypes'

export const QUIZ_VERSION = 'baitu-quiz-2026-v1'
type QuestionWithAnswer = QuizQuestion & { answer: string[]; explanation: string }
function options(texts: string[]) {
  return texts.map((text, i) => ({ id: 'ABCD'[i], text }))
}
const missing = '题单未提供解析。'
export const quizQuestions: QuestionWithAnswer[] = [
  {
    id: '1',
    multiple: false,
    prompt: '今年的中秋节（9月25日）和下列哪个节气的日期最接近？',
    options: options(['处暑', '秋分', '立秋', '白露']),
    answer: ['B'],
    explanation: missing,
  },
  {
    id: '2',
    multiple: false,
    prompt: '今年暑假期间，台风“红霞”对深圳造成了严重的影响，“红霞”的登陆地位于？',
    options: options(['珠海', '香港', '深圳', '惠州']),
    answer: ['D'],
    explanation: missing,
  },
  {
    id: '3',
    multiple: false,
    prompt:
      '4—9月是深圳的主汛期，若根据深圳国家基本气象站（59493）1991—2020年的观测数据，这六个月深圳各月多年平均降水量从大到小的排序为？',
    options: options(['6 8 4 7 9 5', '8 7 6 5 9 4', '6 8 7 9 5 4', '7 5 8 4 9 5']),
    answer: ['C'],
    explanation: '月均降水量分别为368.7mm、364.3mm、309.5mm、242.5mm、237.1mm、140.1mm。',
  },
  {
    id: '4',
    multiple: false,
    prompt: '下列气象灾害预警图标表示的是哪种气象灾害？',
    image: '/quiz-images/image1.jpeg',
    options: options(['暴雪', '沙尘暴', '霜冻', '道路结冰']),
    answer: ['C'],
    explanation: missing,
  },
  {
    id: '5',
    multiple: false,
    prompt: '今天是9月19日，这个日期我国最不可能出现下列哪种天气事件？',
    options: options([
      '大兴安岭一带雪花飘飘',
      '华南江南一带出现35℃以上高温',
      '台风正面登陆海南岛',
      '北京、天津开始供暖',
    ]),
    answer: ['D'],
    explanation: missing,
  },
  {
    id: '6',
    multiple: false,
    prompt: '下列哪个不是2518号台风“桦加沙”的卫星云图？',
    options: [2, 3, 4, 5].map((n, i) => ({
      id: 'ABCD'[i],
      text: `卫星云图${'ABCD'[i]}`,
      image: `/quiz-images/image${n}.jpeg`,
    })),
    answer: ['D'],
    explanation:
      '前三张分别是“桦加沙”9月22日、9月21日、9月20日的云图，最后一张是2411号台风“摩羯”的云图。',
  },
  {
    id: '7',
    multiple: false,
    prompt:
      '下图是河南许昌2月15日0—21时的逐小时气象要素，其中该站于19—21时气温快速下降，同时湿度明显上升，出现这一现象最可能的原因是？',
    image: '/quiz-images/image6.png',
    options: options([
      '冷锋过境该地，带来猛烈的降温',
      '高空持续降雪使得低空显著补湿，雪花得以不经升华降落到地面',
      '天空云层散去，出现明显晴空辐射',
      '南侧湿润气团移至该地，湿度大幅上升，气温随之下降至逼近露点温度',
    ]),
    answer: ['B'],
    explanation:
      '能见度明显下降是最明显判据，冷锋过境露点不会大幅上升，高风速下不会产生剧烈的晴空辐射，湿润气团北上一般不会导致如此强烈的降温。',
  },
  {
    id: '8',
    multiple: false,
    prompt:
      '下图是中央气象台官网上湖南株洲2月15日早晨更新的天气预报，其中在全天天气现象为小雨的情况下报出了当天4℃～27℃的巨大温差，关于这一现象合理的解释是？',
    image: '/quiz-images/image7.png',
    options: options([
      '当天清晨天气湿冷，最低气温仅4℃，但白天受较强暖平流影响气温猛升至27℃',
      '4℃是2月16日的20—20最低气温（即2月15日20时—2月16日20时的日低温），考虑到2月16日气温呈全天“倒降”走势，这一温度实际出现在2月16日20时',
      '2月15日早晨至上午天气晴热，最高气温升至27℃；当天午后冷空气到达，出现降水降温天气并持续至夜间，气温一路下降至4℃',
      '这属于中央气象台预报产品的制作失误，并不是常见现象',
    ]),
    answer: ['B'],
    explanation:
      '这是中央气象台天气预报乃至很多天气软件一个常见的令人迷惑的现象，标在某日的最低气温其实更多时候指的是次日早晨的低温，遇到次日气温倒降的情况甚至可以是次日晚上的温度。',
  },
  {
    id: '9',
    multiple: true,
    prompt: '下列关于强对流天气的说法，正确的是？',
    options: options([
      '雷暴的发生需要一定的热量基础，故在较低的温度（如0℃以下）是不可能出现雷电天气的',
      'CAPE指对流有效位能，可以用来衡量对流发展的潜力',
      '对强对流天气做出准确及时的预测是很困难的，公众可以通过对雷达图进行简单的分析判断自己的所在地短时间内是否容易受到强对流的袭击',
      '下击暴流是指一种雷暴云中大范围的强下沉气流，到达地面后会产生一股旋转性大风',
    ]),
    answer: ['B', 'C'],
    explanation:
      'A：0℃以下也可以出现雷电天气，甚至产生“雷打雪”现象；D：下击暴流产生的是直线型大风，产生旋转型大风的主要是龙卷风等涡旋系统。',
  },
  {
    id: '10',
    multiple: true,
    prompt: '根据下方探空图，下列说法中正确的是？',
    image: '/quiz-images/image8.png',
    options: options([
      '在左侧的温度—对数压力图中，红线表示温度，绿线表示露点温度',
      '该探空图展示了非常典型的逆温现象，气温在一定的高度范围内随海拔升高而升高，在约900hPa处升至零上',
      '该站全层气温在约750hPa处达到最高，这主要是由南支槽前西南暖湿气流的输送层面所决定的',
      '在这种温度层结下，降水相态为纯雪的可能性较低，这一在近地面气温位于零下时仍然不能出现纯雪的现象在我国南方冬季降水中出现次数整体呈现东多西少的特征',
    ]),
    answer: ['A', 'C'],
    explanation:
      'B：注意温度是倾斜投影到横轴上的，该站气温在800hPa处才升至零上；D：受南支槽槽前暖湿气流强度和近地面冷空气渗透路径的影响（急流自西向东输送，西强东弱；华中西南地区海拔偏高且冷空气易堆积，近地面气温较同纬度华东偏低），西部更容易满足这样的层结。',
  },
]
