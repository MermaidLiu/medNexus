"use client";

import { useState } from "react";
import { IconExternalLink, SidebarIcon } from "@/components/IconFont";
import { AddPatientModal } from "@/components/diagnosis/AddPatientModal";
import { useDiagnosis } from "@/context/DiagnosisContext";
import { SIDEBAR_NAV, type NavItem, type SidebarPanel } from "@/lib/sidebar-nav";

type Props = {
  onNewVisit: () => void;
};

export function DiagnosisSidebar({ onNewVisit }: Props) {
  const {
    doctor,
    patients,
    patientsLoading,
    selectedPatient,
    selectPatient,
    activePanel,
    setActivePanel,
    canAccessPanel,
  } = useDiagnosis();
  const [showAddPatient, setShowAddPatient] = useState(false);

  const isActive = (id: string) => {
    if (id === "skill") return false;
    return activePanel === id;
  };

  const onNavClick = (item: NavItem) => {
    if (item.external) return;
    setActivePanel(item.id as SidebarPanel);
  };

  const showPatientList = activePanel === "patients" || activePanel === "workflow";

  return (
    <>
      <aside className="flex w-[260px] shrink-0 flex-col border-r border-slate-200 bg-[#f7f8fa]">
        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4">
          {SIDEBAR_NAV.map((group) => (
            <div key={group.title} className="mb-5">
              <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items
                  .filter((item) => canAccessPanel(item.id))
                  .map((item) =>
                  item.external ? (
                    <a
                      key={item.id}
                      href={item.external}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600 transition hover:bg-white hover:text-slate-900"
                    >
                      <SidebarIcon name={item.icon} size={18} color="#64748b" />
                      <span className="flex-1 truncate">{item.label}</span>
                      <IconExternalLink size={12} color="#94a3b8" />
                    </a>
                  ) : (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onNavClick(item)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                        isActive(item.id)
                          ? "bg-rose-50 font-medium text-rose-700 ring-1 ring-rose-200"
                          : "text-slate-600 hover:bg-white hover:text-slate-900"
                      }`}
                    >
                      <SidebarIcon
                        name={item.icon}
                        size={18}
                        color={isActive(item.id) ? "#e11d48" : "#64748b"}
                      />
                      <div className="min-w-0 flex-1">
                        <span className="block truncate">{item.label}</span>
                        {item.desc && isActive(item.id) && (
                          <span className="mt-0.5 block truncate text-[10px] font-normal text-rose-500/80">
                            {item.desc}
                          </span>
                        )}
                      </div>
                    </button>
                  )
                )}
              </div>
            </div>
          ))}

          {/* Patient list under 我的患者 / workflow */}
          {doctor && showPatientList && (
            <div className="mb-4 rounded-xl bg-white/80 p-3 ring-1 ring-slate-200/80">
              <div className="mb-2 flex items-center justify-between px-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">患者列表</p>
                <button
                  type="button"
                  onClick={() => setShowAddPatient(true)}
                  className="text-[10px] font-medium text-rose-600 hover:text-rose-700"
                >
                  + 添加
                </button>
              </div>
              <div className="max-h-40 space-y-1 overflow-y-auto scrollbar-thin">
                {patientsLoading ? (
                  <p className="py-2 text-center text-[10px] text-slate-400">加载中…</p>
                ) : patients.length === 0 ? (
                  <p className="py-2 text-center text-[10px] text-slate-400">暂无患者</p>
                ) : (
                  patients.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectPatient(p)}
                      className={`w-full rounded-lg px-2.5 py-2 text-left text-xs transition ${
                        selectedPatient?.id === p.id
                          ? "bg-rose-50 font-medium text-rose-800"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {p.name}
                      <span className="ml-1 text-[10px] text-slate-400">({p.visitIds?.length ?? 0})</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </nav>

        {/* Footer */}
        {activePanel === "workflow" && (
          <div className="border-t border-slate-200 p-4">
            <button
              type="button"
              onClick={onNewVisit}
              className="w-full rounded-xl border border-rose-200 bg-rose-50/80 py-2.5 text-xs font-medium text-rose-700 hover:bg-rose-50"
            >
              + 新建就诊
            </button>
          </div>
        )}
      </aside>

      <AddPatientModal open={showAddPatient} onClose={() => setShowAddPatient(false)} />
    </>
  );
}
