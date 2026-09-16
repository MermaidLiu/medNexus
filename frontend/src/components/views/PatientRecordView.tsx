"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useResearch } from "@/context/ResearchContext";
import { COHORT_FIELD_DEFS, fieldLabel } from "@/lib/cohort-types";

const GROUP_LABELS: Record<string, string> = {
  basic: "基本信息",
  clinical: "临床",
  lab: "检验",
  imaging: "影像",
  molecular: "分子",
  outcome: "结局",
};

export function PatientRecordView({ caseId }: { caseId: string }) {
  const router = useRouter();
  const { getPatient, selectedIds, toggleSelect, setSelectedIds } = useResearch();
  const patient = getPatient(caseId);

  if (!patient) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
        <p className="text-sm text-slate-500">未找到病例 {caseId}</p>
        <Link href="/" className="text-xs text-violet-600 underline">
          返回工作台
        </Link>
      </div>
    );
  }

  const groups = [...new Set(COHORT_FIELD_DEFS.map((f) => f.group))];

  const addToOmics = () => {
    const ids = selectedIds.includes(caseId) ? selectedIds : [...selectedIds, caseId];
    setSelectedIds(ids);
    router.push(`/omics?ids=${ids.join(",")}`);
  };

  return (
    <div className="flex flex-1 flex-col overflow-y-auto scrollbar-thin px-6 py-8">
      <div className="mx-auto w-full max-w-3xl">
        <Link href="/" className="text-xs text-violet-600 hover:underline">
          ← 返回病例列表
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              结构化病历 · {patient.name || patient.patient_id || caseId.slice(0, 8)}
            </h1>
            <p className="mt-1 text-sm text-slate-500">脱敏科研病例 · 仅供科研分析</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => toggleSelect(caseId)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
            >
              {selectedIds.includes(caseId) ? "取消勾选" : "加入分析集"}
            </button>
            <button
              type="button"
              onClick={addToOmics}
              className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-700"
            >
              进入多组学分析
            </button>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          {groups.map((group) => {
            const fields = COHORT_FIELD_DEFS.filter((f) => f.group === group);
            return (
              <section
                key={group}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h2 className="text-sm font-semibold text-slate-800">{GROUP_LABELS[group] ?? group}</h2>
                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  {fields.map((f) => (
                    <div key={f.key}>
                      <dt className="text-[11px] font-medium text-slate-400">{f.label}</dt>
                      <dd className="mt-1 text-sm text-slate-800">
                        {String(patient[f.key] ?? "—")}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            );
          })}
          {patient.extra && Object.keys(patient.extra).length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-800">扩展字段</h2>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                {Object.entries(patient.extra).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[11px] text-slate-400">{fieldLabel(k)}</dt>
                    <dd className="mt-1 text-sm text-slate-800">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
