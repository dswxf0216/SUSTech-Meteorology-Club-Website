import 'server-only'

export const QUESTION_VERSION = 'baitu-2026-v2'
export const matchingRounds = [
  { title: '台风与年份', leftLabel: '台风名称', rightLabel: '年份', pairs: [
    ['山竹', '2018年'], ['苏拉', '2023年'], ['摩羯', '2024年'], ['桦加沙', '2025年'], ['红霞', '2026年'],
  ] },
  { title: '城市与气候', leftLabel: '城市', rightLabel: '气候类型', pairs: [
    ['深圳', '亚热带季风气候'], ['哈尔滨', '温带季风气候'], ['阿姆斯特丹', '温带海洋性气候'], ['芝加哥', '温带大陆性气候'], ['孟买', '热带季风气候'],
  ] },
  { title: '云的种类与图片', leftLabel: '云的名称', rightLabel: '云的照片', pairs: [
    ['积云', '/game-clouds/image1.png'], ['卷云', '/game-clouds/image2.jpeg'], ['层云', '/game-clouds/image3.jpeg'], ['积雨云', '/game-clouds/image4.jpeg'],
  ], images: true },
  { title: '地方天气名称与地区', leftLabel: '特色天气', rightLabel: '地区', pairs: [
    ['回南天', '华南'], ['梅雨', '长江中下游地区'], ['华西秋雨', '西南、关中'], ['冷流雪', '胶东半岛'],
  ] },
  { title: '观测设备与图片', leftLabel: '观测设备', rightLabel: '设备照片', pairs: [
    ['雪深杆', '/game-equipment/image5.jpeg'], ['百叶箱', '/game-equipment/image6.jpeg'], ['风速计', '/game-equipment/image7.jpeg'], ['雨量筒', '/game-equipment/image8.jpeg'],
  ], images: true },
]
