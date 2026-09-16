/** 91 例队列 → NACT 多模态病例 转换 */

import type { CohortPatient } from "./cohort-types";
import {
  createEmptyCase,
  DEFAULT_CLINICAL,
  DEFAULT_MOLECULAR,
  DEFAULT_PATHOLOGY,
  type NactCase,
  type NactCohortRef,
} from "./nact-types";

function parseNum(v?: string | null): number | undefined {
  if (v == null || v === "") return undefined;
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

function parseHrd(v?: string | null): "positive" | "negative" | "unknown" {
  if (!v) return "unknown";
  const s = v.toLowerCase();
  if (/阳性|positive|\+/.test(s)) return "positive";
  if (/阴性|negative|-/.test(s)) return "negative";
  const score = parseNum(v);
  if (score != null) return score >= 42 ? "positive" : "negative";
  return "unknown";
}

function parseBrca(v?: string | null): "mutated" | "wildtype" | "unknown" {
  if (!v) return "unknown";
  const s = v.toLowerCase();
  if (/突变|mut|阳性|\+|pathogenic/.test(s)) return "mutated";
  if (/野生|wild|阴性|-/.test(s)) return "wildtype";
  return "unknown";
}

function extraGet(extra: Record<string, string> | undefined, keys: string[]): string | undefined {
  if (!extra) return undefined;
  for (const [k, val] of Object.entries(extra)) {
    const nk = k.replace(/\s/g, "").toLowerCase();
    if (keys.some((key) => nk.includes(key.replace(/\s/g, "").toLowerCase()))) {
      return val;
    }
  }
  return undefined;
}

export function cohortPatientToNactCase(p: CohortPatient): NactCase {
  const extra = p.extra ?? {};
  const patientId = p.patient_id?.trim() || p.name?.trim() || `ROW-${p.sourceRow ?? "?"}`;
  const pci = parseNum(p.pci) ?? parseNum(extraGet(extra, ["pci", "PCI"]));
  const cycles = parseNum(p.nact_cycles) ?? parseNum(extraGet(extra, ["周期", "nact"]));
  const hrdScore = parseNum(p.hrd) ?? parseNum(extraGet(extra, ["hrd", "GIS"]));

  const cohortRef: NactCohortRef = {
    id: p.id,
    name: p.name ?? undefined,
    sourceRow: p.sourceRow,
    outcomes: {
      nact_response: p.nact_response ?? undefined,
      r0: p.r0 ?? undefined,
      pfs: p.pfs ?? undefined,
      os: p.os ?? undefined,
    },
  };

  const base = createEmptyCase(patientId);

  return {
    ...base,
    status: "ready",
    cohortRef,
    clinical: {
      ...DEFAULT_CLINICAL,
      patientId,
      age: parseNum(p.age),
      figoStage: p.figo?.trim() || DEFAULT_CLINICAL.figoStage,
      histology:
        extraGet(extra, ["组织学", "病理类型", "histology"]) ?? DEFAULT_CLINICAL.histology,
      ca125Baseline: parseNum(p.ca125_baseline),
      ca125Mid: parseNum(p.ca125_mid),
      nactCyclesDone: cycles ?? DEFAULT_CLINICAL.nactCyclesDone,
      nactCyclesPlanned: cycles ?? DEFAULT_CLINICAL.nactCyclesPlanned,
    },
    imaging: pci != null ? { linked: true, pciScore: pci, linkedAt: new Date().toISOString() } : { linked: false },
    pathology: {
      ...DEFAULT_PATHOLOGY,
      grade: extraGet(extra, ["分级", "grade"]) ?? DEFAULT_PATHOLOGY.grade,
      ki67: parseNum(extraGet(extra, ["ki67", "Ki67"])),
    },
    molecular: {
      hrdStatus: parseHrd(p.hrd ?? extraGet(extra, ["hrd", "HRD"])),
      brca: parseBrca(p.brca ?? extraGet(extra, ["brca", "BRCA"])),
      hrdScore,
    },
  };
}

export function findCaseByCohortId(cases: NactCase[], cohortId: string): NactCase | undefined {
  return cases.find((c) => c.cohortRef?.id === cohortId);
}

export function cohortDisplayName(p: CohortPatient): string {
  return p.name?.trim() || p.patient_id?.trim() || `#${p.sourceRow ?? "?"}`;
}
