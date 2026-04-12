// pages/home/home.js
const app = getApp();
const cloudDb = require("../../utils/cloudDb.js");

Page({
  data: {
    bannerIndex: 0,
    reviewIndex: 0,
    banners: [],
    sellingPoints: [],
    stats: [],
    reviews: [],
    previewCourses: [],
    showFloatCTA: false,
    showShareModal: false,
    showLoginTip: false,
    userData: null,
  },

  onLoad() {
    // 检查登录状态，未登录则跳转登录页（游客模式也允许浏览）
    if (!app.globalData.isLoggedIn) {
      wx.redirectTo({
        url: "/pages/login/login",
      });
      return;
    }
    // 仅首次加载时请求数据
    if (!this.data.banners.length) {
      this.loadData();
    }
  },

  onShow() {
    // 每次显示页面检查登录状态
    if (!app.globalData.isLoggedIn) {
      wx.redirectTo({
        url: "/pages/login/login",
      });
      return;
    }
    // 下拉刷新时重新加载
  },

  onLoginSuccess() {
    this.setData({ showLoginTip: false });
    // 重新加载数据
    this.loadData();
    // 通知 app 更新全局状态
    app.checkLoginStatus();
  },

  onUnload() {
    if (this.bannerTimer) clearInterval(this.bannerTimer);
    if (this.reviewTimer) clearInterval(this.reviewTimer);
  },

  async loadData() {
    try {
      // 并行查询所有数据
      const [bannersRes, sellingPointsRes, statsRes, reviewsRes, coursesRes] = await Promise.all([
        cloudDb.getBanners(),
        cloudDb.getSellingPoints(),
        cloudDb.getStats(),
        cloudDb.getReviews(),
        cloudDb.getCourses(),
      ]);

      const openid = app.globalData.openid;
      const userInfo = app.globalData.userInfo;
      
      // 优先使用全局用户信息，否则从数据库获取
      let userData = null;
      
      if (userInfo) {
        userData = {
          name: userInfo.name || userInfo.nickName || "新用户",
          avatar: userInfo.avatar || userInfo.avatarUrl || "",
        };
      } else if (openid) {
        try {
          const userRes = await cloudDb.getUser(openid);
          userData = userRes.data[0] || null;
        } catch (e) {
          console.warn("获取用户数据失败", e);
        }
      }

      this.setData({
        banners: bannersRes.data || [],
        sellingPoints: sellingPointsRes.data || [],
        stats: statsRes.data || [],
        reviews: reviewsRes.data || [],
        previewCourses: (coursesRes.data || []).slice(0, 3),
        userData,
      });
    } catch (e) {
      console.error("加载数据失败", e);
    }
  },

  onPageScroll(e) {
    const showFloatCTA = e.scrollTop > 200;
    if (showFloatCTA !== this.data.showFloatCTA) {
      this.setData({ showFloatCTA });
    }
  },

  startBannerTimer() {
    if (this.bannerTimer) clearInterval(this.bannerTimer);
    this.bannerTimer = setInterval(() => {
      const len = this.data.banners.length;
      if (len === 0) return;
      this.setData({
        bannerIndex: (this.data.bannerIndex + 1) % len,
      });
    }, 3800);
  },

  changeBanner(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ bannerIndex: index });
    this.startBannerTimer();
  },

  prevBanner() {
    const len = this.data.banners.length;
    if (len === 0) return;
    const index = this.data.bannerIndex > 0 ? this.data.bannerIndex - 1 : len - 1;
    this.setData({ bannerIndex: index });
    this.startBannerTimer();
  },

  nextBanner() {
    const len = this.data.banners.length;
    if (len === 0) return;
    const index = this.data.bannerIndex < len - 1 ? this.data.bannerIndex + 1 : 0;
    this.setData({ bannerIndex: index });
    this.startBannerTimer();
  },

  startReviewTimer() {
    if (this.reviewTimer) clearInterval(this.reviewTimer);
    this.reviewTimer = setInterval(() => {
      const len = this.data.reviews.length;
      if (len === 0) return;
      this.setData({
        reviewIndex: (this.data.reviewIndex + 1) % len,
      });
    }, 3200);
  },

  changeReview(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ reviewIndex: index });
    this.startReviewTimer();
  },

  goToCourses() {
    if (!app.globalData.isLoggedIn) {
      this.setData({ showLoginTip: true });
      return;
    }
    wx.switchTab({
      url: "/pages/courses/courses",
    });
  },

  goToCourseDetail(e) {
    if (!app.globalData.isLoggedIn) {
      this.setData({ showLoginTip: true });
      return;
    }
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/subpackages/lesson/pages/detail/detail?id=${id}`,
    });
  },

  openShareModal() {
    this.setData({ showShareModal: true });
  },

  closeShareModal() {
    this.setData({ showShareModal: false });
  },

  onShareAppMessage() {
    return {
      title: "雅思听力21天突破计划",
      path: "/pages/home/home",
      imageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&q=80",
    };
  },
});
