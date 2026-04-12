// subpackages/lesson/pages/detail/detail.js
const cloudDb = require("../../../../utils/cloudDb.js");

Page({
  data: {
    course: null,
    subtitles: [],
    subtitleLang: "zh",
    currentTime: 0,
    playing: false,
    showPayModal: false,
    checkedIn: false,
    checkinState: "idle",
    timer: 0,
  },

  onLoad(options) {
    this.loadData(options.id);
  },

  onUnload() {
    if (this.videoTimer) clearInterval(this.videoTimer);
    if (this.checkinTimer) clearInterval(this.checkinTimer);
  },

  async loadData(courseId) {
    try {
      const [courseRes, subtitlesRes] = await Promise.all([
        cloudDb.getCourseById(Number(courseId)),
        cloudDb.getSubtitles(),
      ]);

      const course = courseRes.data[0];

      this.setData({
        course,
        subtitles: subtitlesRes.data,
        checkedIn: course ? course.checkedIn : false,
      });

      if (course && course.status !== "locked") {
        this.startVideoTimer();
      }
    } catch (e) {
      console.error("加载数据失败", e);
    }
  },

  navigateBack() {
    wx.navigateBack();
  },

  startVideoTimer() {
    this.videoTimer = setInterval(() => {
      if (this.data.playing) {
        const nextTime = this.data.currentTime + 1;
        if (nextTime >= 900) {
          this.setData({ currentTime: 0, playing: false });
        } else {
          this.setData({ currentTime: nextTime });
        }
      }
    }, 1000);
  },

  togglePlay() {
    this.setData({ playing: !this.data.playing });
  },

  seekForward() {
    const newTime = Math.min(900, this.data.currentTime + 10);
    this.setData({ currentTime: newTime });
  },

  seekBackward() {
    const newTime = Math.max(0, this.data.currentTime - 10);
    this.setData({ currentTime: newTime });
  },

  resetVideo() {
    this.setData({ currentTime: 0, playing: false });
  },

  switchLang(e) {
    const lang = e.currentTarget.dataset.lang;
    this.setData({ subtitleLang: lang });
  },

  onSubtitleTap(e) {
    const time = e.currentTarget.dataset.time;
    this.setData({ currentTime: time, playing: true });
  },

  openPayModal() {
    this.setData({ showPayModal: true });
  },

  closePayModal() {
    this.setData({ showPayModal: false });
  },

  onPaySuccess() {
    if (this.data.course) {
      const course = { ...this.data.course, status: "unlocked" };
      this.setData({
        course,
        showPayModal: false,
      });
      this.startVideoTimer();
      wx.showToast({ title: "解锁成功", icon: "success" });
    }
  },

  startRecording() {
    if (this.data.checkinState !== "idle") return;
    this.setData({ checkinState: "recording", timer: 0 });

    this.checkinTimer = setInterval(() => {
      this.setData({ timer: this.data.timer + 1 });
    }, 1000);
  },

  stopRecording() {
    if (this.data.checkinState !== "recording") return;

    if (this.checkinTimer) clearInterval(this.checkinTimer);
    this.setData({ checkinState: "processing" });

    setTimeout(() => {
      this.setData({ checkinState: "recognized" });
    }, 2200);
  },

  resetRecording() {
    if (this.checkinTimer) clearInterval(this.checkinTimer);
    this.setData({ checkinState: "idle", timer: 0, isPlaying: false });
  },

  submitCheckin() {
    this.setData({ checkinState: "submitting" });

    setTimeout(() => {
      this.setData({ checkinState: "success", checkedIn: true });
      wx.showToast({ title: "打卡成功 🎉", icon: "success" });
    }, 1500);
  },

  formatTime(s) {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  },
});
