"use client";

import {
  AGENT_EDITION_META,
  type AgentEdition,
} from "@/lib/agent-editions";

const EDITIONS: AgentEdition[] = ["hospital", "research", "pharma"];

type Props = {
  edition: AgentEdition;
  onChange: (edition: AgentEdition) => void;
};

export function AgentEditionSwitcher({ edition, onChange }: Props) {
  return (
    <div
      className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-0.5"
      role="group"
      aria-label="Agent 版本"
    >
      {EDITIONS.map((id) => {
        const meta = AGENT_EDITION_META[id];
        const active = edition === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            title={meta.tagline}
            className={`rounded-lg px-2 py-1 text-[10px] font-medium transition ${
              active
                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {meta.shortLabel}
          </button>
        );
      })}
    </div>
  );
}
