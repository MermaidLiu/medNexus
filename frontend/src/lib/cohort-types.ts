/** 91 例卵巢癌队列入库 — 类型与字段定义 */

export interface CohortPatient {
  id: string;
  sourceRow?: number;
  importedAt?: string;
  updatedAt?: string;
  patient_id?: string | null;
  name?: string | null;
  age?: string | null;
  figo?: string | null;
  ca125_baseline?: string | null;
  ca125_mid?: string | null;
  pci?: string | null;
  hrd?: string | null;
  brca?: string | null;
  nact_cycles?: string | null;
  nact_response?: string | null;
  r0?: string | null;
  pfs?: string | null;
  os?: string | null;
  extra?: Record<string, string>;
}

export interface CohortMeta {
  name?: string;
  importedAt?: string | null;
  sourceFile?: string | null;
  columns_raw?: string[];
  columns_mapped?: Record<string, string>;
  patient_count?: number;
  patients?: CohortPatient[];
}

export interface CohortImportResult {
  imported: number;
  total: number;
  mode: string;
  importedAt: string;
  columns_raw: string[];
  columns_mapped: Record<string, string>;
  patients: CohortPatient[];
}

export interface CohortCorrelations {
  n_patients: number;
  columns_mapped: Record<string, string>;
  correlations: {
    matrix: (number | null)[][];
    variables: string[];
    outcome_correlations: {
      outcome: string;
      top: { variable: string; rho: number; n: number }[];
    }[];
    method: string;
    note?: string;
  };
  model_hints: string[];
}

export const COHORT_STORAGE_KEY = "mednexus_cohort_v1";

/** 标准字段 — 表单与表格展示 */
export const COHORT_FIELD_DEFS: {
  key: keyof CohortPatient;
  label: string;
  group: "basic" | "clinical" | "lab" | "imaging" | "molecular" | "outcome";
}[] = [
  { key: "patient_id", label: "编号/住院号", group: "basic" },
  { key: "name", label: "姓名", group: "basic" },
  { key: "age", label: "年龄", group: "basic" },
  { key: "figo", label: "FIGO 分期", group: "clinical" },
  { key: "ca125_baseline", label: "CA125 基线", group: "lab" },
  { key: "ca125_mid", label: "CA125 中期", group: "lab" },
  { key: "pci", label: "PCI 评分", group: "imaging" },
  { key: "hrd", label: "HRD", group: "molecular" },
  { key: "brca", label: "BRCA", group: "molecular" },
  { key: "nact_cycles", label: "NACT 周期", group: "clinical" },
  { key: "nact_response", label: "NACT 反应", group: "outcome" },
  { key: "r0", label: "减瘤/R0", group: "outcome" },
  { key: "pfs", label: "PFS", group: "outcome" },
  { key: "os", label: "OS", group: "outcome" },
];

export const TABLE_COLUMNS: (keyof CohortPatient)[] = [
  "patient_id",
  "name",
  "age",
  "figo",
  "ca125_baseline",
  "pci",
  "nact_response",
  "r0",
];

export function fieldLabel(key: string): string {
  return COHORT_FIELD_DEFS.find((f) => f.key === key)?.label ?? key;
}

export function saveCohortLocal(data: CohortMeta) {
  try {
    localStorage.setItem(COHORT_STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function loadCohortLocal(): CohortMeta | null {
  try {
    const raw = localStorage.getItem(COHORT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CohortMeta) : null;
  } catch {
    return null;
  }
}
