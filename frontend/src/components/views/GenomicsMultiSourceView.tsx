"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useEditionTheme } from "@/hooks/useEditionTheme";
import type { EditionTheme } from "@/lib/agent-editions";
import { DiseaseIcon } from "@/components/IconFont";
import { interpretGenomicsWithLlm } from "@/lib/genomics-api";
import {
  createEmptyGenomicsCase,
  DEMO_GENOMICS_CASE,
  type DataSourceId,
  type GenomicsCase,
  type GenomicsInterpretation,
  type GenomicsSourceMeta,
} from "@/lib/genomics-types";

const SOURCE_COLORS: Record<DataSourceId, string> = {
  germline: "bg-blue-100 text-blue-700",
  tumor_wes: "bg-violet-100 text-violet-700",
  panel: "bg-rose-100 text-rose-700",
  ctdna: "bg-amber-100 text-amber-700",
  rnaseq: "bg-cyan-100 text-cyan-700",
  hrd: "bg-fuchsia-100 text-fuchsia-700",
};

const SOURCE_SHORT: Record<DataSourceId, string> = {
  germline: "胚系",
  tumor_wes: "WES",
  panel: "Panel",
  ctdna: "ctDNA",
  rnaseq: "RNA",
  hrd: "HRD",
};

function TierBadge({ tier }: { tier?: string }) {
  const cls =
    tier === "I"
      ? "bg-rose-100 text-rose-700"
      : tier === "II"
        ? "bg-violet-100 text-violet-700"
        : tier === "VUS"
          ? "bg-slate-100 text-slate-600"
          : "bg-slate-100 text-slate-500";
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${cls}`}>{tier ?? "—"}</span>
  );
}

export function GenomicsMultiSourceView() {
  const theme = useEditionTheme();
  const [cases, setCases] = useState<GenomicsCase[]>([DEMO_GENOMICS_CASE()]);
  const [activeId, setActiveId] = useState(cases[0]?.id ?? "");
  const [interpretation, setInterpretation] = useState<GenomicsInterpretation | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeCase = cases.find((c) => c.id === activeId) ?? cases[0];

  const updateCase = useCallback(
    (patch: Partial<GenomicsCase>, keepInterpretation = false) => {
      setCases((prev) =>
        prev.map((c) =>
          c.id === activeId ? { ...c, ...patch, status: patch.status ?? ("draft" as const) } : c
        )
      );
      if (!keepInterpretation) setInterpretation(null);
    },
    [activeId]
  );

  const toggleSource = (sourceId: DataSourceId) => {
    if (!activeCase) return;
    const sources = activeCase.sources.map((s) =>
      s.id === sourceId ? { ...s, linked: !s.linked } : s
    );
    updateCase({ sources });
  };

  const linkedSources = useMemo(
    () => activeCase?.sources.filter((s) => s.linked) ?? [],
    [activeCase]
  );

  const handleInterpret = async () => {
    if (!activeCase) return;
    setAnalyzing(true);
    setError(null);
    setInterpretation(null);
    try {
      const result = await interpretGenomicsWithLlm(activeCase);
      setInterpretation(result);
      updateCase({ status: "done" }, true);
      if (result.warning) setError(result.warning);
    } catch (e) {
      setError(e instanceof Error ? e.message : "解读失败");
    } finally {
      setAnalyzing(false);
    }
  };

  const loadDemo = () => {
    const demo = DEMO_GENOMICS_CASE();
    setCases((prev) => {
      const rest = prev.filter((c) => c.patientId !== "OV-GEN-DEMO");
      return [demo, ...rest];
    });
    setActiveId(demo.id);
    setInterpretation(null);
    setError(null);
  };

  const handleExport = () => {
    if (!activeCase || !interpretation) return;
    const lines = [
      "# 基因组多源数据 MDT 摘要",
      "",
      `病例：${activeCase.patientId} · ${activeCase.diagnosis} ${activeCase.figoStage}`,
      "",
      "## 融合结论",
      `- HRD：${interpretation.hrdConsensus}`,
      `- BRCA/HRR：${interpretation.brcaStatus}`,
      `- PARP 适用：${interpretation.parpEligible ? "是" : "否"} — ${interpretation.parpRationale}`,
      "",
      "## AI 推理",
      interpretation.reasoning,
      "",
      "## MDT 建议",
      ...interpretation.recommendations.map((r) => `- ${r}`),
      "",
      "## 多源冲突/待复核",
      ...(interpretation.conflicts.length
        ? interpretation.conflicts.map((c) => `- ${c}`)
        : ["- 无显著冲突"]),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Genomics_${activeCase.patientId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!activeCase) return null;

  return (
    <div className="flex flex-1 min-h-0">
      <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-3 py-3">
          <p className="text-xs font-semibold text-slate-500">基因组病例</p>
          <button
            onClick={loadDemo}
            className={`mt-2 w-full rounded-lg py-2 text-xs font-medium text-white hover:opacity-90 ${theme.btnPrimaryClass}`}
          >
            加载演示病例
          </button>
          <button
            onClick={() => {
              const c = createEmptyGenomicsCase();
              setCases((prev) => [c, ...prev]);
              setActiveId(c.id);
              setInterpretation(null);
              setError(null);
            }}
            className={`mt-2 w-full rounded-lg border border-dashed py-2 text-xs ${theme.linkDashedClass}`}
          >
            + 新建病例
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto scrollbar-thin p-2">
          {cases.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => {
                  setActiveId(c.id);
                  setInterpretation(null);
                }}
                className={`mb-1 w-full rounded-lg px-3 py-2.5 text-left text-xs ${
                  c.id === activeId ? theme.selectedItemClass
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <p>{c.patientId}</p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {c.sources.filter((s) => s.linked).length} 源 ·{" "}
                  {c.status === "done" ? "已解读" : "草稿"}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-5 py-3">
          <DiseaseIcon name="ovarian" size={22} color={theme.iconColor} />
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-slate-900">基因组多源数据</h2>
            <p className="text-xs text-slate-500">
              胚系 · WES · Panel · ctDNA · RNA-seq · HRD 统一整合
            </p>
          </div>
          <button
            onClick={handleInterpret}
            disabled={analyzing || linkedSources.length === 0}
            className={`rounded-lg px-4 py-2 text-xs font-medium text-white disabled:opacity-50 ${theme.btnPrimaryClass}`}
          >
            {analyzing ? "AI 融合解读中…" : "运行 AI 融合解读"}
          </button>
        </div>

        {error && (
          <div className="border-b border-amber-200 bg-amber-50 px-5 py-2 text-xs text-amber-800">
            {error}
          </div>
        )}

        <div className="flex flex-1 min-h-0">
          <div className="flex w-[400px] shrink-0 flex-col border-r border-slate-200 bg-[#fafafa] overflow-y-auto scrollbar-thin">
            <div className="border-b border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold text-slate-700">病例信息</p>
              <div className="mt-2 space-y-2">
                <Field theme={theme} label="病例 ID" value={activeCase.patientId} onChange={(v) => updateCase({ patientId: v })} />
                <Field theme={theme} label="FIGO" value={activeCase.figoStage} onChange={(v) => updateCase({ figoStage: v })} />
                <div className="grid grid-cols-2 gap-2">
                  <Field theme={theme} label="HRD 评分" value={String(activeCase.hrdScore ?? "")} onChange={(v) => updateCase({ hrdScore: v ? Number(v) : undefined })} />
                  <Field theme={theme} label="TMB" value={String(activeCase.tmb ?? "")} onChange={(v) => updateCase({ tmb: v ? Number(v) : undefined })} />
                </div>
              </div>
            </div>

            <div className="p-4">
              <p className="text-xs font-semibold text-slate-700">数据源关联</p>
              <p className="mt-1 text-[11px] text-slate-400">点击切换关联状态（演示可模拟多源接入）</p>
              <div className="mt-3 space-y-2">
                {activeCase.sources.map((s) => (
                  <SourceCard theme={theme} key={s.id} source={s} onToggle={() => toggleSource(s.id)} />
                ))}
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col overflow-y-auto scrollbar-thin bg-slate-50/50 p-5">
            <div className="mb-4 grid gap-3 sm:grid-cols-4">
              <StatCard theme={theme} label="已关联数据源" value={`${linkedSources.length}/6`} />
              <StatCard theme={theme} label="可靶向变异" value={String(activeCase.variants.filter((v) => v.tier === "I" || v.tier === "II").length)} accent />
              <StatCard theme={theme} label="HRD" value={activeCase.hrdStatus === "positive" ? "阳性" : activeCase.hrdStatus ?? "—"} accent />
              <StatCard theme={theme} label="多源冲突" value={String(activeCase.variants.filter((v) => v.conflict).length)} warn={activeCase.variants.some((v) => v.conflict)} />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-xs font-semibold text-slate-800">变异整合矩阵</p>
                <p className="text-[11px] text-slate-400">行 = 变异，列 = 检出数据源</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">基因 / 变异</th>
                      <th className="px-2 py-2 text-center">Tier</th>
                      {activeCase.sources.map((s) => (
                        <th key={s.id} className="px-2 py-2 text-center font-medium">
                          {SOURCE_SHORT[s.id]}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-left">临床意义</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeCase.variants.map((v) => (
                      <tr key={`${v.gene}-${v.alteration}`} className="border-t border-slate-100">
                        <td className="px-3 py-2.5">
                          <p className="font-medium text-slate-800">{v.gene}</p>
                          <p className="text-[10px] text-slate-500">{v.alteration}</p>
                          {v.vaf != null && <p className="text-[10px] text-slate-400">VAF {v.vaf}%</p>}
                          {v.conflict && (
                            <span className="mt-0.5 inline-block rounded bg-amber-100 px-1 text-[10px] text-amber-700">
                              待复核
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2.5 text-center">
                          <TierBadge tier={v.tier} />
                        </td>
                        {activeCase.sources.map((s) => (
                          <td key={s.id} className="px-2 py-2.5 text-center">
                            {v.sources.includes(s.id) ? (
                              <span className={`inline-block h-2 w-2 rounded-full ${theme.accentSolidClass}`} title="检出" />
                            ) : (
                              <span className="inline-block h-2 w-2 rounded-full bg-slate-200" />
                            )}
                          </td>
                        ))}
                        <td className="px-3 py-2.5 text-slate-600">
                          {v.clinicalSignificance}
                          {v.therapy && (
                            <p className={`mt-0.5 text-[10px] ${theme.accentTextClass}`}>{v.therapy}</p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {interpretation ? (
              <div className="mt-5 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                      interpretation.source === "llm" ? theme.badgeClass
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {interpretation.source === "llm"
                      ? `大模型 · ${interpretation.model ?? "LLM"}`
                      : "规则引擎（备用）"}
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <InsightCard title="HRD 综合" content={interpretation.hrdConsensus} />
                  <InsightCard title="BRCA / HRR" content={interpretation.brcaStatus} />
                </div>

                <div
                  className={`rounded-xl border p-4 ${
                    interpretation.parpEligible ? theme.highlightBoxClass
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <p className="text-xs font-semibold text-slate-800">
                    PARP 抑制剂适用性 · {interpretation.parpEligible ? "符合考量" : "证据不足"}
                  </p>
                  <p className="mt-2 text-sm text-slate-700">{interpretation.parpRationale}</p>
                  {interpretation.immunotherapyHint && (
                    <p className="mt-2 text-xs text-slate-500">免疫：{interpretation.immunotherapyHint}</p>
                  )}
                </div>

                {interpretation.reasoning && (
                  <div className={`rounded-xl p-4 ${theme.aiPanelClass}`}>
                    <p className={`text-xs font-semibold ${theme.aiPanelTitleClass}`}>AI 融合推理</p>
                    <p className={`mt-2 text-sm leading-relaxed ${theme.aiPanelTextClass}`}>{interpretation.reasoning}</p>
                  </div>
                )}

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold text-slate-700">MDT 建议</p>
                  <ul className="mt-2 space-y-1.5">
                    {interpretation.recommendations.map((r) => (
                      <li key={r} className="flex gap-2 text-xs text-slate-700">
                        <span className={theme.listBulletClass}>•</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>

                {interpretation.conflicts.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-xs font-semibold text-amber-900">多源冲突 / 待复核</p>
                    <ul className="mt-2 space-y-1">
                      {interpretation.conflicts.map((c) => (
                        <li key={c} className="text-xs text-amber-800">
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleExport}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
                  >
                    导出 MDT 摘要
                  </button>
                  <Link
                    href="/clinical/nact-ovarian"
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs text-slate-600 hover:bg-white"
                  >
                    关联 NACT 决策 →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-8 flex flex-col items-center text-center">
                <p className="text-sm text-slate-500">
                  {analyzing ? "大模型正在融合 6 源基因组数据…" : "关联数据源后，点击「运行 AI 融合解读」"}
                </p>
                {!analyzing && linkedSources.length === 0 && (
                  <button onClick={loadDemo} className={`mt-3 text-xs hover:underline ${theme.linkClass}`}>
                    或加载演示病例
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  theme,
  label,
  value,
  onChange,
}: {
  theme: EditionTheme;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-0.5 block text-[10px] font-medium text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-1 ${theme.inputFocusRingClass}`}
      />
    </label>
  );
}

function SourceCard({ theme, source, onToggle }: { theme: EditionTheme; source: GenomicsSourceMeta; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-full rounded-xl border p-3 text-left transition ${
        source.linked ? theme.borderSelectedClass
          : "border-dashed border-slate-200 bg-slate-50 opacity-70"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${SOURCE_COLORS[source.id]}`}>
          {source.label}
        </span>
        <span className="text-[10px] text-slate-400">{source.linked ? "已关联" : "未关联"}</span>
      </div>
      <p className="mt-1.5 text-[11px] text-slate-600">{source.platform}</p>
      {source.linked && source.sampleDate && (
        <p className="mt-0.5 text-[10px] text-slate-400">
          {source.sampleDate} · 质控 {source.quality ?? "—"}
        </p>
      )}
    </button>
  );
}

function StatCard({
  theme,
  label,
  value,
  accent,
  warn,
}: {
  theme: EditionTheme;
  label: string;
  value: string;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        warn ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"
      }`}
    >
      <p className={`text-xl font-bold ${accent ? theme.accentTextClass : "text-slate-800"}`}>{value}</p>
      <p className="text-[10px] text-slate-500">{label}</p>
    </div>
  );
}

function InsightCard({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold text-slate-500">{title}</p>
      <p className="mt-1.5 text-sm text-slate-800">{content}</p>
    </div>
  );
}
