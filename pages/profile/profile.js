// pages/profile/profile.js
const app = getApp();
const cloudDb = require("../../utils/cloudDb.js");

Page({
  data: {
    user: null,
    checkInHistory: [],
    calendarWeeks: [],
    expandedRecord: null,
    showLoginTip: false,
  },

  onLoad() {
    if (!app.globalData.isLoggedIn) {
      wx.redirectTo({
        url: "/pages/login/login",
      });
      return;
    }
    this.loadData();
  },

  onShow() {
    if (!app.globalData.isLoggedIn) {
      wx.redirectTo({
        url: "/pages/login/login",
      });
      return;
    }
    // 仅首次加载时请求数据
    if (!this.data.user) {
      this.loadData();
    }
  },

  onLoginSuccess() {
    this.setData({ showLoginTip: false });
    this.loadData();
  },

  async loadData() {
    try {
      const openid = app.globalData.openid;
      const userInfo = app.globalData.userInfo;
      
      // 优先使用全局用户信息，否则从数据库获取
      let user = userInfo || null;
      
      if (openid && !user) {
        const userRes = await cloudDb.getUser(openid);
        user = userRes.data[0] || null;
      }

      // 如果仍然没有用户数据，使用全局信息创建默认用户
      if (!user && userInfo) {
        user = {
          name: userInfo.name || userInfo.nickName || "新用户",
          avatar: userInfo.avatar || userInfo.avatarUrl || "",
          streak: 0,
          completed: 0,
          totalScore: 0,
          isAdmin: false,
        };
      }

      let checkInRes = { data: [] };
      try {
        checkInRes = await cloudDb.getCheckInHistory();
      } catch (e) {
        console.warn("获取打卡历史失败", e);
      }

      const calendarData = cloudDb.generateCalendarData();

      this.setData({
        user,
        checkInHistory: checkInRes.data || [],
        calendarWeeks: this.buildCalendarWeeks(calendarData),
      });
    } catch (e) {
      console.error("加载数据失败", e);
      // 出错时使用全局用户信息作为后备
      const userInfo = app.globalData.userInfo;
      if (userInfo) {
        this.setData({
          user: {
            name: userInfo.name || userInfo.nickName || "新用户",
            avatar: userInfo.avatar || userInfo.avatarUrl || "",
            streak: 0,
            completed: 0,
            totalScore: 0,
            isAdmin: false,
          },
        });
      }
    }
  },

  buildCalendarWeeks(calendarData) {
    const weeks = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDay = new Date(today);
    firstDay.setDate(today.getDate() - 48);
    firstDay.setDate(firstDay.getDate() - firstDay.getDay());

    let currentWeek = [];

    for (let i = 0; i < 49; i++) {
      const date = new Date(firstDay);
      date.setDate(firstDay.getDate() + i);

      if (date > today) {
        currentWeek.push({ date: null, level: 0 });
      } else {
        const key = date.toISOString().split("T")[0];
        const level = calendarData[key] || 0;
        currentWeek.push({ date: key, level });
      }

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    return weeks;
  },

  toggleRecord(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({
      expandedRecord: this.data.expandedRecord === id ? null : id,
    });
  },

  goToCourses() {
    wx.switchTab({
      url: "/pages/courses/courses",
    });
  },

  copyLink() {
    wx.setClipboardData({
      data: "https://ieltscamp.example.com/invite/xxx",
      success: () => {
        wx.showToast({ title: "复制成功", icon: "success" });
      },
    });
  },

  onLogout() {
    wx.showModal({
      title: "退出登录",
      content: "确定要退出当前账号吗？",
      confirmColor: "#FF6B6B",
      success: (res) => {
        if (res.confirm) {
          app.doLogout();
          wx.reLaunch({
            url: "/pages/login/login",
          });
        }
      },
    });
  },
});
