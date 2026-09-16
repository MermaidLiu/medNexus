"use client";

import { useState } from "react";

const NACT_POINTS = [
  { title: "NACT 适用场景", body: "巨块型 III-IV 期、手术难度高、一般情况欠佳，目标为降期后间歇减瘤" },
  { title: "常用方案", body: "卡铂 + 紫杉醇 ± 贝伐珠单抗（3-4 周期后评估）" },
  { title: "疗效评估", body: "RECIST / 影像学 + CA125 + 手术可行性（MDT）" },
  { title: "PCI 参考", body: "腹膜癌指数与可切除性相关，影像 + 腹腔镜评估" },
];

const FIGO_STAGES = [
  { stage: "I", desc: "肿瘤局限卵巢 / 输卵管" },
  { stage: "II", desc: "盆腔扩散" },
  { stage: "III", desc: "腹腔转移 / 淋巴结" },
  { stage: "IV", desc: "远处转移（肝实质、胸水等）" },
];

export function NactPanel() {
  const [tab, setTab] = useState<"nact" | "figo">("nact");

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-[#f4f6f9]">
      <header className="border-b border-slate-200 bg-white px-8 py-6">
        <h1 className="text-xl font-semibold text-slate-900">NACT 与分期</h1>
        <p className="mt-1 text-sm text-slate-500">新辅助化疗决策 · FIGO 分期参考</p>
        <div className="mt-4 flex gap-2">
          {(["nact", "figo"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-2 text-xs font-medium ${
                tab === t ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-600"
              }`}
            >
              {t === "nact" ? "NACT 决策" : "FIGO 分期"}
            </button>
          ))}
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-3xl space-y-4">
          {tab === "nact"
            ? NACT_POINTS.map((p) => (
                <div key={p.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-slate-900">{p.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.body}</p>
                </div>
              ))
            : FIGO_STAGES.map((s) => (
                <div key={s.stage} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-sm font-bold text-violet-800">
                    {s.stage}
                  </span>
                  <p className="text-sm text-slate-700">{s.desc}</p>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}
