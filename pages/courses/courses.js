// pages/courses/courses.js
const app = getApp();
const cloudDb = require("../../utils/cloudDb.js");
const auth = require("../../utils/auth.js");

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
    if (!auth.checkLoginAndRedirect()) return;
    this.loadCourses();
    this.loadUserData();
  },

  onShow() {
    if (!auth.checkLoginAndRedirect()) return;
    if (!this.data.courses.length) {
      this.loadCourses();
      this.loadUserData();
    }
  },

  async loadCourses() {
    try {
      wx.showLoading({ title: "加载中..." });
      const res = await cloudDb.getCourses();
      console.log("原始课程数据:", res);
      let courses = res.data || [];
      console.log("课程列表:", courses);
      
      // 处理课程数据：lecture 表字段为 title, file, cover, srt_en, srt_zh
      courses = await Promise.all(courses.map(async (course, index) => {
        // 获取视频URL
        let videoUrl = "";
        if (course.file) {
          try {
            // 使用 downloadCloudFile 获取临时文件路径
            videoUrl = await cloudDb.downloadCloudFile(course.file);
          } catch (e) {
            console.warn("获取视频失败", e);
          }
        }
        
        // 封面图：优先使用 cover 字段（fileID），否则使用视频
        let thumbnail = "";
        if (course.cover) {
          // cover 是云存储 fileID，转换为临时 URL
          try {
            thumbnail = await cloudDb.getCloudFileUrl(course.cover);
          } catch (e) {
            console.warn("获取封面URL失败", e);
          }
        }
        // 如果没有 cover 字段，使用视频作为封面
        if (!thumbnail && videoUrl) {
          thumbnail = videoUrl;
        }
        
        // 默认视频时长（15分钟），实际时长需要获取视频metadata
        const duration = "15:00";
        
        // 格式化状态：首节课免费解锁
        let status = course.status || "locked";
        if (course.isPaid || course.unlocked) status = "unlocked";
        if (course.completed) status = "completed";
        if (course.inProgress) status = "inProgress";
        if (index === 0) status = "unlocked";  // 首节课免费
        
        return {
          ...course,
          // lecture 表使用 _id，如果没有则用索引生成
          id: (course._id && course._id !== 'undefined') ? course._id : `course_${index}`,
          // lecture 表没有 day 字段时，用索引代替
          day: course.day || (index + 1),
          title: course.title || `Lesson ${index + 1}`,
          thumbnail,
          videoUrl,
          duration,
          status,
          progress: course.progress || (status === "completed" ? 100 : 0),
          checkedIn: course.checkedIn || false,
        };
      }));
      
      const completed = courses.filter(c => c.status === "completed").length;
      const total = courses.length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      this.setData({
        courses,
        completed,
        total,
        progress,
      });
      wx.hideLoading();
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: "加载失败", icon: "none" });
    }
  },

  async loadUserData() {
    try {
      const openid = app.globalData.openid;
      if (!openid) return;
      
      const res = await cloudDb.getUser(openid);
      if (res.data && res.data.length > 0) {
        this.setData({ streak: res.data[0].streak || 0 });
      }
    } catch (e) {
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
      // 使用处理后的 id 跳转
      const courseId = course.id || course._id;
      wx.navigateTo({
        url: `/subpackages/lesson/pages/detail/detail?id=${courseId}&day=${course.day}`,
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
