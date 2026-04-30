// pages/home/home.js
const app = getApp();
const cloudDb = require("../../utils/cloudDb.js");
const auth = require("../../utils/auth.js");
const { TIMERS, FLOAT_CTA_SCROLL_TOP, SHARE_TITLE, SHARE_PATH } = require("../../config/constants.js");

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
    if (!auth.checkLoginAndRedirect()) return;
    if (!this.data.banners.length) {
      this.loadData();
    }
  },

  onShow() {
    if (!auth.checkLoginAndRedirect()) return;
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
      const [bannersRes, sellingPointsRes, statsRes, reviewsRes, coursesRes] = await Promise.all([
        cloudDb.getBanners(),
        cloudDb.getSellingPoints(),
        cloudDb.getStats(),
        cloudDb.getReviews(),
        cloudDb.getCourses(),
      ]);

      const userData = await auth.getUserInfo();

      // 处理预览课程封面图
      const previewCourses = await Promise.all(
        (coursesRes.data || []).slice(0, 3).map(async (course, index) => {
          let thumbnail = "";
          if (course.cover) {
            // cover 是云存储 fileID，转换为临时 URL
            try {
              thumbnail = await cloudDb.getCloudFileUrl(course.cover);
            } catch (e) {
              console.warn("获取封面URL失败", e);
            }
          }
          return {
            ...course,
            id: course._id || `course_${index}`,
            day: course.day || (index + 1),
            thumbnail,
          };
        })
      );

      this.setData({
        banners: bannersRes.data || [],
        sellingPoints: sellingPointsRes.data || [],
        stats: statsRes.data || [],
        reviews: reviewsRes.data || [],
        previewCourses,
        userData,
      });
    } catch (e) {
    }
  },

  onPageScroll(e) {
    const showFloatCTA = e.scrollTop > FLOAT_CTA_SCROLL_TOP;
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
    }, TIMERS.BANNER_SWITCH);
  },

  changeBanner(e) {
    const index = e.currentTarget.dataset.index;
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
    }, TIMERS.REVIEW_SWITCH);
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
    const course = e.currentTarget.dataset.course;
    console.log("点击课程:", course);
    console.log("course.day:", course.day);
    const id = course.id || course._id;
    const day = course.day || 1;
    console.log("跳转参数 - id:", id, "day:", day);
    wx.navigateTo({
      url: `/subpackages/lesson/pages/detail/detail?id=${id}&day=${day}`,
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
      title: SHARE_TITLE,
      path: SHARE_PATH,
      imageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&q=80",
    };
  },
});
