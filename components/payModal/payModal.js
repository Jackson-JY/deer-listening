// components/payModal/payModal.js
const { TIMERS } = require("../../config/constants.js");

Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    course: {
      type: Object,
      value: null
    }
  },

  data: {
    payState: "confirm", // confirm, paying, success
    selectedPlan: "full"
  },

  methods: {
    // 关闭弹窗
    closeModal() {
      this.setData({ payState: "confirm", selectedPlan: "full" });
      this.triggerEvent('close');
    },

    // 选择套餐
    selectPlan(e) {
      const plan = e.currentTarget.dataset.plan;
      this.setData({ selectedPlan: plan });
    },

    // 处理支付
    handlePay() {
      this.setData({ payState: "paying" });
      
      setTimeout(() => {
        this.setData({ payState: "success" });
        
        setTimeout(() => {
          this.triggerEvent('success', { 
            plan: this.data.selectedPlan,
            course: this.properties.course 
          });
          this.setData({ payState: "confirm", selectedPlan: "full" });
        }, TIMERS.PAY_SUCCESS_DELAY);
      }, TIMERS.PAY_PROCESS_DELAY);
    },

    // 重置状态（供父组件调用）
    reset() {
      this.setData({ payState: "confirm", selectedPlan: "full" });
    }
  }
});
