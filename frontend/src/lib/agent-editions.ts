/**
 * MedNexus 科研平台 — 仅科研版（学生）与药企版
 * 临床诊疗模块已拆至独立院方 MVP，不在此平台展示
 */

export type AgentEdition = "research" | "pharma";

export type FeatureKey =
  // 科研 / 学生版
  | "research_home"
  | "case_records"
  | "multi_omics"
  | "navigator"
  | "literature_understanding"
  | "research_pipeline"
  | "compute_analysis"
  | "produce_report"
  | "research_training"
  // 药企版
  | "pharma_home"
  | "cohort_enrichment"
  | "patient_stratification"
  | "biomarker_discovery"
  | "target_discovery"
  // 共享
  | "imaging_omics"
  | "genomics_omics"
  | "nact_multimodal"
  | "literature_library"
  | "knowledge_base"
  | "apps_tools"
  | "skills_plaza";

export const AGENT_EDITION_STORAGE_KEY = "mednexus_agent_edition";

export const AGENT_EDITION_META: Record<
  AgentEdition,
  {
    label: string;
    shortLabel: string;
    tagline: string;
    description: string;
    homeRoute: string;
    accentClass: string;
  }
> = {
  research: {
    label: "科研版 Agent",
    shortLabel: "科研版",
    tagline: "病例队列 · 多组学 · 科研训练",
    description: "关联患者病例、单病例浏览、多选进入多组学分析（ML / 影像 / 基因组）与读算做科研流水线。",
    homeRoute: "/",
    accentClass: "from-violet-500 to-indigo-600",
  },
  pharma: {
    label: "药企版 Agent",
    shortLabel: "药企版",
    tagline: "富集分层 · 标志物 · 靶点发现",
    description: "患者富集与分层、生物标志物与靶点挖掘、多组学队列分析与 NACT 预测验证。",
    homeRoute: "/",
    accentClass: "from-emerald-500 to-teal-600",
  },
};

/** 版本 UI 主题 — 科研版紫 / 药企版绿 */
export type EditionTheme = {
  accentClass: string;
  subtitleClass: string;
  navActiveClass: string;
  navIconActive: string;
  btnPrimaryClass: string;
  btnSolidClass: string;
  linkClass: string;
  heroBgClass: string;
  chipClass: string;
  chipRingClass: string;
  switcherActiveClass: string;
  focusRingClass: string;
  fileInputClass: string;
  selectedItemClass: string;
  tabActiveClass: string;
  inputFocusRingClass: string;
  borderSelectedClass: string;
  aiPanelClass: string;
  aiPanelTitleClass: string;
  aiPanelTextClass: string;
  badgeClass: string;
  highlightBoxClass: string;
  accentSolidClass: string;
  accentTextClass: string;
  iconColor: string;
  loaderClass: string;
  dropZoneActiveClass: string;
  dropZoneHoverClass: string;
  uploadIconBgClass: string;
  outlineBtnClass: string;
  listBulletClass: string;
  linkDashedClass: string;
  cardHoverBorderClass: string;
  optionSelectedClass: string;
};

export const EDITION_THEME: Record<AgentEdition, EditionTheme> = {
  research: {
    accentClass: "from-violet-500 to-indigo-600",
    subtitleClass: "text-violet-600",
    navActiveClass: "bg-violet-50 font-medium text-violet-700 ring-1 ring-violet-200/80",
    navIconActive: "#7c3aed",
    btnPrimaryClass: "bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90",
    btnSolidClass: "bg-violet-600 hover:bg-violet-700",
    linkClass: "text-violet-600 hover:text-violet-700",
    heroBgClass: "bg-gradient-to-br from-violet-50 via-white to-indigo-50",
    chipClass: "bg-violet-50 text-violet-800",
    chipRingClass: "ring-violet-100",
    switcherActiveClass: "bg-white text-slate-900 shadow-sm ring-1 ring-violet-200",
    focusRingClass: "focus:ring-violet-200",
    fileInputClass: "file:bg-violet-50 file:text-violet-700",
    selectedItemClass: "bg-violet-50 font-medium text-violet-700 ring-1 ring-violet-200",
    tabActiveClass: "border-b-2 border-violet-500 font-medium text-violet-600",
    inputFocusRingClass: "focus:ring-violet-400",
    borderSelectedClass: "border-violet-200 bg-white ring-1 ring-violet-100",
    aiPanelClass: "border-violet-200 bg-violet-50/60",
    aiPanelTitleClass: "text-violet-900",
    aiPanelTextClass: "text-violet-950",
    badgeClass: "bg-violet-100 text-violet-700",
    highlightBoxClass: "border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50",
    accentSolidClass: "bg-violet-500",
    accentTextClass: "text-violet-600",
    iconColor: "#7c3aed",
    loaderClass: "text-violet-500",
    dropZoneActiveClass: "border-violet-400 bg-violet-50/50",
    dropZoneHoverClass: "hover:border-violet-300",
    uploadIconBgClass: "bg-violet-50 text-violet-600",
    outlineBtnClass: "border border-violet-200 bg-white px-4 py-2 text-xs text-violet-700 hover:bg-violet-50",
    listBulletClass: "text-violet-500",
    linkDashedClass: "border-dashed border-violet-200 text-violet-600 hover:bg-violet-50",
    cardHoverBorderClass: "hover:border-violet-200",
    optionSelectedClass: "border-violet-300 bg-violet-50",
  },
  pharma: {
    accentClass: "from-emerald-500 to-teal-600",
    subtitleClass: "text-emerald-600",
    navActiveClass: "bg-emerald-50 font-medium text-emerald-700 ring-1 ring-emerald-200/80",
    navIconActive: "#059669",
    btnPrimaryClass: "bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90",
    btnSolidClass: "bg-emerald-600 hover:bg-emerald-700",
    linkClass: "text-emerald-600 hover:text-emerald-700",
    heroBgClass: "bg-gradient-to-br from-emerald-50 via-white to-teal-50",
    chipClass: "bg-emerald-50 text-emerald-800",
    chipRingClass: "ring-emerald-100",
    switcherActiveClass: "bg-white text-slate-900 shadow-sm ring-1 ring-emerald-200",
    focusRingClass: "focus:ring-emerald-200",
    fileInputClass: "file:bg-emerald-50 file:text-emerald-700",
    selectedItemClass: "bg-emerald-50 font-medium text-emerald-700 ring-1 ring-emerald-200",
    tabActiveClass: "border-b-2 border-emerald-500 font-medium text-emerald-600",
    inputFocusRingClass: "focus:ring-emerald-400",
    borderSelectedClass: "border-emerald-200 bg-white ring-1 ring-emerald-100",
    aiPanelClass: "border-emerald-200 bg-emerald-50/60",
    aiPanelTitleClass: "text-emerald-900",
    aiPanelTextClass: "text-emerald-950",
    badgeClass: "bg-emerald-100 text-emerald-700",
    highlightBoxClass: "border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50",
    accentSolidClass: "bg-emerald-500",
    accentTextClass: "text-emerald-600",
    iconColor: "#059669",
    loaderClass: "text-emerald-500",
    dropZoneActiveClass: "border-emerald-400 bg-emerald-50/50",
    dropZoneHoverClass: "hover:border-emerald-300",
    uploadIconBgClass: "bg-emerald-50 text-emerald-600",
    outlineBtnClass: "border border-emerald-200 bg-white px-4 py-2 text-xs text-emerald-700 hover:bg-emerald-50",
    listBulletClass: "text-emerald-500",
    linkDashedClass: "border-dashed border-emerald-200 text-emerald-600 hover:bg-emerald-50",
    cardHoverBorderClass: "hover:border-emerald-200",
    optionSelectedClass: "border-emerald-300 bg-emerald-50",
  },
};

export function getEditionTheme(edition: AgentEdition): EditionTheme {
  return EDITION_THEME[edition];
}

export const EDITION_FEATURES: Record<AgentEdition, readonly FeatureKey[]> = {
  research: [
    "research_home",
    "case_records",
    "multi_omics",
    "navigator",
    "literature_understanding",
    "research_pipeline",
    "compute_analysis",
    "produce_report",
    "research_training",
    "imaging_omics",
    "genomics_omics",
    "literature_library",
    "knowledge_base",
    "apps_tools",
    "skills_plaza",
  ],
  pharma: [
    "pharma_home",
    "cohort_enrichment",
    "patient_stratification",
    "biomarker_discovery",
    "target_discovery",
    "multi_omics",
    "case_records",
    "imaging_omics",
    "genomics_omics",
    "nact_multimodal",
    "compute_analysis",
    "literature_understanding",
    "literature_library",
    "knowledge_base",
    "research_pipeline",
    "produce_report",
    "skills_plaza",
  ],
};

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  research_home: "科研工作台",
  case_records: "病例浏览",
  multi_omics: "多组学分析",
  navigator: "科学导航",
  literature_understanding: "文献理解",
  research_pipeline: "深度研究流水线",
  compute_analysis: "算 · 数据分析",
  produce_report: "做 · 科研产出",
  research_training: "科研训练",
  pharma_home: "药企工作台",
  cohort_enrichment: "队列富集",
  patient_stratification: "患者分层",
  biomarker_discovery: "标志物发现",
  target_discovery: "靶点发现",
  imaging_omics: "影像组学",
  genomics_omics: "基因组组学",
  nact_multimodal: "NACT 多模态",
  literature_library: "文献库",
  knowledge_base: "知识库",
  apps_tools: "Apps 工具",
  skills_plaza: "Skill 广场",
};

export const ROUTE_FEATURES: Record<string, FeatureKey> = {
  "/": "research_home",
  "/navigator": "navigator",
  "/research": "research_pipeline",
  "/read": "literature_understanding",
  "/compute": "compute_analysis",
  "/produce": "produce_report",
  "/cases": "case_records",
  "/omics": "multi_omics",
  "/imaging": "imaging_omics",
  "/genomics": "genomics_omics",
  "/stratification": "patient_stratification",
  "/biomarkers": "biomarker_discovery",
  "/targets": "target_discovery",
  "/clinical/nact-ovarian": "nact_multimodal",
  "/clinical/genomics": "genomics_omics",
  "/apps": "apps_tools",
  "/knowledge": "knowledge_base",
};

/** 药企版首页路由复用 /，用 feature 映射到 pharma_home */
export function routeFeatureForEdition(pathname: string, edition: AgentEdition): FeatureKey | null {
  if (pathname === "/" || pathname === "") {
    return edition === "pharma" ? "pharma_home" : "research_home";
  }
  const entry = Object.entries(ROUTE_FEATURES).find(([route]) =>
    route === "/" ? pathname === "/" : pathname.startsWith(route)
  );
  return entry ? entry[1] : null;
}

export function resolveAgentEdition(): AgentEdition {
  const normalize = (v: string | null | undefined): AgentEdition | null => {
    if (v === "pharma") return "pharma";
    if (v === "research" || v === "hospital") return "research";
    return null;
  };
  if (typeof window === "undefined") {
    return normalize(process.env.NEXT_PUBLIC_AGENT_EDITION?.trim()) ?? "research";
  }
  return (
    normalize(localStorage.getItem(AGENT_EDITION_STORAGE_KEY)) ??
    normalize(process.env.NEXT_PUBLIC_AGENT_EDITION?.trim()) ??
    "research"
  );
}

export function canAccessFeature(edition: AgentEdition, feature: FeatureKey): boolean {
  if (feature === "research_home" && edition === "pharma") return false;
  if (feature === "pharma_home" && edition === "research") return false;
  return EDITION_FEATURES[edition].includes(feature);
}

export function canAccessRoute(edition: AgentEdition, pathname: string): boolean {
  const feature = routeFeatureForEdition(pathname, edition);
  if (!feature) return true;
  if (pathname === "/") {
    return edition === "pharma"
      ? canAccessFeature(edition, "pharma_home")
      : canAccessFeature(edition, "research_home");
  }
  return canAccessFeature(edition, feature);
}

export function featureForRoute(pathname: string): FeatureKey | null {
  return routeFeatureForEdition(pathname, "research");
}

export function editionForFeature(feature: FeatureKey): AgentEdition[] {
  return (Object.keys(EDITION_FEATURES) as AgentEdition[]).filter((e) =>
    canAccessFeature(e, feature)
  );
}
