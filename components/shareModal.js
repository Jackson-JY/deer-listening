// components/shareModal.js
const { user } = require("../utils/mockData.js");

Component({
  properties: {
    showShareModal: {
      type: Boolean,
      value: false,
    },
  },

  data: {
    user: user,
    copied: false,
  },

  methods: {
    closeShareModal() {
      this.setData({ showShareModal: false, copied: false });
      this.triggerEvent("close");
    },

    handleCopy() {
      wx.setClipboardData({
        data: "https://ieltscamp.example.com/invite/xxx",
        success: () => {
          this.setData({ copied: true });
          setTimeout(() => {
            this.setData({ copied: false, showShareModal: false });
          }, 2000);
        },
      });
    },

    shareToFriend() {
      // 微信分享能力
      wx.showShareMenu({
        withShareTicket: true,
      });
    },
  },
});
