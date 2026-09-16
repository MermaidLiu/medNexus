"use client";

const RESEARCH_MODULES = [
  {
    title: "队列数据入库",
    desc: "Excel 批量导入临床队列，用于 NACT 预测与生存分析",
    status: "可对接 MedNexus 91 例队列",
  },
  {
    title: "基因组多源数据",
    desc: "TCGA-OV、GEO、Panel 检测结果整合与 AI 解读",
    status: "规划中",
  },
  {
    title: "影像组学 / PCI",
    desc: "CT DICOM 上传、PCI 评分、可切除性辅助判断",
    status: "可扩展",
  },
  {
    title: "生存分析与 KM",
    desc: "PFS / OS 曲线、Cox 回归、Table 1 自动生成",
    status: "科研模块",
  },
];

export function ResearchPanel() {
  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-[#f4f6f9]">
      <header className="border-b border-slate-200 bg-white px-8 py-6">
        <h1 className="text-xl font-semibold text-slate-900">科研队列</h1>
        <p className="mt-1 text-sm text-slate-500">临床数据 → 科研产出 — 卵巢癌垂直工具链</p>
      </header>
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-3xl grid gap-4 sm:grid-cols-2">
          {RESEARCH_MODULES.map((m) => (
            <div key={m.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">{m.title}</h2>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">{m.desc}</p>
              <span className="mt-3 inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] text-emerald-700">
                {m.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
