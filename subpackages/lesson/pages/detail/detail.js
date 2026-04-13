// subpackages/lesson/pages/detail/detail.js
const cloudDb = require("../../../../utils/cloudDb.js");

Page({
  data: {
    course: null,
    videoUrl: "",
    subtitles: [],
    subtitleLang: "en",
    currentTime: 0,
    currentSubId: "",
    playing: false,
    showPayModal: false,
    checkedIn: false,
    checkinState: "idle",
    timer: 0,
    videoContext: null,
  },

  onLoad(options) {
    console.log("详情页onLoad:", options);
    // 确保 id 有值
    var courseId = options.id || options.day;
    var day = options.day || "1";
    console.log("课程ID:", courseId);
    console.log("Day参数:", day);
    this.loadData(courseId, day);
  },

  onUnload() {
    if (this.checkinTimer) clearInterval(this.checkinTimer);
  },

  async loadData(courseId, day) {
    console.log("loadData开始, id:", courseId, "day:", day);
    try {
      wx.showLoading({ title: "加载中..." });
      
      var courseRes;
      
      // lecture 表优先使用 _id 查询
      if (courseId && courseId.startsWith && !courseId.startsWith('day_') && !courseId.startsWith('course_')) {
        // 使用 _id 查询
        courseRes = await cloudDb.getCourseById(courseId);
      } else {
        // lecture 表没有 day 字段，使用 _id 查询全部然后取第 N 个
        var allCourses = await cloudDb.getCourses();
        var index = parseInt(day, 10) - 1;
        courseRes = { data: allCourses.data ? [allCourses.data[index]] : [] };
      }
      
      var course = courseRes.data && courseRes.data[0];
      
      if (!course) {
        wx.hideLoading();
        wx.showToast({ title: "课程不存在", icon: "none" });
        return;
      }

      // lecture 表字段：title, file, srt_en, srt_zh
      // 获取云存储视频URL（下载到本地获取临时路径）
      var videoUrl = "";
      if (course.file) {
        try {
          // 使用 downloadCloudFile 获取临时文件路径供 video 组件使用
          videoUrl = await cloudDb.downloadCloudFile(course.file);
          console.log("视频路径:", videoUrl);
        } catch (e) {
          console.error("获取视频失败", e);
        }
      }
      
      // 获取字幕文件内容
      var enSubUrl = "";
      var zhSubUrl = "";
      try {
        // 下载字幕文件到本地
        if (course.srt_en) {
          enSubUrl = await cloudDb.downloadCloudFile(course.srt_en);
          console.log("英文字幕路径:", enSubUrl);
        }
        if (course.srt_zh) {
          zhSubUrl = await cloudDb.downloadCloudFile(course.srt_zh);
          console.log("中文字幕路径:", zhSubUrl);
        }
      } catch (e) {
        console.error("获取字幕失败:", e);
      }
      
      // 分别加载字幕内容
      var enSubtitles = [];
      var zhSubtitles = [];
      try {
        if (enSubUrl) {
          enSubtitles = await this.parseSrt(enSubUrl);
          console.log("英文字幕数量:", enSubtitles.length);
        }
        if (zhSubUrl) {
          zhSubtitles = await this.parseSrt(zhSubUrl);
          console.log("中文字幕数量:", zhSubtitles.length);
        }
      } catch (e) {
        console.warn("加载字幕内容失败:", e);
      }
      
      // 格式化状态：首节课免费解锁
      var status = course.status || "locked";
      if (course.isPaid || course.unlocked) status = "unlocked";
      if (course.completed) status = "completed";
      
      // 确保 day 是数字：优先使用 lecture 表的 day 字段，其次用传入的 day 参数，最后默认 1
      var courseDay = course.day ? Number(course.day) : (day ? Number(day) : 1);
      
      console.log("状态计算 - 原始day:", day, "course.day:", course.day, "courseDay:", courseDay);
      
      // 首节课免费解锁
      if (courseDay === 1) {
        console.log("Day 1 课程，设置为 unlocked");
        status = "unlocked";
      }
      
      // 默认显示英文字幕
      var defaultSubtitles = enSubtitles.length > 0 ? enSubtitles : zhSubtitles;
      
      course = {
        _id: course._id,
        title: course.title,
        file: course.file,
        srt_en: course.srt_en,
        srt_zh: course.srt_zh,
        // lecture 表使用 _id
        id: (course._id && course._id !== 'undefined') ? course._id : 'course_' + (courseDay - 1),
        day: courseDay,
        videoUrl: videoUrl,
        enSubtitles: enSubtitles,
        zhSubtitles: zhSubtitles,
        status: status,
      };

      this.setData({
        course: course,
        videoUrl: videoUrl,
        subtitles: defaultSubtitles,
        checkedIn: course.checkedIn || false,
      });

      // 保存 videoContext 供字幕点击跳转使用
      this.videoContext = wx.createVideoContext('videoPlayer');

      console.log("课程数据:", course);
      console.log("视频URL:", videoUrl);
      console.log("状态:", status);

      // 视频时间由 bindtimeupdate 事件同步，不再使用模拟定时器
      
      wx.hideLoading();
    } catch (e) {
      console.error("加载数据失败:", e);
      console.error("错误详情:", JSON.stringify(e));
      wx.hideLoading();
      wx.showToast({ title: "加载失败", icon: "none" });
    }
  },

  async parseSrt(filePath) {
    // 解析 SRT 文件内容
    // filePath 是已下载的本地临时文件路径
    try {
      // 使用同步方式读取文件
      var content = wx.getFileSystemManager().readFileSync(filePath, 'utf-8');
      console.log("字幕内容长度:", content.length);
      return this.srtToArray(content);
    } catch (e) {
      console.warn("解析SRT失败:", e);
      return [];
    }
  },

  srtToArray(srtContent) {
    // 解析 SRT 内容为数组
    var blocks = srtContent.split(/\n\n+/);
    var result = [];
    
    blocks.forEach(function(block) {
      var lines = block.trim().split('\n');
      if (lines.length >= 3) {
        var timeMatch = lines[1].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
        if (timeMatch) {
          var start = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseInt(timeMatch[3]);
          var end = parseInt(timeMatch[5]) * 3600 + parseInt(timeMatch[6]) * 60 + parseInt(timeMatch[7]);
          var text = lines.slice(2).join('\n');
          
          result.push({
            id: result.length + 1,
            start: start,
            end: end,
            en: text,
            zh: "",
          });
        }
      }
    });
    
    return result;
  },

  navigateBack() {
    wx.navigateBack();
  },

  // 视频播放时更新 playing 状态
  onVideoPlay(e) {
    this.setData({ playing: true });
  },

  // 视频暂停时更新 playing 状态
  onVideoPause(e) {
    this.setData({ playing: false });
  },

  // 同步视频真实播放时间到字幕
  onVideoTimeUpdate(e) {
    var currentTime = Math.floor(e.detail.currentTime);
    
    // 找到当前播放的字幕
    var subtitles = this.data.subtitles;
    var newSubId = "";
    for (var i = 0; i < subtitles.length; i++) {
      if (currentTime >= subtitles[i].start && currentTime < subtitles[i].end) {
        newSubId = "sub_" + subtitles[i].id;
        break;
      }
    }
    
    // 只在字幕变化时更新 currentSubId，避免抖动
    if (newSubId !== this.data.currentSubId) {
      this.setData({ 
        currentTime: currentTime,
        currentSubId: newSubId
      });
    } else if (currentTime !== this.data.currentTime) {
      // 字幕没变，只更新时间（用于高亮显示）
      this.setData({ currentTime: currentTime });
    }
  },

  switchLang(e) {
    var lang = e.currentTarget.dataset.lang;
    var course = this.data.course;
    var subtitles = lang === 'zh' ? (course.zhSubtitles || []) : (course.enSubtitles || []);
    this.setData({ 
      subtitleLang: lang,
      subtitles: subtitles,
    });
  },

  onSubtitleTap(e) {
    var time = Number(e.currentTarget.dataset.time);
    console.log("点击字幕, time:", time);
    if (this.videoContext) {
      this.videoContext.seek(time);
    }
  },

  openPayModal() {
    this.setData({ showPayModal: true });
  },

  closePayModal() {
    this.setData({ showPayModal: false });
  },

  onPaySuccess() {
    if (this.data.course) {
      var course = { _id: this.data.course._id, title: this.data.course.title, status: "unlocked" };
      this.setData({
        course: course,
        showPayModal: false,
      });
      wx.showToast({ title: "解锁成功", icon: "success" });
    }
  },

  startRecording() {
    if (this.data.checkinState !== "idle") return;
    this.setData({ checkinState: "recording", timer: 0 });

    this.checkinTimer = setInterval(function() {
      this.setData({ timer: this.data.timer + 1 });
    }.bind(this), 1000);
  },

  stopRecording() {
    if (this.data.checkinState !== "recording") return;

    if (this.checkinTimer) clearInterval(this.checkinTimer);
    this.setData({ checkinState: "processing" });

    setTimeout(function() {
      this.setData({ checkinState: "recognized" });
    }.bind(this), 2200);
  },

  resetRecording() {
    if (this.checkinTimer) clearInterval(this.checkinTimer);
    this.setData({ checkinState: "idle", timer: 0, isPlaying: false });
  },

  submitCheckin() {
    this.setData({ checkinState: "submitting" });

    setTimeout(function() {
      this.setData({ checkinState: "success", checkedIn: true });
      wx.showToast({ title: "打卡成功", icon: "success" });
    }.bind(this), 1500);
  },

  formatTime(s) {
    var mins = Math.floor(s / 60);
    var secs = s % 60;
    return (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
  },
});
