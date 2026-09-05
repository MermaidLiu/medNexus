"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getStudy } from "@/lib/api";
import type { StepId, Study } from "@/lib/types";
import { StepDetail } from "@/components/StepDetail";
import { useApp } from "@/context/AppContext";
import { EmptyPrompt } from "./ReadView";

const COMPUTE_STEPS: StepId[] = [
  "cohort_definition",
  "data_extraction",
  "data_cleaning",
  "statistical_analysis",
  "visualization",
];

/** 算 · 分析 — 玻尔「做计算」模块 */
export function ComputeView() {
  const params = useSearchParams();
  const { studies, setShowNewStudyModal } = useApp();
  const [study, setStudy] = useState<Study | null>(null);
  const [stepId, setStepId] = useState<StepId>("statistical_analysis");

  useEffect(() => {
    const id = params.get("id") ?? studies[0]?.id;
    if (id) getStudy(id).then(setStudy).catch(() => {});
  }, [params, studies]);

  if (!study) {
    return (
      <EmptyPrompt
        title="算 · 数据分析"
        desc="队列定义、OMOP 抽取、清洗、Cox/PSM 统计与可视化图表。"
        onNew={() => setShowNewStudyModal(true)}
      />
    );
  }

  const steps = study.steps.filter((s) => COMPUTE_STEPS.includes(s.id));
  const step = study.steps.find((s) => s.id === stepId) ?? null;

  return (
    <div className="flex flex-1 min-h-0">
      <aside className="w-56 shrink-0 border-r border-slate-200 bg-white p-3">
        <p className="mb-2 px-2 text-xs font-semibold text-slate-500">分析模块</p>
        {steps.map((s) => (
          <button
            key={s.id}
            onClick={() => setStepId(s.id)}
            className={`mb-1 w-full rounded-lg px-3 py-2 text-left text-sm ${
              stepId === s.id ? "bg-violet-50 text-violet-700" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {s.label}
          </button>
        ))}
      </aside>
      <StepDetail step={step} topic={study.topic} />
    </div>
  );
}
