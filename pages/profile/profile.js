// pages/profile/profile.js
const app = getApp();
const cloudDb = require("../../utils/cloudDb.js");
const auth = require("../../utils/auth.js");
const { CALENDAR_DAYS, CALENDAR_CELLS, INVITE_LINK, PAGES } = require("../../config/constants.js");

Page({
  data: {
    user: null,
    checkInHistory: [],
    calendarWeeks: [],
    expandedRecord: null,
    showLoginTip: false,
  },

  onLoad() {
    if (!auth.checkLoginAndRedirect()) return;
    this.loadData();
  },

  onShow() {
    if (!auth.checkLoginAndRedirect()) return;
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
      let user = await auth.getUserInfo();

      // 如果头像字段是 cloud:// 开头的 fileID，转换为临时 URL
      if (user && user.avatar && user.avatar.startsWith("cloud://")) {
        try {
          const urlRes = await wx.cloud.getTempFileURL({
            fileList: [user.avatar]
          });
          if (urlRes.fileList && urlRes.fileList[0] && urlRes.fileList[0].tempFileURL) {
            user = { ...user, avatar: urlRes.fileList[0].tempFileURL };
          }
        } catch (e) {}
      }

      let checkInRes = { data: [] };
      try {
        checkInRes = await cloudDb.getCheckInHistory();
      } catch (e) {}

      const calendarData = cloudDb.generateCalendarData();

      this.setData({
        user,
        checkInHistory: checkInRes.data || [],
        calendarWeeks: this.buildCalendarWeeks(calendarData),
      });
    } catch (e) {
    }
  },

  buildCalendarWeeks(calendarData) {
    const weeks = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDay = new Date(today);
    firstDay.setDate(today.getDate() - CALENDAR_DAYS);
    firstDay.setDate(firstDay.getDate() - firstDay.getDay());

    let currentWeek = [];

    for (let i = 0; i < CALENDAR_CELLS; i++) {
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
