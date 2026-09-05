"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DiseaseIcon } from "@/components/IconFont";
import { predictNactWithLlm } from "@/lib/nact-api";
import {
  createEmptyCase,
  DEFAULT_CLINICAL,
  DEFAULT_MOLECULAR,
  DEFAULT_PATHOLOGY,
  IMAGING_SESSION_KEY,
  type NactCase,
  type NactPrediction,
} from "@/lib/nact-types";

type InputTab = "clinical" | "imaging" | "pathology" | "molecular";

const DEMO_CASE = (): NactCase => ({
  ...createEmptyCase("OV-NACT-DEMO"),
  status: "ready",
  clinical: {
    ...DEFAULT_CLINICAL,
    patientId: "OV-NACT-DEMO",
    age: 58,
    ca125Baseline: 892,
    ca125Mid: 156,
    figoStage: "IIIC",
    ascites: "moderate",
    nactCyclesDone: 3,
  },
  imaging: {
    linked: true,
    sessionId: "demo-pci-session",
    pciScore: 14,
    ctCount: 501,
    linkedAt: new Date().toISOString(),
  },
  pathology: { ...DEFAULT_PATHOLOGY, ki67: 45 },
  molecular: { hrdStatus: "positive", brca: "unknown", hrdScore: 52 },
});

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-800">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function ProbRing({ value, label, sub }: { value: number; label: string; sub: string }) {
  const color =
    value >= 65 ? "text-emerald-600" : value >= 40 ? "text-amber-600" : "text-rose-600";
  return (
    <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-4">
      <p className={`text-3xl font-bold ${color}`}>{value}%</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{label}</p>
      <p className="mt-0.5 text-xs text-slate-500">{sub}</p>
    </div>
  );
}

export function NactOvarianView() {
  const [cases, setCases] = useState<NactCase[]>([DEMO_CASE()]);
  const [activeId, setActiveId] = useState(cases[0]?.id ?? "");
  const [tab, setTab] = useState<InputTab>("clinical");
  const [prediction, setPrediction] = useState<NactPrediction | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeStage, setAnalyzeStage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const activeCase = cases.find((c) => c.id === activeId) ?? cases[0];

  const updateCase = useCallback((patch: Partial<NactCase>, keepPrediction = false) => {
    setCases((prev) =>
      prev.map((c) => (c.id === activeId ? { ...c, ...patch, status: patch.status ?? ("draft" as const) } : c))
    );
    if (!keepPrediction) setPrediction(null);
  }, [activeId]);

  const syncImagingFromStorage = useCallback(() => {
    try {
      const raw = sessionStorage.getItem(IMAGING_SESSION_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as {
        sessionId?: string;
        totalPciScore?: number;
        ctCount?: number;
      };
      updateCase({
        imaging: {
          linked: true,
          sessionId: data.sessionId,
          pciScore: data.totalPciScore,
          ctCount: data.ctCount,
          linkedAt: new Date().toISOString(),
        },
      });
    } catch {
      /* ignore */
    }
  }, [updateCase]);

  useEffect(() => {
    syncImagingFromStorage();
  }, [syncImagingFromStorage]);

  const handleAnalyze = async () => {
    if (!activeCase) return;
    setAnalyzing(true);
    setError(null);
    setPrediction(null);
    setAnalyzeStage("正在汇总四模态数据…");
    try {
      await new Promise((r) => setTimeout(r, 400));
      setAnalyzeStage("大模型多模态推理中…");
      const result = await predictNactWithLlm(activeCase);
      setPrediction(result);
      updateCase({ status: "done" }, true);
      if (result.warning) setError(result.warning);
    } catch (e) {
      setError(e instanceof Error ? e.message : "分析失败");
    } finally {
      setAnalyzing(false);
      setAnalyzeStage("");
    }
  };

  const loadDemoCase = () => {
    const demo = DEMO_CASE();
    setCases((prev) => {
      const rest = prev.filter((c) => c.clinical.patientId !== "OV-NACT-DEMO");
      return [demo, ...rest];
    });
    setActiveId(demo.id);
    setPrediction(null);
    setError(null);
  };

  const handleExportMdt = () => {
    if (!activeCase || !prediction) return;
    const lines = [
      "# 卵巢癌 NACT 多模态 MDT 决策摘要",
      "",
      `病例 ID：${activeCase.clinical.patientId}`,
      `FIGO：${activeCase.clinical.figoStage} · ${activeCase.clinical.histology}`,
      `NACT：${activeCase.clinical.nactRegimen}（${activeCase.clinical.nactCyclesDone}/${activeCase.clinical.nactCyclesPlanned} 周期）`,
      "",
      "## 预测结果",
      `- 引擎：${prediction.source === "llm" ? `大模型 (${prediction.model ?? "LLM"})` : "规则评分卡"}`,
      `- NACT 敏感性：${prediction.sensitivityProb}%（${prediction.sensitivityLabel}）`,
      `- 理想减瘤可能：${prediction.r0Prob}%（${prediction.r0Label}）`,
      "",
      prediction.reasoning ? `## AI 推理\n${prediction.reasoning}\n` : "",
      "## 建议",
      prediction.recommendation,
      "",
      "## 主要依据",
      ...prediction.factors.map((f) => `- ${f.name}：${f.detail}`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MDT_${activeCase.clinical.patientId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ca125Drop = useMemo(() => {
    const { ca125Baseline, ca125Mid } = activeCase?.clinical ?? {};
    if (!ca125Baseline || !ca125Mid) return null;
    return (((ca125Baseline - ca125Mid) / ca125Baseline) * 100).toFixed(0);
  }, [activeCase]);

  if (!activeCase) return null;

  return (
    <div className="flex flex-1 min-h-0">
      {/* 病例列表 */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-3 py-3">
          <p className="text-xs font-semibold text-slate-500">NACT 病例</p>
          <button
            onClick={loadDemoCase}
            className="mt-2 w-full rounded-lg bg-gradient-to-r from-rose-500 to-violet-600 py-2 text-xs font-medium text-white hover:opacity-90"
          >
            加载演示病例
          </button>
          <button
            onClick={() => {
              const c = createEmptyCase();
              setCases((prev) => [c, ...prev]);
              setActiveId(c.id);
              setPrediction(null);
              setError(null);
            }}
            className="mt-2 w-full rounded-lg border border-dashed border-rose-200 py-2 text-xs text-rose-600 hover:bg-rose-50"
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
                  setPrediction(null);
                }}
                className={`mb-1 w-full rounded-lg px-3 py-2.5 text-left text-xs ${
                  c.id === activeId
                    ? "bg-rose-50 font-medium text-rose-700 ring-1 ring-rose-200"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <p>{c.clinical.patientId}</p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {c.clinical.figoStage} · {c.status === "done" ? "已分析" : "草稿"}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* 主工作区 */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-5 py-3">
          <DiseaseIcon name="ovarian" size={22} color="#e11d48" />
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-slate-900">卵巢癌 NACT 多模态预测</h2>
            <p className="text-xs text-slate-500">
              临床 + 影像 PCI + 病理/分子 → 大模型辅助 MDT 决策
            </p>
          </div>
          <span className="hidden rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-medium text-violet-700 sm:inline">
            AI Demo
          </span>
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="rounded-lg bg-gradient-to-r from-rose-500 to-violet-600 px-4 py-2 text-xs font-medium text-white disabled:opacity-50"
          >
            {analyzing ? analyzeStage || "分析中…" : "运行 AI 多模态分析"}
          </button>
        </div>

        {error && (
          <div className="border-b border-amber-200 bg-amber-50 px-5 py-2 text-xs text-amber-800">
            {error}
          </div>
        )}

        <div className="flex flex-1 min-h-0">
          {/* 多模态输入 */}
          <div className="flex w-[420px] shrink-0 flex-col border-r border-slate-200 bg-[#fafafa]">
            <div className="flex border-b border-slate-200 bg-white">
              {(
                [
                  ["clinical", "临床"],
                  ["imaging", "影像"],
                  ["pathology", "病理"],
                  ["molecular", "分子"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex-1 py-2.5 text-xs ${
                    tab === key
                      ? "border-b-2 border-rose-500 font-medium text-rose-600"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
              {tab === "clinical" && (
                <>
                  <Field label="病例 ID">
                    <input
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-400"
                      value={activeCase.clinical.patientId}
                      onChange={(e) =>
                        updateCase({ clinical: { ...activeCase.clinical, patientId: e.target.value } })
                      }
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="年龄">
                      <input
                        type="number"
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-400"
                        value={activeCase.clinical.age ?? ""}
                        onChange={(e) =>
                          updateCase({
                            clinical: {
                              ...activeCase.clinical,
                              age: e.target.value ? Number(e.target.value) : undefined,
                            },
                          })
                        }
                      />
                    </Field>
                    <Field label="ECOG">
                      <select
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-400"
                        value={activeCase.clinical.ecog}
                        onChange={(e) =>
                          updateCase({
                            clinical: { ...activeCase.clinical, ecog: e.target.value },
                          })
                        }
                      >
                        <option>0</option>
                        <option>0-1</option>
                        <option>1</option>
                        <option>2</option>
                      </select>
                    </Field>
                  </div>
                  <Field label="FIGO 分期">
                    <select
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-400"
                      value={activeCase.clinical.figoStage}
                      onChange={(e) =>
                        updateCase({
                          clinical: { ...activeCase.clinical, figoStage: e.target.value },
                        })
                      }
                    >
                      {["IIA", "IIB", "IIC", "IIIA", "IIIB", "IIIC", "IVA", "IVB"].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="组织学">
                    <input
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-400"
                      value={activeCase.clinical.histology}
                      onChange={(e) =>
                        updateCase({
                          clinical: { ...activeCase.clinical, histology: e.target.value },
                        })
                      }
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="CA125 基线 (U/mL)">
                      <input
                        type="number"
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-400"
                        value={activeCase.clinical.ca125Baseline ?? ""}
                        onChange={(e) =>
                          updateCase({
                            clinical: {
                              ...activeCase.clinical,
                              ca125Baseline: e.target.value ? Number(e.target.value) : undefined,
                            },
                          })
                        }
                      />
                    </Field>
                    <Field label="CA125 中期 (U/mL)">
                      <input
                        type="number"
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-400"
                        value={activeCase.clinical.ca125Mid ?? ""}
                        onChange={(e) =>
                          updateCase({
                            clinical: {
                              ...activeCase.clinical,
                              ca125Mid: e.target.value ? Number(e.target.value) : undefined,
                            },
                          })
                        }
                      />
                    </Field>
                  </div>
                  {ca125Drop != null && (
                    <p className="text-xs text-emerald-700">CA125 下降 {ca125Drop}%</p>
                  )}
                  <Field label="NACT 方案">
                    <input
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-400"
                      value={activeCase.clinical.nactRegimen}
                      onChange={(e) =>
                        updateCase({
                          clinical: { ...activeCase.clinical, nactRegimen: e.target.value },
                        })
                      }
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="已完成周期">
                      <input
                        type="number"
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-400"
                        value={activeCase.clinical.nactCyclesDone}
                        onChange={(e) =>
                          updateCase({
                            clinical: {
                              ...activeCase.clinical,
                              nactCyclesDone: Number(e.target.value) || 0,
                            },
                          })
                        }
                      />
                    </Field>
                    <Field label="计划周期">
                      <input
                        type="number"
                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-400"
                        value={activeCase.clinical.nactCyclesPlanned}
                        onChange={(e) =>
                          updateCase({
                            clinical: {
                              ...activeCase.clinical,
                              nactCyclesPlanned: Number(e.target.value) || 4,
                            },
                          })
                        }
                      />
                    </Field>
                  </div>
                </>
              )}

              {tab === "imaging" && (
                <>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-medium text-slate-800">CT + PCI 影像</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      在影像模块完成 DICOM 上传与 PCI 分析后，返回此页关联结果。
                    </p>
                    {activeCase.imaging.linked ? (
                      <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                        已关联 · Session {activeCase.imaging.sessionId?.slice(0, 12) ?? "—"}
                        {activeCase.imaging.pciScore != null && (
                          <span className="ml-2">PCI {activeCase.imaging.pciScore}</span>
                        )}
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-amber-600">尚未关联影像分析</p>
                    )}
                    <div className="mt-3 flex gap-2">
                      <Link
                        href="/imaging"
                        className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs text-white hover:bg-rose-700"
                      >
                        前往影像分析
                      </Link>
                      <button
                        onClick={syncImagingFromStorage}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                      >
                        刷新关联
                      </button>
                    </div>
                  </div>
                </>
              )}

              {tab === "pathology" && (
                <>
                  <Field label="分级">
                    <select
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-400"
                      value={activeCase.pathology.grade}
                      onChange={(e) =>
                        updateCase({
                          pathology: { ...activeCase.pathology, grade: e.target.value },
                        })
                      }
                    >
                      <option>G1</option>
                      <option>G2</option>
                      <option>G3</option>
                    </select>
                  </Field>
                  <Field label="p53">
                    <select
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-400"
                      value={activeCase.pathology.p53}
                      onChange={(e) =>
                        updateCase({
                          pathology: { ...activeCase.pathology, p53: e.target.value },
                        })
                      }
                    >
                      <option>野生型</option>
                      <option>突变型</option>
                      <option>未知</option>
                    </select>
                  </Field>
                  <Field label="WT1">
                    <select
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-400"
                      value={activeCase.pathology.wt1}
                      onChange={(e) =>
                        updateCase({
                          pathology: { ...activeCase.pathology, wt1: e.target.value },
                        })
                      }
                    >
                      <option>阳性</option>
                      <option>阴性</option>
                    </select>
                  </Field>
                  <Field label="Ki67 (%)">
                    <input
                      type="number"
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-400"
                      value={activeCase.pathology.ki67 ?? ""}
                      onChange={(e) =>
                        updateCase({
                          pathology: {
                            ...activeCase.pathology,
                            ki67: e.target.value ? Number(e.target.value) : undefined,
                          },
                        })
                      }
                    />
                  </Field>
                </>
              )}

              {tab === "molecular" && (
                <>
                  <Field label="HRD 状态">
                    <select
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-400"
                      value={activeCase.molecular.hrdStatus}
                      onChange={(e) =>
                        updateCase({
                          molecular: {
                            ...activeCase.molecular,
                            hrdStatus: e.target.value as "positive" | "negative" | "unknown",
                          },
                        })
                      }
                    >
                      <option value="positive">阳性</option>
                      <option value="negative">阴性</option>
                      <option value="unknown">未知</option>
                    </select>
                  </Field>
                  <Field label="BRCA">
                    <select
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-400"
                      value={activeCase.molecular.brca}
                      onChange={(e) =>
                        updateCase({
                          molecular: {
                            ...activeCase.molecular,
                            brca: e.target.value as "mutated" | "wildtype" | "unknown",
                          },
                        })
                      }
                    >
                      <option value="mutated">突变</option>
                      <option value="wildtype">野生型</option>
                      <option value="unknown">未知</option>
                    </select>
                  </Field>
                  <Field label="HRD 评分">
                    <input
                      type="number"
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-rose-400"
                      value={activeCase.molecular.hrdScore ?? ""}
                      onChange={(e) =>
                        updateCase({
                          molecular: {
                            ...activeCase.molecular,
                            hrdScore: e.target.value ? Number(e.target.value) : undefined,
                          },
                        })
                      }
                    />
                  </Field>
                </>
              )}
            </div>
          </div>

          {/* 预测输出 */}
          <div className="flex min-w-0 flex-1 flex-col overflow-y-auto scrollbar-thin bg-slate-50/50 p-5">
            {!prediction ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <p className="text-sm text-slate-500">
                  {analyzing ? analyzeStage : "填写多模态数据后，点击「运行 AI 多模态分析」"}
                </p>
                <p className="mt-2 max-w-md text-xs text-slate-400">
                  演示模式：左侧「加载演示病例」一键填入典型 IIIC 期病例，约 10 秒出结果。
                </p>
                {!analyzing && (
                  <button
                    onClick={loadDemoCase}
                    className="mt-4 rounded-lg border border-violet-200 bg-white px-4 py-2 text-xs text-violet-700 hover:bg-violet-50"
                  >
                    快速加载演示病例 →
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                      prediction.source === "llm"
                        ? "bg-violet-100 text-violet-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {prediction.source === "llm"
                      ? `大模型 · ${prediction.model ?? "LLM"}`
                      : "规则引擎（备用）"}
                  </span>
                  <span className="text-[10px] text-slate-400">仅供 MDT 参考，非最终临床决策</span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <ProbRing
                    value={prediction.sensitivityProb}
                    label="NACT 敏感性"
                    sub={prediction.sensitivityLabel}
                  />
                  <ProbRing
                    value={prediction.r0Prob}
                    label="理想减瘤（R0/≤1cm）"
                    sub={prediction.r0Label}
                  />
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold text-slate-700">四模态贡献度</p>
                  <div className="mt-3 space-y-3">
                    <ScoreBar label="临床" value={prediction.modalityScores.clinical} color="bg-rose-500" />
                    <ScoreBar label="影像 (PCI)" value={prediction.modalityScores.imaging} color="bg-violet-500" />
                    <ScoreBar label="病理" value={prediction.modalityScores.pathology} color="bg-blue-500" />
                    <ScoreBar label="分子" value={prediction.modalityScores.molecular} color="bg-emerald-500" />
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-semibold text-amber-900">MDT 建议</p>
                  <p className="mt-2 text-sm leading-relaxed text-amber-950">{prediction.recommendation}</p>
                </div>

                {prediction.reasoning && (
                  <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-4">
                    <p className="text-xs font-semibold text-violet-900">AI 推理过程</p>
                    <p className="mt-2 text-sm leading-relaxed text-violet-950">{prediction.reasoning}</p>
                  </div>
                )}

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold text-slate-700">Top 决策因子</p>
                  <ul className="mt-2 space-y-2">
                    {prediction.factors.map((f) => (
                      <li
                        key={f.name}
                        className="flex items-start justify-between gap-2 text-xs"
                      >
                        <span className="text-slate-700">{f.name}</span>
                        <span
                          className={
                            f.direction === "positive"
                              ? "text-emerald-600"
                              : f.direction === "negative"
                                ? "text-rose-600"
                                : "text-slate-400"
                          }
                        >
                          {f.detail}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleExportMdt}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
                  >
                    导出 MDT 摘要
                  </button>
                  <Link
                    href="/knowledge"
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs text-slate-600 hover:bg-white"
                  >
                    查看 NACT 指南证据
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-slate-500">{label}</span>
      {children}
    </label>
  );
}
