// config/constants.js - 全局常量配置

module.exports = {
  // 云环境ID
  CLOUD_ENV: "cloud1-1g8cunkpa5bc6421",

  // 定时器配置 (毫秒)
  TIMERS: {
    BANNER_SWITCH: 3800,      // Banner自动轮播间隔
    REVIEW_SWITCH: 3200,       // 评价轮播间隔
    LOADING_DOTS: 400,         // 登录加载动画
    LOGIN_JUMP_DELAY: 1500,    // 登录成功后跳转延迟
    PAY_SUCCESS_DELAY: 1800,   // 支付成功提示延迟
    PAY_PROCESS_DELAY: 2000,   // 支付处理中延迟
    RECOGNIZE_DELAY: 2200,     // 语音识别延迟
    CHECKIN_SUBMIT_DELAY: 1500, // 打卡提交延迟
    COPY_SUCCESS_DELAY: 2000,  // 复制成功提示延迟
  },

  // 业务常量
  VIDEO_MAX_DURATION: 900,    // 视频最大时长(秒) = 15分钟
  VIDEO_SEEK_STEP: 10,        // 视频快进/快退步长(秒)
  CALENDAR_DAYS: 48,          // 日历显示天数
  CALENDAR_CELLS: 49,         // 日历总格子数
  TOTAL_COURSES: 21,          // 课程总数
  MIN_NICKNAME_LENGTH: 2,     // 最小昵称长度

  // 滚动相关
  FLOAT_CTA_SCROLL_TOP: 200,  // 浮动CTA显示的滚动高度

  // 分享配置
  SHARE_TITLE: "雅思听力21天突破计划",
  SHARE_PATH: "/pages/home/home",
  INVITE_LINK: "https://ieltscamp.example.com/invite/xxx",

  // 存储Key
  STORAGE_KEYS: {
    IS_LOGGED_IN: "isLoggedIn",
    OPENID: "openid",
    USER_INFO: "userInfo",
  },

  // 页面路径
  PAGES: {
    LOGIN: "/pages/login/login",
    HOME: "/pages/home/home",
    COURSES: "/pages/courses/courses",
    PROFILE: "/pages/profile/profile",
    COURSE_DETAIL: "/subpackages/lesson/pages/detail/detail",
  },
};
