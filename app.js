// app.js
const auth = require("./utils/auth.js");

App({
  globalData: {
    isLoggedIn: false,
    isGuest: false, // 游客模式标记
    openid: "",
    userInfo: null,
    isAdmin: false,
    streak: 0,
    completed: 0,
    totalScore: 0,
  },

  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
      return;
    }

    wx.cloud.init({
      env: "cloud1-1g8cunkpa5bc6421",
      traceUser: true,
    });

    // 检查登录状态
    this.checkLoginStatus();
    console.log("雅思听力训练营小程序启动");
  },

  checkLoginStatus() {
    const { isLoggedIn, openid } = auth.getLoginState();
    this.globalData.isLoggedIn = isLoggedIn;
    this.globalData.openid = openid;
    return isLoggedIn;
  },

  /**
   * 执行登录
   */
  doLogin(userInfo = {}) {
    return auth.wxLogin(userInfo)
      .then(res => {
        this.globalData.isLoggedIn = true;
        this.globalData.isGuest = false;
        this.globalData.openid = res.openid;
        this.globalData.userInfo = res.user;
        return res;
      });
  },

  /**
   * 游客模式
   */
  setGuestMode() {
    this.globalData.isGuest = true;
    this.globalData.isLoggedIn = true; // 允许浏览
  },

  /**
   * 退出登录
   */
  doLogout() {
    auth.logout();
    this.globalData.isLoggedIn = false;
    this.globalData.isGuest = false;
    this.globalData.openid = "";
    this.globalData.userInfo = null;
  },
});
