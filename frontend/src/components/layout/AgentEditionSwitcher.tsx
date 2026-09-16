"use client";

import {
  EDITION_THEME,
  type AgentEdition,
} from "@/lib/agent-editions";

type Props = {
  edition: AgentEdition;
  onChange: (edition: AgentEdition) => void;
  compact?: boolean;
};

const EDITIONS: AgentEdition[] = ["research", "pharma"];

export function AgentEditionSwitcher({ edition, onChange, compact }: Props) {
  return (
    <div
      className={`flex w-full items-stretch gap-0.5 rounded-xl border border-slate-200 bg-slate-50 p-0.5 ${
        compact ? "" : "shadow-sm"
      }`}
      role="group"
      aria-label="Agent 版本"
    >
      {EDITIONS.map((id) => {
        const active = edition === id;
        const theme = EDITION_THEME[id];
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`min-w-0 flex-1 rounded-lg py-1.5 text-center text-[11px] font-medium transition ${
              active ? theme.switcherActiveClass : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {id === "research" ? "科研版" : "药企版"}
          </button>
        );
      })}
    </div>
  );
}
