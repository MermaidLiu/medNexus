"use client";

import {
  IconAlert,
  IconCheck,
  IconCircle,
  IconClock,
  IconLoader,
} from "./Icons";
import type { PipelineStep, StepId } from "@/lib/types";

interface Props {
  steps: PipelineStep[];
  selectedStepId: StepId | null;
  onSelectStep: (id: StepId) => void;
}

function StatusIcon({ status }: { status: PipelineStep["status"] }) {
  switch (status) {
    case "completed":
      return <IconCheck size={18} className="text-rose-500 shrink-0" />;
    case "running":
      return <IconLoader size={18} className="text-violet-500 shrink-0" />;
    case "awaiting_approval":
      return <IconClock size={18} className="text-amber-500 shrink-0" />;
    case "failed":
      return <IconAlert size={18} className="text-red-500 shrink-0" />;
    default:
      return <IconCircle size={18} className="text-slate-300 shrink-0" />;
  }
}

export function PipelineSidebar({ steps, selectedStepId, onSelectStep }: Props) {
  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          任务流水线
        </h3>
        <p className="mt-1 text-xs text-slate-400">Agent 自动拆解 · 9 步全流程</p>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin p-3">
        <ol className="space-y-1">
          {steps.map((step, idx) => {
            const isSelected = selectedStepId === step.id;
            const isLocked = step.status === "locked";

            return (
              <li key={step.id}>
                <button
                  onClick={() => !isLocked && onSelectStep(step.id)}
                  disabled={isLocked}
                  className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    isSelected
                      ? "bg-rose-50 ring-1 ring-rose-200"
                      : isLocked
                        ? "cursor-not-allowed opacity-50"
                        : "hover:bg-slate-50"
                  }`}
                >
                  <span className="mt-0.5 text-xs font-mono text-slate-400 w-4">
                    {idx + 1}
                  </span>
                  <StatusIcon status={step.status} />
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-medium leading-tight ${
                        isSelected ? "text-rose-700" : "text-slate-700"
                      }`}
                    >
                      {step.label}
                    </p>
                    {step.status === "awaiting_approval" && (
                      <span className="mt-0.5 block text-[11px] text-amber-600">
                        待主任审批
                      </span>
                    )}
                  </div>
                </button>
                {idx < steps.length - 1 && (
                  <div className="ml-9 h-3 border-l-2 border-dashed border-slate-200" />
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </aside>
  );
}
