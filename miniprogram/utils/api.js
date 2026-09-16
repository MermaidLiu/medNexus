const { API_BASE } = require("../config");

const VISIT_KEY = "mednexus_visit_id";

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE}${path}`,
      method: options.method || "GET",
      data: options.data,
      header: {
        "content-type": options.contentType || "application/json",
        ...(options.header || {}),
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(res.data);
        else reject(new Error((res.data && res.data.detail) || `HTTP ${res.statusCode}`));
      },
      fail: reject,
    });
  });
}

function getVisitId() {
  return wx.getStorageSync(VISIT_KEY) || "";
}

function setVisitId(id) {
  wx.setStorageSync(VISIT_KEY, id);
}

function createVisit() {
  return request("/api/v1/diagnosis/visits", { method: "POST" });
}

function fetchVisit(id) {
  return request(`/api/v1/diagnosis/visits/${id}`);
}

function patchVisit(id, patch) {
  return request(`/api/v1/diagnosis/visits/${id}`, {
    method: "PATCH",
    data: patch,
  });
}

function syncVisit(visit) {
  return request(`/api/v1/diagnosis/visits/${visit.id}`, {
    method: "PUT",
    data: visit,
  });
}

function aiDiagnose(id) {
  return request(`/api/v1/diagnosis/visits/${id}/ai-diagnose`, { method: "POST" });
}

module.exports = {
  VISIT_KEY,
  getVisitId,
  setVisitId,
  createVisit,
  fetchVisit,
  patchVisit,
  syncVisit,
  aiDiagnose,
};
