"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useResearch } from "@/context/ResearchContext";
import { useEditionTheme } from "@/hooks/useEditionTheme";
import { fetchCohortCorrelations, labelVar } from "@/lib/cohort-api";
import type { CohortCorrelations } from "@/lib/cohort-types";

const ML_METHODS = [
  { id: "rf", name: "随机森林", desc: "适合混合临床特征，可输出变量重要性" },
  { id: "xgb", name: "XGBoost", desc: "非线性边界，对 NACT 反应等分类结局友好" },
  { id: "dl", name: "深度学习 (MLP)", desc: "多组学特征拼接后的神经网络基线" },
  { id: "cox", name: "Cox 生存", desc: "PFS / OS 时间事件结局" },
];

export function OmicsHubView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useEditionTheme();
  const { cohort, selectedIds, setSelectedIds, getPatient } = useResearch();
  const [corr, setCorr] = useState<CohortCorrelations | null>(null);
  const [activeMl, setActiveMl] = useState("rf");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    const ids = searchParams.get("ids");
    if (ids) setSelectedIds(ids.split(",").filter(Boolean));
  }, [searchParams, setSelectedIds]);

  useEffect(() => {
    fetchCohortCorrelations().then(setCorr).catch(() => setCorr(null));
  }, []);

  const patients = selectedIds.map((id) => getPatient(id)).filter(Boolean);

  const runMl = async () => {
    setRunning(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 800));
    const hints = corr?.model_hints ?? [];
    const top = corr?.correlations.outcome_correlations?.[0]?.top?.[0];
    setResult(
      `已在 ${selectedIds.length} 例子队列上配置「${ML_METHODS.find((m) => m.id === activeMl)?.name}」。` +
        (top
          ? ` 队列提示：${labelVar(top.variable)} 与结局相关性最高 (ρ=${top.rho.toFixed(2)})。`
          : "") +
        (hints.length ? ` 建议：${hints.slice(0, 2).join("；")}` : "")
    );
    setRunning(false);
  };

  if (selectedIds.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-sm text-slate-600">请先在首页勾选至少 1 例患者，再进入多组学分析。</p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className={`rounded-lg px-4 py-2 text-xs font-medium text-white ${theme.btnSolidClass}`}
        >
          返回工作台选病例
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto scrollbar-thin px-6 py-8">
      <div className="mx-auto w-full max-w-5xl">
        <Link href="/" className={`text-xs hover:underline ${theme.linkClass}`}>
          ← 返回病例列表
        </Link>
        <h1 className="mt-4 text-xl font-bold text-slate-900">多组学分析中心</h1>
        <p className="mt-1 text-sm text-slate-500">
          已选 <strong className="text-slate-700">{selectedIds.length}</strong> 例 · 队列总量{" "}
          {cohort?.patient_count ?? 0} 例
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {patients.slice(0, 8).map((p) => (
            <span
              key={p!.id}
              className={`rounded-full px-3 py-1 text-[11px] ring-1 ${theme.chipClass} ${theme.chipRingClass}`}
            >
              {p!.patient_id || p!.name || p!.id.slice(0, 6)}
            </span>
          ))}
          {selectedIds.length > 8 && (
            <span className="text-[11px] text-slate-400">+{selectedIds.length - 8} …</span>
          )}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800">机器学习建模</h2>
            <p className="mt-1 text-xs text-slate-500">基于临床 + 分子特征，预测 NACT 反应 / PFS 等结局</p>
            <div className="mt-4 space-y-2">
              {ML_METHODS.map((m) => (
                <label
                  key={m.id}
                  className={`flex cursor-pointer gap-3 rounded-xl border px-4 py-3 transition ${
                    activeMl === m.id ? theme.optionSelectedClass : "border-slate-100 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="ml"
                    checked={activeMl === m.id}
                    onChange={() => setActiveMl(m.id)}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{m.name}</p>
                    <p className="text-[11px] text-slate-500">{m.desc}</p>
                  </div>
                </label>
              ))}
            </div>
            <button
              type="button"
              disabled={running}
              onClick={runMl}
              className="mt-4 w-full rounded-xl bg-slate-900 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {running ? "训练中…" : "运行建模（演示）"}
            </button>
            {result && (
              <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
                {result}
              </p>
            )}
          </section>

          <section className="space-y-4">
            <OmicsModule href="/imaging" title="影像组学 · CT + PCI" desc="DICOM 上传、分割、PCI 评分与 mask 导出，可关联子队列 PCI 字段。" theme={theme} />
            <OmicsModule href="/genomics" title="基因组组学" desc="WES / Panel / ctDNA / HRD 多源解读，支持 BRCA / HRD 分层验证。" theme={theme} />
            <OmicsModule href="/compute" title="统计 · 可视化" desc="队列描述统计、相关矩阵、KM 曲线与 Table 1 导出。" theme={theme} />
            <OmicsModule href="/clinical/nact-ovarian" title="NACT 多模态预测" desc="单例级别 NACT 反应概率与 MDT 建议，可与子队列分层交叉验证。" theme={theme} />
          </section>
        </div>
      </div>
    </div>
  );
}

function OmicsModule({
  href,
  title,
  desc,
  theme,
}: {
  href: string;
  title: string;
  desc: string;
  theme: ReturnType<typeof useEditionTheme>;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition ${theme.cardHoverBorderClass}`}
    >
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">{desc}</p>
      <span className={`mt-2 inline-block text-[11px] font-medium ${theme.linkClass}`}>进入模块 →</span>
    </Link>
  );
}
