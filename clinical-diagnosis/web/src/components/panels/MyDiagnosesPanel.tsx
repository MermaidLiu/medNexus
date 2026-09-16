"use client";

import { useCallback, useEffect, useState } from "react";
import { useDiagnosis } from "@/context/DiagnosisContext";
import { fetchMyVisits } from "@/lib/diagnosis-api";
import type { DiagnosisVisit } from "@/lib/diagnosis-types";

export function MyDiagnosesPanel() {
  const { doctor, openAuthModal, openVisitInWorkflow } = useDiagnosis();
  const [visits, setVisits] = useState<DiagnosisVisit[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!doctor) return;
    setLoading(true);
    try {
      const list = await fetchMyVisits();
      setVisits(list.filter((v) => v.aiDiagnosis || v.completedSteps?.length));
    } finally {
      setLoading(false);
    }
  }, [doctor]);

  useEffect(() => {
    load();
  }, [load]);

  const openVisit = (id: string) => {
    openVisitInWorkflow(id);
  };

  if (!doctor) {
    return (
      <PanelShell title="我的诊断" desc="查看历史 AI 辅助诊断记录">
        <EmptyAuth onLogin={() => openAuthModal("login")} message="登录后查看您的诊断记录" />
      </PanelShell>
    );
  }

  return (
    <PanelShell title="我的诊断" desc="历史就诊与 AI 辅助诊断摘要">
      {loading ? (
        <p className="text-sm text-slate-400">加载中…</p>
      ) : visits.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          暂无诊断记录，完成一次 AI 辅助诊断后将显示在这里
        </div>
      ) : (
        <div className="space-y-3">
          {visits.map((v) => (
            <DiagnosisCard key={v.id} visit={v} onOpen={() => openVisit(v.id)} />
          ))}
        </div>
      )}
    </PanelShell>
  );
}

function DiagnosisCard({ visit, onOpen }: { visit: DiagnosisVisit; onOpen: () => void }) {
  const ai = visit.aiDiagnosis;
  const name = visit.registration?.patientName || "未命名患者";
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-rose-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">{name}</p>
          <p className="mt-1 text-xs text-slate-500">
            {visit.registration?.department} · {new Date(visit.updatedAt).toLocaleDateString("zh-CN")}
          </p>
        </div>
        {ai?.urgency && (
          <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-medium text-amber-800 ring-1 ring-amber-200">
            {ai.urgency}
          </span>
        )}
      </div>
      {ai?.summary && <p className="mt-3 text-sm leading-relaxed text-slate-600 line-clamp-2">{ai.summary}</p>}
      {ai?.differential && ai.differential.length > 0 && (
        <p className="mt-2 text-xs text-violet-700">鉴别：{ai.differential.slice(0, 3).join(" · ")}</p>
      )}
    </button>
  );
}

export function PanelShell({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-[#f4f6f9]">
      <header className="border-b border-slate-200 bg-white px-8 py-6">
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {desc && <p className="mt-1 text-sm text-slate-500">{desc}</p>}
      </header>
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-3xl">{children}</div>
      </div>
    </div>
  );
}

export function EmptyAuth({ message, onLogin }: { message: string; onLogin: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
      <p className="text-sm text-slate-500">{message}</p>
      <button
        type="button"
        onClick={onLogin}
        className="mt-4 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white"
      >
        医生登录
      </button>
    </div>
  );
}
