"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { approveStep, getStudy } from "@/lib/api";
import type { StepId, Study } from "@/lib/types";
import { PIPELINE_STEPS } from "@/lib/types";
import { PipelineSidebar } from "@/components/PipelineSidebar";
import { StepDetail } from "@/components/StepDetail";

/** 深度研究 — 9 步流水线（嵌入 AppShell 主区） */
export function ResearchView() {
  const params = useSearchParams();
  const studyId = params.get("id");
  const { studies, refreshStudies, setShowNewStudyModal } = useApp();

  const [activeStudy, setActiveStudy] = useState<Study | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<StepId | null>(null);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStudy = useCallback(async (id: string) => {
    const study = await getStudy(id);
    setActiveStudy(study);
    const step =
      study.steps.find((s) => s.status === "awaiting_approval") ??
      study.steps.find((s) => s.status !== "pending") ??
      study.steps[0];
    setSelectedStepId(step?.id ?? "research_question");
  }, []);

  useEffect(() => {
    if (studyId) {
      loadStudy(studyId).catch(() => setError("无法加载研究项目"));
    } else if (studies.length > 0) {
      loadStudy(studies[0].id).catch(() => {});
    } else {
      setActiveStudy(null);
    }
  }, [studyId, studies, loadStudy]);

  const handleApprove = async () => {
    if (!activeStudy || !selectedStepId) return;
    setApproving(true);
    try {
      const updated = await approveStep(activeStudy.id, selectedStepId);
      setActiveStudy(updated);
      await refreshStudies();
    } catch (e) {
      setError(e instanceof Error ? e.message : "审批失败");
    } finally {
      setApproving(false);
    }
  };

  const selectedStep = activeStudy?.steps.find((s) => s.id === selectedStepId) ?? null;
  const progress = activeStudy
    ? Math.round(
        (activeStudy.steps.filter((s) => s.status === "completed").length /
          PIPELINE_STEPS.length) *
          100
      )
    : 0;

  if (!activeStudy) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <p className="text-lg font-medium text-slate-700">深度研究 · Agent 流水线</p>
        <p className="max-w-md text-center text-sm text-slate-500">
          从左侧「科学导航」搜索问题，或点击「新建研究」启动 9 步自动化科研流水线。
        </p>
        <button
          onClick={() => setShowNewStudyModal(true)}
          className="rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-rose-700"
        >
          新建研究
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {error && <div className="bg-red-50 px-5 py-2 text-sm text-red-700">{error}</div>}

      {/* 研究标题条 */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-2">
        <p className="line-clamp-1 flex-1 text-xs text-slate-600">{activeStudy.topic}</p>
        <div className="ml-4 flex items-center gap-2">
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-rose-500" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-[10px] text-slate-400">{progress}%</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <PipelineSidebar
          steps={activeStudy.steps}
          selectedStepId={selectedStepId}
          onSelectStep={setSelectedStepId}
        />
        <StepDetail
          step={selectedStep}
          topic={activeStudy.topic}
          onApprove={
            selectedStep?.status === "awaiting_approval" ? handleApprove : undefined
          }
          approving={approving}
        />
      </div>
    </div>
  );
}
