"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getStudy } from "@/lib/api";
import type { StepId, Study } from "@/lib/types";
import { StepDetail } from "@/components/StepDetail";
import { useApp } from "@/context/AppContext";

const READ_STEPS: StepId[] = ["research_question", "literature_search", "literature_comparison"];

/** 读 · 文献 — 玻尔「读文献」模块 */
export function ReadView() {
  const params = useSearchParams();
  const { studies, setShowNewStudyModal } = useApp();
  const [study, setStudy] = useState<Study | null>(null);
  const [stepId, setStepId] = useState<StepId>("literature_search");

  useEffect(() => {
    const id = params.get("id") ?? studies[0]?.id;
    if (id) getStudy(id).then(setStudy).catch(() => {});
  }, [params, studies]);

  if (!study) {
    return (
      <EmptyPrompt
        title="读 · 文献调研"
        desc="完成深度研究后，在此查看 PICO、文献检索与证据对比。"
        onNew={() => setShowNewStudyModal(true)}
      />
    );
  }

  const steps = study.steps.filter((s) => READ_STEPS.includes(s.id));
  const step = study.steps.find((s) => s.id === stepId) ?? null;

  return (
    <div className="flex flex-1 min-h-0">
      <aside className="w-56 shrink-0 border-r border-slate-200 bg-white p-3">
        <p className="mb-2 px-2 text-xs font-semibold text-slate-500">文献模块</p>
        {steps.map((s) => (
          <button
            key={s.id}
            onClick={() => setStepId(s.id)}
            className={`mb-1 w-full rounded-lg px-3 py-2 text-left text-sm ${
              stepId === s.id ? "bg-rose-50 text-rose-700" : "text-slate-600 hover:bg-slate-50"
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

function EmptyPrompt({
  title,
  desc,
  onNew,
}: {
  title: string;
  desc: string;
  onNew: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
      <p className="text-lg font-medium text-slate-700">{title}</p>
      <p className="max-w-md text-center text-sm text-slate-500">{desc}</p>
      <button
        onClick={onNew}
        className="rounded-xl bg-rose-600 px-5 py-2 text-sm text-white hover:bg-rose-700"
      >
        新建研究
      </button>
    </div>
  );
}

export { EmptyPrompt };
