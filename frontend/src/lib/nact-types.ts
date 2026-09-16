/** 卵巢癌 NACT 多模态决策 — 病例与预测类型 */

export type NactCaseStatus = "draft" | "ready" | "analyzing" | "done";

export interface NactClinicalData {
  patientId: string;
  age?: number;
  figoStage: string;
  histology: string;
  ecog: string;
  ca125Baseline?: number;
  ca125Mid?: number;
  ascites: "none" | "mild" | "moderate" | "severe";
  nactRegimen: string;
  nactCyclesDone: number;
  nactCyclesPlanned: number;
}

export interface NactImagingLink {
  linked: boolean;
  sessionId?: string;
  pciScore?: number;
  ctCount?: number;
  linkedAt?: string;
}

export interface NactPathologyData {
  grade: string;
  p53: string;
  wt1: string;
  ki67?: number;
}

export interface NactMolecularData {
  hrdStatus: "positive" | "negative" | "unknown";
  brca: "mutated" | "wildtype" | "unknown";
  hrdScore?: number;
}

export interface NactCohortRef {
  id: string;
  name?: string;
  sourceRow?: number;
  outcomes?: {
    nact_response?: string;
    r0?: string;
    pfs?: string;
    os?: string;
  };
}

export interface NactCase {
  id: string;
  createdAt: string;
  status: NactCaseStatus;
  cohortRef?: NactCohortRef;
  clinical: NactClinicalData;
  imaging: NactImagingLink;
  pathology: NactPathologyData;
  molecular: NactMolecularData;
}

export interface PredictionFactor {
  name: string;
  contribution: number;
  direction: "positive" | "negative" | "neutral";
  detail: string;
}

export interface NactPrediction {
  sensitivityProb: number;
  sensitivityLabel: "敏感" | "不确定" | "耐药倾向";
  r0Prob: number;
  r0Label: "理想减瘤可能" | "需 MDT 讨论" | "减瘤难度高";
  recommendation: string;
  reasoning?: string;
  factors: PredictionFactor[];
  modalityScores: {
    clinical: number;
    imaging: number;
    pathology: number;
    molecular: number;
  };
  source?: "llm" | "rules";
  model?: string;
  warning?: string;
}

export const IMAGING_SESSION_KEY = "mednexus_imaging_last";

export const DEFAULT_CLINICAL: NactClinicalData = {
  patientId: "",
  figoStage: "IIIC",
  histology: "高级别浆液性癌",
  ecog: "0-1",
  ascites: "moderate",
  nactRegimen: "卡铂+紫杉醇",
  nactCyclesDone: 3,
  nactCyclesPlanned: 4,
};

export const DEFAULT_PATHOLOGY: NactPathologyData = {
  grade: "G3",
  p53: "突变型",
  wt1: "阳性",
};

export const DEFAULT_MOLECULAR: NactMolecularData = {
  hrdStatus: "unknown",
  brca: "unknown",
};

export function createEmptyCase(patientId?: string): NactCase {
  const id = `case_${Date.now()}`;
  return {
    id,
    createdAt: new Date().toISOString(),
    status: "draft",
    clinical: {
      ...DEFAULT_CLINICAL,
      patientId: patientId ?? `OV-NACT-${id.slice(-6)}`,
    },
    imaging: { linked: false },
    pathology: { ...DEFAULT_PATHOLOGY },
    molecular: { ...DEFAULT_MOLECULAR },
  };
}
