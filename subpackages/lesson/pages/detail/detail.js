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
    videoLoading: true,      // 视频加载状态
    downloadProgress: 0,     // 下载进度
    hasZhSubtitle: false,    // 是否有中文字幕
    showZhSubtitle: false,   // 是否显示中文字幕
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
        wx.showToast({ title: "课程不存在", icon: "none" });
        return;
      }

      // 格式化状态：首节课免费解锁
      var status = course.status || "locked";
      if (course.isPaid || course.unlocked) status = "unlocked";
      if (course.completed) status = "completed";
      
      // 确保 day 是数字
      var courseDay = course.day ? Number(course.day) : (day ? Number(day) : 1);
      
      // 首节课免费解锁
      if (courseDay === 1) {
        status = "unlocked";
      }
      
      // 组装课程基础信息（不含视频URL，先显示页面）
      var courseInfo = {
        _id: course._id,
        title: course.title,
        file: course.file,
        srt_en: course.srt_en,
        srt_zh: course.srt_zh,
        id: (course._id && course._id !== 'undefined') ? course._id : 'course_' + (courseDay - 1),
        day: courseDay,
        status: status,
        enSubtitles: [],
        zhSubtitles: [],
      };

      // 先显示页面基本信息
      this.setData({
        course: courseInfo,
        videoLoading: true,
        downloadProgress: 0,
      });

      // 保存 videoContext
      this.videoContext = wx.createVideoContext('videoPlayer');
      
      // 异步加载字幕（不阻塞页面显示）
      this.loadSubtitles(course);

      // 异步下载视频（带进度回调）
      this.downloadVideoWithProgress(course.file);
      
    } catch (e) {
      console.error("加载数据失败:", e);
      wx.showToast({ title: "加载失败", icon: "none" });
    }
  },

  // 异步加载字幕
  async loadSubtitles(course) {
    try {
      var enSubtitles = [];
      var zhSubtitles = [];
      
      // 并行下载字幕文件
      if (course.srt_en || course.srt_zh) {
        var [enSubUrl, zhSubUrl] = await Promise.all([
          course.srt_en ? cloudDb.downloadCloudFile(course.srt_en) : Promise.resolve(""),
          course.srt_zh ? cloudDb.downloadCloudFile(course.srt_zh) : Promise.resolve(""),
        ]);
        
        // 解析字幕
        if (enSubUrl) {
          enSubtitles = this.parseSrtSync(enSubUrl);
        }
        if (zhSubUrl) {
          zhSubtitles = this.parseSrtSync(zhSubUrl);
        }
      }
      
      // 合并英文字幕和中文字幕
      var mergedSubtitles = this.mergeSubtitles(enSubtitles, zhSubtitles);
      this.setData({
        subtitles: mergedSubtitles,
        hasZhSubtitle: zhSubtitles.length > 0,
      });
      
    } catch (e) {
      console.warn("加载字幕失败:", e);
    }
  },

  // 带进度的视频下载
  downloadVideoWithProgress(filePath) {
    if (!filePath) {
      this.setData({ videoLoading: false });
      return;
    }
    
    // 检查缓存
    var cachedUrl = cloudDb.getCachedFile(filePath);
    if (cachedUrl) {
      console.log("视频已缓存，直接播放");
      this.onVideoReady(cachedUrl);
      return;
    }
    
    console.log("开始下载视频:", filePath);
    
    // 先获取云存储的临时链接
    wx.cloud.getTempFileURL({
      fileList: [filePath],
    }).then((res) => {
      if (res.fileList && res.fileList[0] && res.fileList[0].tempFileURL) {
        var tempUrl = res.fileList[0].tempFileURL;
        console.log("获取临时链接成功:", tempUrl);
        this.downloadFileWithProgress(tempUrl, filePath);
      } else {
        console.error("获取临时链接失败");
        this.setData({ videoLoading: false });
        wx.showToast({ title: "视频加载失败", icon: "none" });
      }
    }).catch((err) => {
      console.error("获取临时链接失败:", err);
      this.setData({ videoLoading: false });
      wx.showToast({ title: "视频加载失败", icon: "none" });
    });
  },

  // 使用 wx.downloadFile 下载（支持进度监听）
  downloadFileWithProgress(url, filePath) {
    var task = wx.downloadFile({
      url: url,
      success: (res) => {
        console.log("下载完成:", res);
        if (res.statusCode === 200 && res.tempFilePath) {
          // 缓存文件路径
          cloudDb.cacheFile(filePath, res.tempFilePath);
          this.onVideoReady(res.tempFilePath);
        } else {
          this.setData({ videoLoading: false });
          wx.showToast({ title: "视频加载失败", icon: "none" });
        }
      },
      fail: (err) => {
        console.error("下载失败:", err);
        this.setData({ videoLoading: false });
        wx.showToast({ title: "视频加载失败", icon: "none" });
      }
    });
    
    // 监听下载进度
    task.onProgressUpdate((res) => {
      console.log("下载进度:", res.progress);
      this.setData({ downloadProgress: res.progress });
    });
  },

  // 视频准备就绪
  onVideoReady(videoUrl) {
    console.log("视频准备就绪:", videoUrl);
    this.setData({
      videoUrl: videoUrl,
      videoLoading: false,
      downloadProgress: 100,
    });
    
    // 自动播放视频
    setTimeout(() => {
      if (this.videoContext) {
        this.videoContext.play();
        console.log("自动播放视频");
      }
    }, 300);
  },

  // 同步解析 SRT 文件
  parseSrtSync(filePath) {
    try {
      var content = wx.getFileSystemManager().readFileSync(filePath, 'utf-8');
      return this.srtToArray(content);
    } catch (e) {
      console.warn("解析SRT失败:", e);
      return [];
    }
  },

  // 合并英文字幕和中文字幕
  mergeSubtitles(enSubs, zhSubs) {
    // 以英文字幕为基准，匹配对应时间的中文
    var zhMap = {};
    zhSubs.forEach(function(zh) {
      zhMap[zh.start] = zh.en;  // 存中文内容到 en 字段（复用）
    });
    
    return enSubs.map(function(en) {
      return {
        id: en.id,
        start: en.start,
        end: en.end,
        en: en.en,
        zh: zhMap[en.start] || '',
      };
    });
  },

  // 切换中文字幕显示
  toggleZhSubtitle() {
    this.setData({
      showZhSubtitle: !this.data.showZhSubtitle,
    });
  },

  // 视频等待缓冲
  onVideoWaiting(e) {
    console.log("视频缓冲中...");
    this.setData({ videoLoading: true });
  },

  // 视频播放时更新 playing 状态
  onVideoPlay(e) {
    this.setData({ playing: true, videoLoading: false });
  },

  // 解析 SRT 文件内容
  parseSrt(filePath) {
    try {
      var content = wx.getFileSystemManager().readFileSync(filePath, 'utf-8');
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

  onSubtitleTap(e) {
    var time = Number(e.currentTarget.dataset.time);
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
