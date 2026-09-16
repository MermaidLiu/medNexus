"use client";

import { useDiagnosis } from "@/context/DiagnosisContext";
import { EmptyAuth, PanelShell } from "@/components/panels/MyDiagnosesPanel";

export function PatientsPanel() {
  const {
    doctor,
    patients,
    patientsLoading,
    selectedPatient,
    selectPatient,
    openAuthModal,
    setActivePanel,
  } = useDiagnosis();

  if (!doctor) {
    return (
      <PanelShell title="我的患者" desc="绑定与管理您的患者">
        <EmptyAuth onLogin={() => openAuthModal("login")} message="登录后添加并管理患者" />
      </PanelShell>
    );
  }

  return (
    <PanelShell title="我的患者" desc="点击患者进入 AI 辅助诊断流程">
      {patientsLoading ? (
        <p className="text-sm text-slate-400">加载中…</p>
      ) : patients.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          暂无患者，请使用左侧「+ 添加」或下方按钮
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {patients.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                selectPatient(p);
                setActivePanel("workflow");
              }}
              className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:shadow-md ${
                selectedPatient?.id === p.id ? "border-rose-300 ring-2 ring-rose-100" : "border-slate-200"
              }`}
            >
              <p className="font-semibold text-slate-900">{p.name}</p>
              <p className="mt-1 text-xs text-slate-500">
                {p.gender}
                {p.age != null ? ` · ${p.age}岁` : ""} · {p.department}
              </p>
              {p.phone && <p className="mt-1 text-xs text-slate-400">{p.phone}</p>}
              <p className="mt-3 text-[10px] text-violet-600">{p.visitIds?.length ?? 0} 次就诊记录</p>
            </button>
          ))}
        </div>
      )}
    </PanelShell>
  );
}
