"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getStudy } from "@/lib/api";
import type { Study } from "@/lib/types";
import { StepDetail } from "@/components/StepDetail";
import { useApp } from "@/context/AppContext";
import { EmptyPrompt } from "./ReadView";

/** 做 · 产出 — 玻尔「写综述/报告」模块 */
export function ProduceView() {
  const params = useSearchParams();
  const { studies, setShowNewStudyModal } = useApp();
  const [study, setStudy] = useState<Study | null>(null);

  useEffect(() => {
    const id = params.get("id") ?? studies[0]?.id;
    if (id) getStudy(id).then(setStudy).catch(() => {});
  }, [params, studies]);

  if (!study) {
    return (
      <EmptyPrompt
        title="做 · 科研产出"
        desc="整合文献与实证结果，生成结构化 Research Report。"
        onNew={() => setShowNewStudyModal(true)}
      />
    );
  }

  const step = study.steps.find((s) => s.id === "research_report") ?? null;

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      <StepDetail step={step} topic={study.topic} />
    </div>
  );
}
