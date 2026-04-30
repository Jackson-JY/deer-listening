// utils/auth.js - 用户登录模块

// 获取数据库实例（延迟初始化）
function getDb() {
  return wx.cloud.database();
}

/**
 * 检查用户是否已登录
 */
function checkLogin() {
  return wx.cloud.callFunction({
    name: "login",
  }).then(res => {
    if (res.result && res.result.openid) {
      setLoginState(true, res.result.openid);
      return res.result;
    }
    return null;
  }).catch(() => null);
}

/**
 * 云函数方式获取登录态（推荐）
 */
function cloudLogin() {
  return wx.cloud.callFunction({
    name: "login",
    data: {},
  });
}

/**
 * 获取本地存储的登录状态
 */
function getLoginState() {
  const isLoggedIn = wx.getStorageSync("isLoggedIn") || false;
  const openid = wx.getStorageSync("openid") || "";
  return { isLoggedIn, openid };
}

/**
 * 设置本地登录状态
 */
function setLoginState(isLoggedIn, openid) {
  wx.setStorageSync("isLoggedIn", isLoggedIn);
  wx.setStorageSync("openid", openid || "");
}

/**
 * 检查登录状态并重定向到登录页
 * @param {string} loginPage - 登录页面路径，默认 /pages/login/login
 * @returns {boolean} - 是否已登录
 */
function checkLoginAndRedirect(loginPage = "/pages/login/login") {
  const app = getApp();
  if (!app.globalData.isLoggedIn) {
    wx.redirectTo({ url: loginPage });
    return false;
  }
  return true;
}

/**
 * 获取用户信息（优先从全局数据，否则从数据库）
 * @returns {Promise<object|null>}
 */
async function getUserInfo() {
  const app = getApp();
  const { openid, userInfo } = app.globalData;

  let result = null;

  if (userInfo) {
    result = {
      name: userInfo.name || userInfo.nickName || "新用户",
      avatar: userInfo.avatar || userInfo.avatarUrl || "",
      avatarFileId: userInfo.avatarFileId || userInfo.avatar || "",
      streak: userInfo.streak || 0,
      completed: userInfo.completed || 0,
      totalScore: userInfo.totalScore || 0,
      isAdmin: userInfo.isAdmin || false,
    };
  } else if (openid) {
    const res = await getUser(openid);
    result = res.data[0] || null;
  }

  // 如果 avatar 是 cloud:// 开头的 fileID，转换为临时 URL
  if (result && result.avatar && result.avatar.startsWith("cloud://")) {
    try {
      const urlRes = await wx.cloud.getTempFileURL({
        fileList: [result.avatar]
      });
      if (urlRes.fileList && urlRes.fileList[0] && urlRes.fileList[0].tempFileURL) {
        result.avatar = urlRes.fileList[0].tempFileURL;
      }
    } catch (e) {
      console.warn("获取头像临时URL失败", e);
    }
  }

  return result;
}

/**
 * 获取或创建用户记录
 * @param {string} openid - 用户openid
 * @param {object} userInfo - 用户信息 { avatarUrl, nickName, phoneNumber }
 */
function getOrCreateUser(openid, userInfo = {}) {
  const db = getDb();
  
  // 如果没有 openid，返回默认用户信息
  if (!openid) {
    console.warn("getOrCreateUser: 没有 openid");
    return Promise.resolve({
      openid: "",
      name: userInfo.nickName || "新用户",
      avatar: userInfo.avatarUrl || "",
      streak: 0,
      completed: 0,
      totalScore: 0,
      isAdmin: false,
    });
  }

  return db.collection("users").where({ openid }).get().then(res => {
    if (res.data && res.data.length > 0) {
      // 用户已存在，更新用户信息
      const existingUser = res.data[0];
      const needUpdate = userInfo.avatarUrl || userInfo.nickName || userInfo.phoneNumber;

      if (needUpdate) {
        const updateData = {};
        if (userInfo.avatarUrl) updateData.avatar = userInfo.avatarUrl;
        if (userInfo.nickName) updateData.name = userInfo.nickName;
        if (userInfo.phoneNumber) updateData.phone = userInfo.phoneNumber;

        return db.collection("users").doc(existingUser._id).update({
          data: updateData,
        }).then(() => ({
          ...existingUser,
          ...updateData,
        })).catch(() => {
          return existingUser;
        });
      }
      return existingUser;
    }

    // 创建新用户
    const newUser = {
      openid,
      name: userInfo.nickName || "新用户",
      avatar: userInfo.avatarUrl || "",
      phone: userInfo.phoneNumber || "",
      streak: 0,
      completed: 0,
      totalScore: 0,
      isAdmin: false,
      createdAt: db.serverDate(),
    };

    return db.collection("users").add({
      data: newUser,
    }).then(addRes => ({
      _id: addRes._id,
      ...newUser,
    })).catch(err => {
      console.error("创建用户失败", err);
      // 即使创建失败，也返回本地用户信息用于显示
      return newUser;
    });
  }).catch(err => {
    console.error("查询用户失败", err);
    // 查询失败时返回本地用户信息
    return {
      openid,
      name: userInfo.nickName || "新用户",
      avatar: userInfo.avatarUrl || "",
      streak: 0,
      completed: 0,
      totalScore: 0,
      isAdmin: false,
    };
  });
}

/**
 * 微信一键登录
 * @param {object} userInfo - 可选的用户信息 { avatarUrl, nickName, phoneNumber }
 */
function wxLogin(userInfo = {}) {
  return new Promise((resolve, reject) => {
    // 调用云函数获取 openid
    wx.cloud.callFunction({
      name: "login",
    }).then(res => {
      if (res.result && res.result.openid) {
        const openid = res.result.openid;
        setLoginState(true, openid);
        // 获取或创建用户记录（传入用户信息）
        return getOrCreateUser(openid, userInfo).then(user => {
          resolve({ success: true, openid, user });
        });
      }
      reject(new Error("获取 openid 失败"));
    }).catch(err => {
      reject(err);
    });
  });
}

/**
 * 退出登录
 */
function logout() {
  setLoginState(false, "");
  wx.removeStorageSync("userInfo");
}

/**
 * 通过 openid 获取用户记录
 * @param {string} openid
 * @returns {Promise<{data: Array}>}
 */
function getUser(openid) {
  if (!openid) {
    return Promise.resolve({ data: [] });
  }
  return getDb().collection("users").where({ openid }).get();
}

module.exports = {
  checkLogin,
  cloudLogin,
  getLoginState,
  setLoginState,
  getOrCreateUser,
  getUser,
  wxLogin,
  logout,
  checkLoginAndRedirect,
  getUserInfo,
};
