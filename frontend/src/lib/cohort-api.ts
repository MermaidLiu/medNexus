import type {
  CohortCorrelations,
  CohortImportResult,
  CohortMeta,
  CohortPatient,
} from "./cohort-types";

export async function fetchCohort(): Promise<CohortMeta> {
  const res = await fetch("/api/v1/cohort/patients");
  if (!res.ok) throw new Error("无法加载队列数据");
  return res.json() as Promise<CohortMeta>;
}

export async function importCohortExcel(
  file: File,
  mode: "replace" | "append" = "replace"
): Promise<CohortImportResult> {
  const form = new FormData();
  form.append("excel", file);
  form.append("mode", mode);

  const res = await fetch("/api/v1/cohort/import", { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `导入失败 (${res.status})`);
  }
  return res.json() as Promise<CohortImportResult>;
}

export async function updateCohortPatient(
  id: string,
  patch: Partial<CohortPatient>
): Promise<CohortPatient> {
  const res = await fetch(`/api/v1/cohort/patients/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? "保存失败");
  }
  return res.json() as Promise<CohortPatient>;
}

export async function fetchCohortCorrelations(): Promise<CohortCorrelations> {
  const res = await fetch("/api/v1/cohort/correlations");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? "相关性分析失败");
  }
  return res.json() as Promise<CohortCorrelations>;
}

const OUTCOME_LABELS: Record<string, string> = {
  nact_response: "NACT 反应",
  r0: "理想减瘤 R0",
  pfs: "PFS",
  os: "OS",
};

const VAR_LABELS: Record<string, string> = {
  age: "年龄",
  ca125_baseline: "CA125 基线",
  ca125_mid: "CA125 中期",
  pci: "PCI",
  hrd: "HRD",
  brca: "BRCA",
  nact_cycles: "NACT 周期",
  figo: "FIGO",
};

export function labelVar(key: string): string {
  return VAR_LABELS[key] ?? OUTCOME_LABELS[key] ?? key;
}

export function corrColor(rho: number | null): string {
  if (rho == null) return "bg-slate-50";
  const a = Math.abs(rho);
  if (a >= 0.6) return rho > 0 ? "bg-rose-200" : "bg-violet-200";
  if (a >= 0.35) return rho > 0 ? "bg-rose-100" : "bg-violet-100";
  if (a >= 0.2) return "bg-slate-100";
  return "bg-white";
}
