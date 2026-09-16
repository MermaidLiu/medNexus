"use client";

import Link from "next/link";

const TARGET_CANDIDATES = [
  {
    id: "parp",
    target: "PARP 通路",
    biomarker: "BRCA1/2 · HRD+",
    evidence: "SOLO-1 / PAOLA-1 · 维持治疗",
    action: "genomics",
  },
  {
    id: "vegf",
    target: "VEGF / 血管生成",
    biomarker: "PCI 高负荷 · 贝伐敏感型",
    evidence: "ICON-7 · GOG-218",
    action: "imaging",
  },
  {
    id: "immuno",
    target: "PD-1 / PD-L1",
    biomarker: "TPS / CPS · MMR",
    evidence: "KEYNOTE-826（宫颈癌扩展参考）",
    action: "genomics",
  },
  {
    id: "folr1",
    target: "FOLR1 ADC",
    biomarker: "FOLR1 高表达",
    evidence: "Mirvetuximab 卵巢癌",
    action: "genomics",
  },
];

export function PharmaTargetView() {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-6 py-8">
      <div className="mx-auto w-full max-w-4xl">
        <Link href="/" className="text-xs text-emerald-600 hover:underline">
          ← 药企工作台
        </Link>
        <h1 className="mt-4 text-xl font-bold text-slate-900">靶点与通路发现</h1>
        <p className="mt-1 text-sm text-slate-500">
          结合队列分层、标志物排序与文献证据，生成可验证靶点假设（可联动基因组 / 影像模块）
        </p>

        <div className="mt-8 space-y-4">
          {TARGET_CANDIDATES.map((t) => (
            <article
              key={t.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-base font-semibold text-slate-900">{t.target}</h2>
              <p className="mt-2 text-sm text-slate-600">
                <span className="text-slate-400">关联标志物：</span>
                {t.biomarker}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                <span className="text-slate-400">文献 / 试验：</span>
                {t.evidence}
              </p>
              <Link
                href={t.action === "genomics" ? "/genomics" : "/imaging"}
                className="mt-4 inline-block text-xs font-medium text-emerald-700 hover:underline"
              >
                在{t.action === "genomics" ? "基因组" : "影像"}模块验证 →
              </Link>
            </article>
          ))}
        </div>

        <p className="mt-8 text-xs text-slate-400">
          完整靶点发现 pipeline 可对接外部 Knowledge Graph 与组学差异分析结果。
        </p>
      </div>
    </div>
  );
}
