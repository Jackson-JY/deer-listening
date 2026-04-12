// components/shareModal/shareModal.js
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
        data: "https://ieltscamp.example.com/invite/xxx",
        success: () => {
          this.setData({ copied: true });
          this.triggerEvent('copied');
          setTimeout(() => {
            this.closeModal();
          }, 2000);
        }
      });
    },

    // 分享给好友
    onShareAppMessage() {
      return {
        title: "雅思听力21天突破计划",
        path: "/pages/home/home",
        imageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&q=80",
      };
    }
  }
});
