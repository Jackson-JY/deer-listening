// utils/cloudDb.js - 云数据库数据访问层

// 视频/文件缓存（内存缓存，重启小程序后失效）
const fileCache = {};

/**
 * 获取缓存的文件路径
 * @param {string} key - 文件标识
 * @returns {string|null} - 缓存的文件路径，不存在则返回 null
 */
function getCachedFile(key) {
  return fileCache[key] || null;
}

/**
 * 缓存文件路径
 * @param {string} key - 文件标识
 * @param {string} path - 文件路径
 */
function cacheFile(key, path) {
  fileCache[key] = path;
}

/**
 * 清理文件缓存
 * @param {string} key - 缓存key，默认为空表示清理所有
 */
function clearFileCache(key) {
  if (key) {
    delete fileCache[key];
  } else {
    Object.keys(fileCache).forEach(k => delete fileCache[k]);
  }
}

// 获取数据库实例（延迟初始化，确保 wx.cloud.init() 已执行）
function getDb() {
  return wx.cloud.database();
}

/**
 * 获取所有课程列表（lecture 表）
 */
function getCourses() {
  return getDb().collection("lecture").get();
}

/**
 * 根据ID获取课程详情
 */
function getCourseById(id) {
  return getDb().collection("lecture").where({ _id: id }).get();
}

/**
 * 根据day获取课程详情
 */
function getCourseByDay(day) {
  return getDb().collection("lecture").where({ day: Number(day) }).get();
}

/**
 * 获取云存储文件的临时链接
 * @param {string} fileName - 云存储文件名称或 fileID
 * @returns {Promise<string>} - 临时下载链接
 */
function getCloudFileUrl(fileName) {
  if (!fileName) return Promise.resolve("");
  
  // 检查是否是完整的 fileID（cloud:// 开头）
  const fileId = fileName.startsWith("cloud://") ? fileName : fileName;
  
  return wx.cloud.getTempFileURL({
    fileList: [fileId],
  }).then(res => {
    if (res.fileList && res.fileList[0]) {
      // 检查是否有错误
      if (res.fileList[0].status === 0) {
        return res.fileList[0].tempFileURL || "";
      }
    }
    return "";
  }).catch(() => {
    return "";
  });
}

/**
 * 下载云存储文件（返回临时文件路径）
 * @param {string} fileName - 云存储文件名称或 fileID
 * @param {boolean} useCache - 是否使用缓存，默认 true
 * @returns {Promise<string>} - 临时文件路径
 */
function downloadCloudFile(fileName, useCache = true) {
  if (!fileName) return Promise.resolve("");
  
  // 检查缓存
  if (useCache && fileCache[fileName]) {
    return Promise.resolve(fileCache[fileName]);
  }
  
  return wx.cloud.downloadFile({
    fileID: fileName,
  }).then(res => {
    if (res.statusCode === 200 && res.tempFilePath) {
      // 存入缓存
      if (useCache) {
        fileCache[fileName] = res.tempFilePath;
      }
      return res.tempFilePath;
    }
    return "";
  }).catch(() => {
    return "";
  });
}

/**
 * 获取 SRT 字幕文件内容
 * @param {string} srtFile - SRT 文件名
 * @returns {Promise<Array>} - 字幕数组 [{start, end, text}]
 */
function getSrtContent(srtFile) {
  if (!srtFile) return Promise.resolve([]);
  
  return wx.cloud.downloadFile({
    fileID: srtFile,
  }).then(res => {
    // 返回文件临时路径，供后续处理
    return res.tempFilePath || "";
  }).catch(() => "");
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
 * 获取用户信息（通过 openid）
 */
function getUser(openid) {
  if (!openid) {
    return Promise.resolve({ data: [] });
  }
  return getDb().collection("users").where({ openid }).get();
}

/**
 * 获取打卡历史
 */
function getCheckInHistory() {
  return getDb().collection("checkInHistory").get();
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
  getDb,
  getCourses,
  getCourseById,
  getCourseByDay,
  getSubtitles,
  getReviews,
  getBanners,
  getSellingPoints,
  getStats,
  getCheckInHistory,
  getUser,
  initData,
  generateCalendarData,
  getCloudFileUrl,
  downloadCloudFile,
  getSrtContent,
  clearFileCache,
  getCachedFile,
  cacheFile,
};
