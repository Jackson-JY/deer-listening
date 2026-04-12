// utils/cloudDb.js - 云数据库数据访问层

// 获取数据库实例（延迟初始化，确保 wx.cloud.init() 已执行）
function getDb() {
  return wx.cloud.database();
}

/**
 * 获取所有课程列表
 */
function getCourses() {
  return getDb().collection("courses").orderBy("day", "asc").get();
}

/**
 * 根据ID获取课程详情
 */
function getCourseById(id) {
  return getDb().collection("courses").where({ id }).get();
}

/**
 * 获取字幕数据
 */
function getSubtitles() {
  return getDb().collection("subtitles").orderBy("start", "asc").get();
}

/**
 * 获取学员评价
 */
function getReviews() {
  return getDb().collection("reviews").get();
}

/**
 * 获取Banner数据
 */
function getBanners() {
  return getDb().collection("banners").get();
}

/**
 * 获取卖点数据
 */
function getSellingPoints() {
  return getDb().collection("sellingPoints").get();
}

/**
 * 获取统计数据
 */
function getStats() {
  return getDb().collection("stats").get();
}

/**
 * 更新课程状态（用于打卡后更新）
 */
function updateCourseStatus(id, data) {
  return getDb().collection("courses").where({ id }).update({ data });
}

/**
 * 获取打卡历史
 */
function getCheckInHistory() {
  return getDb().collection("checkInHistory").get();
}

/**
 * 获取用户信息（通过 openid）
 */
function getUser(openid) {
  if (!openid) {
    return Promise.resolve({ data: [] });
  }
  return getDb().collection("users").where({ openid }).get();
}

/**
 * 初始化云数据库数据（首次使用需调用）
 */
function initData() {
  return wx.cloud.callFunction({
    name: "initData",
  });
}

/**
 * 生成日历数据
 */
function generateCalendarData() {
  const data = {};
  const today = new Date();
  for (let i = 48; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const key = date.toISOString().split("T")[0];
    const rand = Math.random();
    if (i < 7) {
      if (i < 5) data[key] = Math.floor(Math.random() * 2) + 2;
    } else if (i < 21) {
      if (rand > 0.3) data[key] = Math.floor(Math.random() * 2) + 1;
    } else {
      if (rand > 0.5) data[key] = 1;
    }
  }
  return data;
}

module.exports = {
  getCourses,
  getCourseById,
  getSubtitles,
  getReviews,
  getBanners,
  getSellingPoints,
  getStats,
  getCheckInHistory,
  getUser,
  updateCourseStatus,
  initData,
  generateCalendarData,
};
