"use client";

import { IconUser, SidebarIcon } from "@/components/IconFont";
import { MiniProgramQrButton } from "@/components/diagnosis/MiniProgramQrButton";
import { useDiagnosis } from "@/context/DiagnosisContext";
import { DEPARTMENTS } from "@/lib/auth-types";
import { AGENT_EDITION_META } from "@/lib/agent-editions";
import { SITE_BRAND } from "@/lib/sidebar-nav";
import { AgentEditionSwitcher } from "@/components/layout/AgentEditionSwitcher";

export function DiagnosisTopBar() {
  const {
    doctor,
    authLoading,
    logout,
    updateDepartment,
    openAuthModal,
    agentEdition,
    setAgentEdition,
    canAccessPanel,
  } = useDiagnosis();
  const editionMeta = AGENT_EDITION_META[agentEdition];

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-5">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-violet-600 shadow-sm">
          <SidebarIcon name="ovarian" size={18} color="#ffffff" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold leading-tight text-slate-900">{SITE_BRAND.title}</p>
          <p className="truncate text-[10px] leading-tight text-rose-600">
            {editionMeta.shortLabel} · {SITE_BRAND.subtitle}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <AgentEditionSwitcher edition={agentEdition} onChange={setAgentEdition} />
        {agentEdition === "hospital" && <MiniProgramQrButton />}

        {authLoading ? (
          <span className="text-xs text-slate-400">…</span>
        ) : doctor ? (
          <div className="flex items-center gap-2">
            <select
              value={doctor.department}
              onChange={(e) => updateDepartment(e.target.value)}
              className="hidden rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-100 lg:block"
              aria-label="所属科室"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <span className="hidden max-w-[8rem] truncate text-xs font-medium text-slate-800 md:inline">
              {doctor.name}
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-violet-600">
              <IconUser size={14} color="#ffffff" />
            </div>
            <button
              type="button"
              onClick={() => logout()}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] text-slate-600 hover:bg-slate-50"
            >
              退出
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => openAuthModal("register")}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
          >
            <IconUser size={14} color="#ffffff" />
            注册
          </button>
        )}
      </div>
    </header>
  );
}
