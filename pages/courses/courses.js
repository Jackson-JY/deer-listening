// pages/courses/courses.js
const app = getApp();
const cloudDb = require("../../utils/cloudDb.js");

Page({
  data: {
    courses: [],
    completed: 0,
    total: 0,
    streak: 0,
    progress: 0,
    showPayModal: false,
    selectedCourse: null,
    isRefreshing: false,
    showLoginTip: false,
  },

  onLoad() {
    if (!app.globalData.isLoggedIn) {
      wx.redirectTo({
        url: "/pages/login/login",
      });
      return;
    }
    this.loadCourses();
    this.loadUserData();
  },

  onShow() {
    // 每次显示页面时检查登录状态
    if (!app.globalData.isLoggedIn) {
      wx.redirectTo({
        url: "/pages/login/login",
      });
      return;
    }
    // 仅首次加载时请求数据
    if (!this.data.courses.length) {
      this.loadCourses();
      this.loadUserData();
    }
  },

  async loadCourses() {
    try {
      const res = await cloudDb.getCourses();
      const courses = res.data;
      const completed = courses.filter(c => c.status === "completed").length;
      const total = courses.length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      this.setData({
        courses,
        completed,
        total,
        progress,
      });
    } catch (e) {
      console.error("加载课程失败", e);
    }
  },

  async loadUserData() {
    try {
      const res = await cloudDb.getUser();
      if (res.data.length > 0) {
        this.setData({ streak: res.data[0].streak });
      }
    } catch (e) {
      console.error("加载用户数据失败", e);
    }
  },

  onPullDownRefresh() {
    this.setData({ isRefreshing: true });
    Promise.all([this.loadCourses(), this.loadUserData()])
      .finally(() => {
        this.setData({ isRefreshing: false });
        wx.stopPullDownRefresh();
        wx.showToast({ title: "刷新成功", icon: "success" });
      });
  },

  onCourseTap(e) {
    const course = e.currentTarget.dataset.course;

    if (course.status === "locked") {
      this.setData({
        showPayModal: true,
        selectedCourse: course,
      });
    } else {
      wx.navigateTo({
        url: `/subpackages/lesson/pages/detail/detail?id=${course.id}`,
      });
    }
  },

  onLoginSuccess() {
    this.setData({ showLoginTip: false });
    this.loadCourses();
    this.loadUserData();
  },

  closePayModal() {
    this.setData({
      showPayModal: false,
      selectedCourse: null,
    });
  },

  onPaySuccess() {
    if (!this.data.selectedCourse) return;

    const courses = this.data.courses.map(c => {
      if (c.id === this.data.selectedCourse.id) {
        return { ...c, status: "unlocked" };
      }
      return c;
    });

    this.setData({ courses, showPayModal: false, selectedCourse: null });
    wx.showToast({ title: "支付成功", icon: "success" });
  },
});
