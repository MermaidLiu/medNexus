"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useResearch } from "@/context/ResearchContext";
import { fetchCohortCorrelations, labelVar } from "@/lib/cohort-api";
import type { CohortCorrelations } from "@/lib/cohort-types";

export function PharmaHomeView() {
  const router = useRouter();
  const { cohort, loading, selectedIds, clearSelection } = useResearch();
  const [corr, setCorr] = useState<CohortCorrelations | null>(null);
  const count = cohort?.patient_count ?? cohort?.patients?.length ?? 0;

  useEffect(() => {
    fetchCohortCorrelations()
      .then(setCorr)
      .catch(() => setCorr(null));
  }, [cohort]);

  const topVars =
    corr?.correlations.outcome_correlations?.[0]?.top?.slice(0, 5) ?? [];

  return (
    <div className="flex flex-1 flex-col overflow-y-auto scrollbar-thin">
      <div className="border-b border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-8 py-10">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">药企研发工作台</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          基于脱敏妇科肿瘤队列，开展<strong className="font-medium text-slate-800">患者富集与分层</strong>、
          生物标志物与靶点发现，并联动多组学影像 / 基因组模块验证假设。
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <MiniStat label="队列规模" value={loading ? "…" : `${count} 例`} />
          <MiniStat label="已选子集" value={`${selectedIds.length} 例`} />
          <MiniStat label="分析引擎" value={corr ? "Spearman" : "待加载"} />
          <MiniStat label="ML 提示" value={String(corr?.model_hints?.length ?? 0)} />
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <h2 className="mb-4 text-sm font-semibold text-slate-800">研发管线</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <PipelineCard
            href="/stratification"
            title="患者富集 · 分层"
            desc="按 FIGO、HRD、BRCA、NACT 反应等维度划分子队列，评估富集度与样本量。"
            tag="Enrichment"
          />
          <PipelineCard
            href="/biomarkers"
            title="生物标志物发现"
            desc="CA125 动力学、HRD、PCI 等与 PFS/OS 的相关性排序与候选标志物列表。"
            tag="Biomarker"
          />
          <PipelineCard
            href="/targets"
            title="靶点与通路"
            desc="结合基因组多源解读与文献证据，生成可验证靶点假设清单。"
            tag="Target"
          />
          <PipelineCard
            href="/omics"
            title="多组学联合分析"
            desc="临床 + 影像 PCI + 分子标记整合，支持子队列对比与 ML 建模。"
            tag="Multi-omics"
          />
          <PipelineCard
            href="/genomics"
            title="基因组组学"
            desc="WES / Panel / ctDNA / HRD 多源数据 AI 解读。"
            tag="Genomics"
          />
          <PipelineCard
            href="/clinical/nact-ovarian"
            title="NACT 多模态预测"
            desc="验证减瘤效果与 NACT 反应预测模型，用于分层入组设计。"
            tag="NACT"
          />
        </div>

        {topVars.length > 0 && (
          <div className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6">
            <h3 className="text-sm font-semibold text-emerald-900">与结局 Top 关联变量（队列级）</h3>
            <ul className="mt-3 space-y-2">
              {topVars.map((v) => (
                <li key={v.variable} className="flex items-center justify-between text-sm text-emerald-950">
                  <span>{labelVar(v.variable)}</span>
                  <span className="font-mono text-xs">
                    ρ={v.rho.toFixed(2)} · n={v.n}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs text-slate-600 hover:bg-white"
          >
            浏览全部病例
          </button>
          <button
            type="button"
            onClick={() => router.push(`/omics?ids=${selectedIds.join(",")}`)}
            disabled={selectedIds.length === 0}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white disabled:opacity-40"
          >
            对已选 {selectedIds.length} 例做多组学
          </button>
          {selectedIds.length > 0 && (
            <button type="button" onClick={clearSelection} className="text-xs text-slate-400 underline">
              清空选择
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-emerald-100">
      <p className="text-[10px] text-slate-400">{label}</p>
      <p className="mt-0.5 text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

function PipelineCard({
  href,
  title,
  desc,
  tag,
}: {
  href: string;
  title: string;
  desc: string;
  tag: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
    >
      <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
        {tag}
      </span>
      <p className="mt-3 text-sm font-semibold text-slate-800 group-hover:text-emerald-800">{title}</p>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">{desc}</p>
    </Link>
  );
}
