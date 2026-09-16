const api = require("../../utils/api");

Page({
  data: {
    loading: false,
    visitId: "",
  },

  onShow() {
    this.setData({ visitId: api.getVisitId() });
  },

  async startVisit() {
    this.setData({ loading: true });
    try {
      const visit = await api.createVisit();
      api.setVisitId(visit.id);
      wx.navigateTo({ url: `/pages/visit/visit?id=${visit.id}` });
    } catch (e) {
      wx.showToast({ title: e.message || "连接失败", icon: "none" });
    } finally {
      this.setData({ loading: false });
    }
  },

  continueVisit() {
    const id = api.getVisitId();
    if (!id) return;
    wx.navigateTo({ url: `/pages/visit/visit?id=${id}` });
  },

  openMobileWeb() {
    wx.showModal({
      title: "手机网页版",
      content: "可在浏览器打开 /m/diagnosis，与小程序共用同一后端 API",
      showCancel: false,
    });
  },
});
