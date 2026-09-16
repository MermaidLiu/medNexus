const api = require("../../utils/api");

const STEPS = [
  { id: "registration", label: "挂号" },
  { id: "preconsult", label: "预问诊" },
  { id: "labs", label: "生化" },
  { id: "imaging", label: "影像" },
  { id: "guidelines", label: "指南" },
  { id: "ai_diagnosis", label: "AI诊断" },
];

Page({
  data: {
    steps: STEPS,
    stepIndex: 0,
    visit: null,
    saving: false,
    aiBusy: false,
    bloodFields: ["CA125", "HE4", "WBC", "Hb", "CRP"],
    guidelines: [
      "NCCN 卵巢癌诊疗指南",
      "ESMO 妇科肿瘤临床实践",
      "FIGO 分期与手术规范",
    ],
  },

  onLoad(query) {
    this.visitId = query.id || api.getVisitId();
    this.loadVisit();
  },

  async loadVisit() {
    try {
      const visit = await api.fetchVisit(this.visitId);
      api.setVisitId(visit.id);
      const stepIndex = STEPS.findIndex((s) => s.id === (visit.currentStep || "registration"));
      this.setData({ visit, stepIndex: stepIndex >= 0 ? stepIndex : 0 });
    } catch (e) {
      wx.showToast({ title: "加载失败", icon: "none" });
    }
  },

  setReg(e) {
    const key = e.currentTarget.dataset.key;
    const visit = { ...this.data.visit };
    visit.registration[key] = e.detail.value;
    this.setData({ visit });
  },

  setPre(e) {
    const key = e.currentTarget.dataset.key;
    const visit = { ...this.data.visit };
    visit.preconsult[key] = e.detail.value;
    this.setData({ visit });
  },

  setLab(e) {
    const key = e.currentTarget.dataset.key;
    const section = e.currentTarget.dataset.section || "blood";
    const visit = { ...this.data.visit };
    visit.labs = visit.labs || { blood: {}, urine: {} };
    visit.labs[section] = { ...(visit.labs[section] || {}), [key]: e.detail.value };
    this.setData({ visit });
  },

  toggleGuide(e) {
    const item = e.currentTarget.dataset.item;
    const visit = { ...this.data.visit };
    const sel = new Set(visit.guidelines?.selected || []);
    if (sel.has(item)) sel.delete(item);
    else sel.add(item);
    visit.guidelines = { ...visit.guidelines, selected: [...sel] };
    this.setData({ visit });
  },

  async saveStep(nextIndex) {
    const visit = this.data.visit;
    visit.currentStep = STEPS[nextIndex].id;
    this.setData({ saving: true });
    try {
      const updated = await api.patchVisit(visit.id, visit);
      this.setData({ visit: updated, stepIndex: nextIndex, saving: false });
    } catch (e) {
      this.setData({ saving: false });
      wx.showToast({ title: "保存失败", icon: "none" });
    }
  },

  prevStep() {
    if (this.data.stepIndex > 0) this.setData({ stepIndex: this.data.stepIndex - 1 });
  },

  nextStep() {
    const n = this.data.stepIndex + 1;
    if (n < STEPS.length) this.saveStep(n);
  },

  async runAi() {
    this.setData({ aiBusy: true });
    try {
      await api.patchVisit(this.data.visit.id, this.data.visit);
      const res = await api.aiDiagnose(this.data.visit.id);
      this.setData({ visit: res.visit, stepIndex: 5, aiBusy: false });
    } catch (e) {
      this.setData({ aiBusy: false });
      wx.showToast({ title: "AI 失败", icon: "none" });
    }
  },

  onImagingNote(e) {
    const visit = { ...this.data.visit };
    visit.imaging = {
      ...(visit.imaging || {}),
      uploaded: true,
      summary: e.detail.value,
      fileName: "小程序端待上传ZIP",
    };
    this.setData({ visit });
  },
});
