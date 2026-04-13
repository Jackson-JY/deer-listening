// components/shareModal/shareModal.js
const { INVITE_LINK, SHARE_TITLE, SHARE_PATH, TIMERS } = require("../../config/constants.js");

Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    userData: {
      type: Object,
      value: {
        name: '用户',
        avatar: '',
        streak: 0
      }
    }
  },

  data: {
    copied: false
  },

  methods: {
    // 关闭弹窗
    closeModal() {
      this.setData({ copied: false });
      this.triggerEvent('close');
    },

    // 复制链接
    copyLink() {
      wx.setClipboardData({
        data: INVITE_LINK,
        success: () => {
          this.setData({ copied: true });
          this.triggerEvent('copied');
          setTimeout(() => {
            this.closeModal();
          }, TIMERS.COPY_SUCCESS_DELAY);
        }
      });
    },

    // 分享给好友
    onShareAppMessage() {
      return {
        title: SHARE_TITLE,
        path: SHARE_PATH,
        imageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&q=80",
      };
    }
  }
});
