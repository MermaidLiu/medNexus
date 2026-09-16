/**
 * clinical-diagnosis MVP — Agent 版本与面板权限
 * 默认医院版；部署科研/药企试用时可改 NEXT_PUBLIC_AGENT_EDITION
 */

export type AgentEdition = "hospital" | "research" | "pharma";

export type FeatureKey =
  | "preconsult"
  | "patient_management"
  | "diagnosis_workflow"
  | "clinical_decision"
  | "in_hospital_structuring"
  | "mdt"
  | "guidelines_clinical"
  | "miniprogram"
  | "literature_library"
  | "nact_multimodal"
  | "cohort_research"
  | "skills_plaza";

export type SidebarPanel =
  | "workflow"
  | "patients"
  | "diagnoses"
  | "literature"
  | "guidelines"
  | "nact"
  | "research"
  | "mdt";

export const AGENT_EDITION_STORAGE_KEY = "mednexus_agent_edition";

export const AGENT_EDITION_META: Record<
  AgentEdition,
  { label: string; shortLabel: string; tagline: string; defaultPanel: SidebarPanel }
> = {
  hospital: {
    label: "医院版 Agent",
    shortLabel: "医院版",
    tagline: "预问诊 · 患者管理 · 临床决策",
    defaultPanel: "workflow",
  },
  research: {
    label: "科研版 Agent",
    shortLabel: "科研版",
    tagline: "文献理解 · 科研队列",
    defaultPanel: "literature",
  },
  pharma: {
    label: "药企版 Agent",
    shortLabel: "药企版",
    tagline: "富集分层 · 队列挖掘",
    defaultPanel: "research",
  },
};

export const EDITION_FEATURES: Record<AgentEdition, readonly FeatureKey[]> = {
  hospital: [
    "preconsult",
    "patient_management",
    "diagnosis_workflow",
    "clinical_decision",
    "in_hospital_structuring",
    "mdt",
    "guidelines_clinical",
    "miniprogram",
    "literature_library",
    "nact_multimodal",
    "cohort_research",
    "skills_plaza",
  ],
  research: ["literature_library", "nact_multimodal", "cohort_research", "skills_plaza"],
  pharma: ["cohort_research", "nact_multimodal", "literature_library", "skills_plaza"],
};

export const PANEL_FEATURES: Record<SidebarPanel | "skill", FeatureKey | FeatureKey[]> = {
  workflow: "diagnosis_workflow",
  patients: "patient_management",
  diagnoses: "patient_management",
  literature: "literature_library",
  guidelines: "guidelines_clinical",
  nact: "nact_multimodal",
  research: ["in_hospital_structuring", "cohort_research"],
  mdt: "mdt",
  skill: "skills_plaza",
};

export function resolveAgentEdition(): AgentEdition {
  if (typeof window === "undefined") {
    const env = process.env.NEXT_PUBLIC_AGENT_EDITION?.trim();
    if (env === "hospital" || env === "research" || env === "pharma") return env;
    return "hospital";
  }
  const stored = localStorage.getItem(AGENT_EDITION_STORAGE_KEY);
  if (stored === "hospital" || stored === "research" || stored === "pharma") return stored;
  const env = process.env.NEXT_PUBLIC_AGENT_EDITION?.trim();
  if (env === "hospital" || env === "research" || env === "pharma") return env;
  return "hospital";
}

export function canAccessFeature(edition: AgentEdition, feature: FeatureKey): boolean {
  return EDITION_FEATURES[edition].includes(feature);
}

export function canAccessPanel(edition: AgentEdition, panel: SidebarPanel | "skill"): boolean {
  const feature = PANEL_FEATURES[panel];
  if (Array.isArray(feature)) {
    return feature.some((f) => canAccessFeature(edition, f));
  }
  return canAccessFeature(edition, feature);
}
