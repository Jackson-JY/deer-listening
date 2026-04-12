// components/loginTip/loginTip.js
const auth = require("../../utils/auth.js");

Component({
  properties: {
    show: {
      type: Boolean,
      value: false,
    },
  },

  data: {
    loading: false,
    avatarUrl: "",
    nickname: "",
    phoneNumber: "",
    hasAvatar: false,
    hasNickname: false,
    hasPhone: false,
    canLogin: false,
  },

  methods: {
    // 获取用户头像昵称
    onGetUserInfo(e) {
      if (e.detail.userInfo) {
        const { avatarUrl, nickName } = e.detail.userInfo;
        this.setData({
          avatarUrl,
          nickname: nickName,
          hasAvatar: true,
          hasNickname: !!nickName,
          canLogin: true,
        });
      }
    },

    // 昵称输入
    onNicknameInput(e) {
      const nickname = e.detail.value;
      this.setData({
        nickname,
        hasNickname: nickname.length > 0,
        canLogin: this.data.hasAvatar && nickname.length > 0,
      });
    },

    // 获取手机号
    onGetPhoneNumber(e) {
      if (e.detail.errMsg === "getPhoneNumber:ok") {
        // 手机号需要通过云函数解密获取
        // 这里先存储 code，实际解密在云端完成
        const { code } = e.detail;
        this.triggerEvent("getPhoneCode", { code });

        // 模拟获取手机号成功（实际需要云函数解密）
        this.setData({
          hasPhone: true,
        });
      } else {
        console.log("用户拒绝授权手机号");
      }
    },

    // 执行登录
    onLogin() {
      if (this.data.loading || !this.data.canLogin) return;

      this.setData({ loading: true });

      const userInfo = {
        avatarUrl: this.data.avatarUrl,
        nickName: this.data.nickname,
        phoneNumber: this.data.phoneNumber,
      };

      auth.wxLogin(userInfo)
        .then(res => {
          this.setData({ loading: false });
          wx.showToast({
            title: "登录成功",
            icon: "success",
          });
          this.triggerEvent("loginSuccess", res);
        })
        .catch(err => {
          this.setData({ loading: false });
          wx.showToast({
            title: "登录失败",
            icon: "none",
          });
          console.error("登录失败", err);
        });
    },

    // 跳过（仅获取头像昵称）
    onSkip() {
      this.setData({ loading: true });

      const userInfo = {
        avatarUrl: this.data.avatarUrl,
        nickName: this.data.nickname,
      };

      auth.wxLogin(userInfo)
        .then(res => {
          this.setData({ loading: false });
          this.triggerEvent("loginSuccess", res);
        })
        .catch(err => {
          this.setData({ loading: false });
          console.error("登录失败", err);
        });
    },
  },
});
