// components/payModal.js
Component({
  properties: {
    showPayModal: {
      type: Boolean,
      value: false,
    },
    selectedCourse: {
      type: Object,
      value: null,
    },
  },

  data: {
    selectedPlan: "full",
    payState: "confirm", // confirm, paying, success
  },

  methods: {
    closePayModal() {
      this.setData({ showPayModal: false, payState: "confirm", selectedPlan: "full" });
      this.triggerEvent("close");
    },

    selectPlan(e) {
      const plan = e.currentTarget.dataset.plan;
      this.setData({ selectedPlan: plan });
    },

    handlePay() {
      this.setData({ payState: "paying" });
      
      setTimeout(() => {
        this.setData({ payState: "success" });
        setTimeout(() => {
          this.triggerEvent("success");
          this.closePayModal();
        }, 1800);
      }, 2000);
    },
  },
});
