// pages/login/login.js
const { getDb } = require("../../utils/cloudDb.js");
const { TIMERS, MIN_NICKNAME_LENGTH, PAGES } = require("../../config/constants.js");

Page({
  data: {
    // 弹窗控制
    showAuthModal: false,
    authStep: "request", // request | loading | success

    // 表单数据
    formData: {
      avatar: "",
      nickName: "",
    },

    // 动画
    loadingDots: "",
  },

  // 定时器
  _dotsTimer: null,

  // 缓存 openid，避免重复调用云函数
  _openid: "",

  onLoad() {
    // 检查是否已登录，已登录则直接跳转
    const app = getApp();
    if (app.globalData.isLoggedIn) {
      this.goToApp();
    }
  },

  onUnload() {
    this._clearDotsTimer();
  },

  // 点击登录按钮
  onLoginPress() {
    // 先检查数据库中是否已有该用户，有则直接登录
    this.setData({ authStep: "loading" });
    this._startDotsAnimation();

    wx.cloud.callFunction({
      name: "login",
    }).then(res => {
      const openid = res.result?.openid;

      if (openid) {
        this._openid = openid; // 缓存 openid
        // 查询数据库是否有该用户
        return this._checkUserInDb(openid).then(userExists => {
          if (userExists) {
            // 用户已存在，直接登录
            this._clearDotsTimer();
            this._loginWithExistingUser(openid);
          } else {
            // 用户不存在，显示表单让用户填写信息
            this._clearDotsTimer();
            this.setData({
              showAuthModal: true,
              authStep: "request",
              formData: { avatar: "", nickName: "" }
            });
          }
        });
      } else {
        throw new Error("获取 openid 失败");
      }
    }).catch(() => {
      this._clearDotsTimer();
      // 即使失败也显示表单
      this.setData({
        showAuthModal: true,
        authStep: "request",
        formData: { avatar: "", nickName: "" }
      });
    });
  },

  // 检查用户是否已在数据库中
  _checkUserInDb(openid) {
    return getDb().collection("users").where({ openid }).count()
      .then(res => {
        return res.total > 0;
      })
      .catch(() => {
        return false;
      });
  },

  // 使用已有用户信息登录
  _loginWithExistingUser(openid) {
    const app = getApp();

    getDb().collection("users").where({ openid }).get()
      .then(res => {
        if (res.data && res.data.length > 0) {
          const userData = res.data[0];
          app.globalData.isLoggedIn = true;
          app.globalData.openid = openid;
          app.globalData.userInfo = {
            avatar: userData.avatar || "",  // 可能仍是 fileID
            avatarFileId: userData.avatar || "",
            name: userData.name || "",
            avatarUrl: userData.avatar || "",
            nickName: userData.name || "",
          };

          wx.setStorageSync("isLoggedIn", true);
          wx.setStorageSync("openid", openid);
          wx.setStorageSync("userInfo", app.globalData.userInfo);

          this.goToApp();
        } else {
          // 用户不存在，显示表单
          this.setData({
            showAuthModal: true,
            authStep: "request",
            formData: { avatar: "", nickName: "" }
          });
        }
      })
      .catch(() => {
        // 获取失败也显示表单
        this.setData({
          showAuthModal: true,
          authStep: "request",
          formData: { avatar: "", nickName: "" }
        });
      });
  },

  // 关闭弹窗
  onCloseModal() {
    if (this.data.authStep === "loading" || this.data.authStep === "success") return;
    this.setData({ showAuthModal: false, authStep: "request" });
  },

  // 阻止事件冒泡
  noop() {},

  // 取消
  onDeny() {
    this.setData({ showAuthModal: false, authStep: "request" });
  },

  // 选择头像 - 使用微信头像选择器
  onChooseAvatar(e) {
    const avatarUrl = e.detail.avatarUrl;
    if (avatarUrl) {
      this.setData({
        'formData.avatar': avatarUrl
      });
    }
  },

  // 昵称输入
  onNickNameInput(e) {
    this.setData({
      'formData.nickName': e.detail.value
    });
  },

  // 昵称输入框失焦 - 确保微信昵称选择器填充的值被获取
  onNickNameBlur(e) {
    const value = e.detail.value;
    if (value) {
      this.setData({
        'formData.nickName': value
      });
    }
  },

  // 提交表单
  onSubmitForm() {
    const { avatar, nickName } = this.data.formData;

    // 验证昵称
    if (!nickName || nickName.trim().length === 0) {
      wx.showToast({
        title: "请输入昵称",
        icon: "none"
      });
      return;
    }

    const trimmedNickName = nickName.trim();
    if (trimmedNickName.length < 2) {
      wx.showToast({
        title: "昵称至少2个字符",
        icon: "none"
      });
      return;
    }

    // 显示加载状态
    this.setData({ authStep: "loading" });
    this._startDotsAnimation();

    // 上传头像（如有）
    this._uploadAvatar(avatar).then(avatarUrl => {
      this._loginWithLocalUserInfo(avatarUrl, trimmedNickName);
    }).catch(() => {
      this._loginWithLocalUserInfo("", trimmedNickName);
    });
  },

  // 上传头像到云存储，返回 fileID
  _uploadAvatar(filePath) {
    return new Promise((resolve, reject) => {
      if (!filePath) {
        reject(new Error("没有头像"));
        return;
      }

      // 生成文件名
      const ext = filePath.split('.').pop() || 'jpg';
      const cloudPath = `avatars/${Date.now()}.${ext}`;

      wx.cloud.uploadFile({
        cloudPath,
        filePath,
        success: (res) => {
          // 直接返回 fileID，不获取临时 URL
          // 读取时再动态转换
          resolve(res.fileID);
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  },

  // 本地用户信息登录 - 复用缓存的 openid
  _loginWithLocalUserInfo(avatarUrl, nickName) {
    const app = getApp();
    const openid = this._openid;
    
    this._clearDotsTimer();

    if (!openid) {
      wx.showToast({
        title: "登录失败，请重试",
        icon: "none",
      });
      this.setData({ showAuthModal: false, authStep: "request" });
      return;
    }

    // 保存登录状态
    app.globalData.isLoggedIn = true;
    app.globalData.openid = openid;
    app.globalData.userInfo = {
      avatar: avatarUrl,
      name: nickName,
      avatarUrl: avatarUrl,
      nickName: nickName,
    };

    // 保存到本地存储
    wx.setStorageSync("isLoggedIn", true);
    wx.setStorageSync("openid", openid);
    wx.setStorageSync("userInfo", app.globalData.userInfo);

    this.setData({ authStep: "success" });

    // 保存新用户到数据库
    this._saveUserToDb(openid, avatarUrl, nickName);

    // 延迟跳转
    setTimeout(() => {
      this.setData({ showAuthModal: false });
      this.goToApp();
    }, 1500);
  },

  // 保存新用户到数据库
  _saveUserToDb(openid, avatarUrl, nickName) {
    const db = getDb();

    db.collection("users").add({
      data: {
        openid,
        avatar: avatarUrl || "",
        name: nickName,
        streak: 0,
        completed: 0,
        totalScore: 0,
        isAdmin: false,
        createdAt: db.serverDate(),
        lastLogin: db.serverDate(),
      },
    }).catch(() => {
    });
  },

  // 跳过登录 - 游客模式
  onSkipLogin() {
    // 设置游客模式，允许浏览但不能使用需要登录的功能
    const app = getApp();
    app.setGuestMode();

    wx.showToast({
      title: "已跳过登录",
      icon: "none",
      duration: 1500,
    });
    this.goToApp();
  },

  // 跳转到首页
  goToApp() {
    wx.switchTab({
      url: "/pages/home/home",
    });
  },

  // 加载动画点
  _startDotsAnimation() {
    let dots = "";
    this._dotsTimer = setInterval(() => {
      dots = dots.length >= 3 ? "" : dots + ".";
      this.setData({ loadingDots: dots });
    }, TIMERS.LOADING_DOTS);
  },

  _clearDotsTimer() {
    if (this._dotsTimer) {
      clearInterval(this._dotsTimer);
      this._dotsTimer = null;
    }
    this.setData({ loadingDots: "" });
  },
});
