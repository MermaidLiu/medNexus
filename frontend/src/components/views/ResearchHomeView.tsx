"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CohortImportModal } from "@/components/cohort/CohortImportModal";
import { useResearch } from "@/context/ResearchContext";
import { importCohortExcel } from "@/lib/cohort-api";
import { TABLE_COLUMNS, fieldLabel } from "@/lib/cohort-types";

export function ResearchHomeView() {
  const router = useRouter();
  const {
    cohort,
    loading,
    error,
    refreshCohort,
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
  } = useResearch();
  const [showImport, setShowImport] = useState(false);

  const patients = cohort?.patients ?? [];
  const count = cohort?.patient_count ?? patients.length;

  const handleImport = async (file: File, mode: "replace" | "append") => {
    await importCohortExcel(file, mode);
    await refreshCohort();
    setShowImport(false);
  };

  const allIds = patients.map((p) => p.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));

  return (
    <div className="flex flex-1 flex-col overflow-y-auto scrollbar-thin">
      <div className="border-b border-slate-200 bg-gradient-to-br from-violet-50 via-white to-indigo-50 px-8 py-10">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">科研工作台</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          欢迎进入 MedNexus 妇科肿瘤科研平台。此处汇总已关联的<strong className="font-medium text-slate-800">脱敏患者病例</strong>
          ，可逐例查看结构化病历，或勾选多例后进入多组学分析（机器学习、影像组学、基因组组学）。
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="关联病例" value={loading ? "…" : String(count)} sub="例" accent="violet" />
          <StatCard label="已勾选" value={String(selectedIds.length)} sub="例待分析" accent="indigo" />
          <StatCard
            label="数据状态"
            value={error ? "离线" : "已同步"}
            sub={cohort?.sourceFile ?? "队列库"}
            accent="rose"
          />
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">病例列表</h2>
            {error && <p className="mt-1 text-xs text-amber-700">{error}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowImport(true)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              导入 Excel
            </button>
            <button
              type="button"
              onClick={() => (allSelected ? clearSelection() : selectAll(allIds))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
            >
              {allSelected ? "取消全选" : "全选"}
            </button>
            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={() => router.push(`/omics?ids=${selectedIds.join(",")}`)}
              className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-xs font-medium text-white disabled:opacity-40"
            >
              进入多组学分析 ({selectedIds.length})
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-slate-500">
                <tr>
                  <th className="w-10 px-3 py-3" />
                  {TABLE_COLUMNS.map((col) => (
                    <th key={col} className="px-3 py-3 font-medium">
                      {fieldLabel(col)}
                    </th>
                  ))}
                  <th className="px-3 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={TABLE_COLUMNS.length + 2} className="px-4 py-12 text-center text-slate-400">
                      加载病例…
                    </td>
                  </tr>
                ) : patients.length === 0 ? (
                  <tr>
                    <td colSpan={TABLE_COLUMNS.length + 2} className="px-4 py-12 text-center">
                      <p className="text-sm text-slate-500">暂无关联病例</p>
                      <button
                        type="button"
                        onClick={() => setShowImport(true)}
                        className="mt-3 text-xs text-violet-600 underline"
                      >
                        导入 91 例 Excel 模板
                      </button>
                    </td>
                  </tr>
                ) : (
                  patients.map((p) => (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-violet-50/30">
                      <td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(p.id)}
                          onChange={() => toggleSelect(p.id)}
                          className="rounded border-slate-300"
                        />
                      </td>
                      {TABLE_COLUMNS.map((col) => (
                        <td key={col} className="px-3 py-2.5 text-slate-700">
                          {String(p[col] ?? "—")}
                        </td>
                      ))}
                      <td className="px-3 py-2.5">
                        <Link href={`/cases/${p.id}`} className="font-medium text-violet-600 hover:underline">
                          查看病历
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <QuickLink
            href="/navigator"
            title="科学导航"
            desc="文献检索 · PICO · 证据速查"
          />
          <QuickLink href="/research" title="深度研究" desc="9 步科研流水线训练" />
          <QuickLink href="/read" title="读 · 文献" desc="文献理解与对比" />
        </div>
      </div>

      {showImport && (
        <CohortImportModal
          hasData={patients.length > 0}
          onClose={() => setShowImport(false)}
          onImport={handleImport}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: "violet" | "indigo" | "rose";
}) {
  const ring =
    accent === "violet" ? "ring-violet-100" : accent === "indigo" ? "ring-indigo-100" : "ring-rose-100";
  return (
    <div className={`rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ${ring}`}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-0.5 truncate text-[11px] text-slate-500">{sub}</p>
    </div>
  );
}

function QuickLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-violet-200 hover:shadow-md"
    >
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{desc}</p>
    </Link>
  );
}
