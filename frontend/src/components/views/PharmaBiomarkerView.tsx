"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchCohortCorrelations, labelVar } from "@/lib/cohort-api";
import type { CohortCorrelations } from "@/lib/cohort-types";

export function PharmaBiomarkerView() {
  const [corr, setCorr] = useState<CohortCorrelations | null>(null);

  useEffect(() => {
    fetchCohortCorrelations().then(setCorr).catch(() => setCorr(null));
  }, []);

  const outcomes = corr?.correlations.outcome_correlations ?? [];

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-6 py-8">
      <div className="mx-auto w-full max-w-4xl">
        <Link href="/" className="text-xs text-emerald-600 hover:underline">
          ← 药企工作台
        </Link>
        <h1 className="mt-4 text-xl font-bold text-slate-900">生物标志物发现</h1>
        <p className="mt-1 text-sm text-slate-500">
          基于队列 Spearman 相关与 model_hints，排序候选标志物（CA125、HRD、PCI 等）
        </p>

        {!corr ? (
          <p className="mt-8 text-sm text-slate-400">加载相关性分析…（需后端 cohort API）</p>
        ) : (
          <div className="mt-8 space-y-8">
            {outcomes.map((o) => (
              <section key={o.outcome} className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-sm font-semibold text-slate-800">结局：{labelVar(o.outcome)}</h2>
                <ul className="mt-4 space-y-2">
                  {o.top.map((t, i) => (
                    <li
                      key={t.variable}
                      className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2.5 text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-800">
                          {i + 1}
                        </span>
                        {labelVar(t.variable)}
                      </span>
                      <span className="font-mono text-xs text-slate-600">
                        ρ={t.rho.toFixed(3)} · n={t.n}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            {corr.model_hints.length > 0 && (
              <section className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-6">
                <h2 className="text-sm font-semibold text-emerald-900">建模建议</h2>
                <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-emerald-950">
                  {corr.model_hints.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <Link href="/genomics" className="text-xs font-medium text-emerald-700 underline">
            进入基因组组学验证 →
          </Link>
          <Link href="/omics" className="text-xs font-medium text-emerald-700 underline">
            多组学联合分析 →
          </Link>
        </div>
      </div>
    </div>
  );
}
