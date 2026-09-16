"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useResearch } from "@/context/ResearchContext";
import { fetchCohortCorrelations, labelVar } from "@/lib/cohort-api";

export function PharmaStratificationView() {
  const { cohort, selectedIds } = useResearch();
  const [dim, setDim] = useState<"figo" | "hrd" | "brca" | "nact_response">("hrd");
  const [corr, setCorr] = useState<Awaited<ReturnType<typeof fetchCohortCorrelations>> | null>(null);

  useEffect(() => {
    fetchCohortCorrelations().then(setCorr).catch(() => setCorr(null));
  }, []);

  const patients = useMemo(() => {
    const all = cohort?.patients ?? [];
    if (selectedIds.length === 0) return all;
    return all.filter((p) => selectedIds.includes(p.id));
  }, [cohort, selectedIds]);

  const strata = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of patients) {
      const key = String(p[dim] ?? "未知").trim() || "未知";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [patients, dim]);

  const total = patients.length;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-6 py-8">
      <div className="mx-auto w-full max-w-4xl">
        <Link href="/" className="text-xs text-emerald-600 hover:underline">
          ← 药企工作台
        </Link>
        <h1 className="mt-4 text-xl font-bold text-slate-900">患者富集 · 分层</h1>
        <p className="mt-1 text-sm text-slate-500">
          分析子队列 {selectedIds.length > 0 ? `(已选 ${selectedIds.length} 例)` : `(全队列 ${total} 例)`}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {(
            [
              ["figo", "FIGO 分期"],
              ["hrd", "HRD 状态"],
              ["brca", "BRCA"],
              ["nact_response", "NACT 反应"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setDim(k)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                dim === k
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {strata.map(([label, n]) => {
            const pct = total ? Math.round((n / total) * 100) : 0;
            return (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-800">{label}</span>
                  <span className="text-slate-500">
                    {n} 例 · {pct}%
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {corr?.correlations.outcome_correlations?.[0]?.top?.[0] && (
          <p className="mt-8 text-xs text-slate-500">
            提示：{labelVar(corr.correlations.outcome_correlations[0].top[0].variable)} 与结局关联最强，可作为分层协变量。
          </p>
        )}
      </div>
    </div>
  );
}
