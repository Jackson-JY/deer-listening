// cloudfunctions/initData/index.js
const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

// 初始化 Banner 数据（字段匹配 home.wxml）
async function initBanners() {
  const res = await db.collection("banners").count();
  if (res.total > 0) {
    console.log("Banners 已存在，跳过初始化");
    return;
  }
  
  await db.collection("banners").add({
    data: [
      {
        id: 1,
        img: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80",
        badge: "限时",
        title: "雅思听力 21 天突破计划",
        sub: "每天30分钟，突破听力瓶颈",
        cta: "立即体验",
      },
      {
        id: 2,
        img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",
        badge: "热招",
        title: "专业老师带你练",
        sub: "雅思前考官亲自授课",
        cta: "加入学习",
      },
      {
        id: 3,
        img: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&q=80",
        badge: "好评",
        title: "加入学习社群",
        sub: "和 10000+ 学员一起进步",
        cta: "查看详情",
      },
    ],
  });
  console.log("Banners 初始化完成");
}

// 初始化卖点数据（字段匹配 home.wxml）
async function initSellingPoints() {
  const res = await db.collection("sellingPoints").count();
  if (res.total > 0) {
    console.log("SellingPoints 已存在，跳过初始化");
    return;
  }
  
  await db.collection("sellingPoints").add({
    data: [
      {
        id: 1,
        icon: "headphones",
        color: "#FFB6C1",
        bg: "#FFF0F3",
        title: "每日精讲",
        desc: "系统化课程，稳步提升",
      },
      {
        id: 2,
        icon: "book",
        color: "#A8D8EA",
        bg: "#F0F9FF",
        title: "语音打卡",
        desc: "AI 评分，即时反馈",
      },
      {
        id: 3,
        icon: "zap",
        color: "#FFD93D",
        bg: "#FFFBEB",
        title: "1v1 答疑",
        desc: "班主任全程陪伴",
      },
    ],
  });
  console.log("SellingPoints 初始化完成");
}

// 初始化统计数据（字段匹配 home.wxml）
async function initStats() {
  const res = await db.collection("stats").count();
  if (res.total > 0) {
    console.log("Stats 已存在，跳过初始化");
    return;
  }
  
  await db.collection("stats").add({
    data: [
      { id: 1, display: "12,368", suffix: "人", label: "已报名学员" },
      { id: 2, display: "89,542", suffix: "次", label: "完成打卡" },
      { id: 3, display: "98.5", suffix: "%", label: "学员好评率" },
    ],
  });
  console.log("Stats 初始化完成");
}

// 初始化学员评价（字段匹配 home.wxml）
async function initReviews() {
  const res = await db.collection("reviews").count();
  if (res.total > 0) {
    console.log("Reviews 已存在，跳过初始化");
    return;
  }
  
  await db.collection("reviews").add({
    data: [
      {
        id: 1,
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
        score: 8.5,
        name: "李同学",
        text: "老师讲得很好，听力从6分提到了7.5分！",
        days: 21,
      },
      {
        id: 2,
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
        score: 8.0,
        name: "王同学",
        text: "每天打卡很有动力，坚持了21天效果明显",
        days: 21,
      },
      {
        id: 3,
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
        score: 7.5,
        name: "张同学",
        text: "字幕功能很实用，可以边听边看",
        days: 14,
      },
    ],
  });
  console.log("Reviews 初始化完成");
}

// 初始化字幕数据
async function initSubtitles() {
  const res = await db.collection("subtitles").count();
  if (res.total > 0) {
    console.log("Subtitles 已存在，跳过初始化");
    return;
  }
  
  await db.collection("subtitles").add({
    data: [
      { id: 1, start: 0, end: 5, zh: "欢迎来到雅思听力训练营", en: "Welcome to IELTS Listening Camp" },
      { id: 2, start: 5, end: 10, zh: "今天我们学习地图类题型", en: "Today we will learn map-type questions" },
      { id: 3, start: 10, end: 15, zh: "首先让我们看一个例子", en: "First, let's look at an example" },
      { id: 4, start: 15, end: 20, zh: "地图题通常出现在Section 2", en: "Map questions usually appear in Section 2" },
      { id: 5, start: 20, end: 25, zh: "你需要根据听到的内容填写位置", en: "You need to fill in the locations based on what you hear" },
      { id: 6, start: 25, end: 30, zh: "注意听方向词和距离词", en: "Pay attention to direction and distance words" },
      { id: 7, start: 30, end: 35, zh: "常见的方向词包括左转、右转、直走", en: "Common direction words include turn left, turn right, go straight" },
      { id: 8, start: 35, end: 40, zh: "距离词包括在第二个路口、50米后", en: "Distance words include at the second intersection, after 50 meters" },
      { id: 9, start: 40, end: 45, zh: "让我们来做练习", en: "Let's do some practice" },
      { id: 10, start: 45, end: 50, zh: "请先看地图，注意已给出的地标", en: "Please look at the map first, note the given landmarks" },
      { id: 11, start: 50, end: 55, zh: "现在播放录音，仔细听每个位置", en: "Now let's play the recording, listen carefully to each location" },
      { id: 12, start: 55, end: 60, zh: "图书馆位于主入口旁边", en: "The library is located next to the main entrance" },
    ],
  });
  console.log("Subtitles 初始化完成");
}

// 初始化打卡历史
async function initCheckInHistory() {
  const res = await db.collection("checkInHistory").count();
  if (res.total > 0) {
    console.log("CheckInHistory 已存在，跳过初始化");
    return;
  }
  
  await db.collection("checkInHistory").add({
    data: [
      {
        id: 1,
        lessonId: 1,
        lessonTitle: "Day 1 - 雅思听力入门",
        date: "2026-04-11",
        text: "Welcome to Cambridge Sports Centre",
        duration: 42,
        score: 85,
      },
      {
        id: 2,
        lessonId: 2,
        lessonTitle: "Day 2 - 地图类题型精讲",
        date: "2026-04-10",
        text: "The library is located next to the main entrance",
        duration: 38,
        score: 82,
      },
      {
        id: 3,
        lessonId: 3,
        lessonTitle: "Day 3 - 匹配题技巧",
        date: "2026-04-09",
        text: "Please go straight and turn left at the corner",
        duration: 45,
        score: 78,
      },
    ],
  });
  console.log("CheckInHistory 初始化完成");
}

// 主入口
exports.main = async (event, context) => {
  try {
    console.log("开始初始化数据...");
    
    await initBanners();
    await initSellingPoints();
    await initStats();
    await initReviews();
    // 课程数据使用 lecture 表，不再初始化 courses 表
    
    return {
      success: true,
      message: "数据初始化完成",
    };
  } catch (err) {
    console.error("初始化失败:", err);
    return {
      success: false,
      error: err.message,
    };
  }
};
