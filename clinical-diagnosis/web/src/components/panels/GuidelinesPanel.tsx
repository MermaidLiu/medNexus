"use client";

import { GUIDELINE_OPTIONS } from "@/lib/diagnosis-types";

const GUIDELINE_DETAILS = [
  {
    name: "NCCN 卵巢癌诊疗指南",
    points: ["一线：手术 ± 化疗 ± 贝伐 / PARP 维持", "BRCA / HRD 检测指导 PARP 选择", "复发：铂敏感 vs 耐药分层"],
  },
  {
    name: "ESMO 妇科肿瘤临床实践",
    points: ["强调 MDT 决策", "NACT 适用于 bulk 不可切除病灶", "分子分型影响后续治疗"],
  },
  {
    name: "FIGO 分期与手术规范",
    points: ["全面分期手术", "细胞减灭术目标：R0", "2021 分期更新要点"],
  },
];

export function GuidelinesPanel() {
  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-[#f4f6f9]">
      <header className="border-b border-slate-200 bg-white px-8 py-6">
        <h1 className="text-xl font-semibold text-slate-900">指南与证据</h1>
        <p className="mt-1 text-sm text-slate-500">NCCN / ESMO / FIGO 卵巢癌诊疗要点速查</p>
      </header>
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {GUIDELINE_DETAILS.map((g) => (
            <div key={g.name} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-rose-800">{g.name}</h2>
              <ul className="mt-3 space-y-2">
                {g.points.map((p) => (
                  <li key={p} className="flex gap-2 text-sm text-slate-700">
                    <span className="text-rose-400">·</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-6">
            <h2 className="text-sm font-semibold text-violet-900">诊断流程可选指南</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {GUIDELINE_OPTIONS.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-white px-3 py-1 text-[11px] text-violet-800 ring-1 ring-violet-200"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
