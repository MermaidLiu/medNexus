/** 左侧导航 — 妇科肿瘤-卵巢癌 医生工作站 */

import type { SidebarIconName } from "@/components/IconFont";

export const SKILL_PLAZA_URL = "http://122.51.204.136/mland";

export const SITE_BRAND = {
  title: "妇科肿瘤-卵巢癌",
  subtitle: "AI 辅助诊疗工作站",
} as const;

import type { FeatureKey, SidebarPanel } from "@/lib/agent-editions";

export type { SidebarPanel };

export type NavItem = {
  id: SidebarPanel | "skill";
  label: string;
  icon: SidebarIconName;
  external?: string;
  desc?: string;
  feature?: FeatureKey;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export const SIDEBAR_NAV: NavGroup[] = [
  {
    title: "临床诊疗",
    items: [
      { id: "workflow", label: "AI 辅助诊断", icon: "diagnosis", desc: "六步诊断流程", feature: "diagnosis_workflow" },
      { id: "patients", label: "我的患者", icon: "users", desc: "绑定与管理患者", feature: "patient_management" },
      { id: "diagnoses", label: "我的诊断", icon: "file", desc: "历史 AI 诊断记录", feature: "patient_management" },
    ],
  },
  {
    title: "临床 · 科研",
    items: [
      { id: "literature", label: "文献收录", icon: "book", desc: "卵巢癌核心文献库", feature: "literature_library" },
      { id: "guidelines", label: "指南与证据", icon: "guide", desc: "NCCN / ESMO 速查", feature: "guidelines_clinical" },
      { id: "nact", label: "NACT 与分期", icon: "experiment", desc: "新辅助 / FIGO 参考", feature: "nact_multimodal" },
      { id: "research", label: "科研队列", icon: "chart", desc: "队列与组学数据", feature: "cohort_research" },
      { id: "mdt", label: "MDT 病例讨论", icon: "message", desc: "多学科会诊备忘", feature: "mdt" },
    ],
  },
  {
    title: "资源",
    items: [
      { id: "skill", label: "我的 Skill", icon: "skill", external: SKILL_PLAZA_URL, desc: "医疗 Skill 广场", feature: "skills_plaza" },
    ],
  },
];

/** 卵巢癌核心文献 — 可扩展 */
export const CORE_LITERATURE = [
  {
    id: "solo1",
    title: "SOLO-1: Olaparib maintenance in BRCA-mutated ovarian cancer",
    journal: "NEJM 2018",
    tags: ["PARP", "维持治疗", "BRCA"],
    pmid: "30325955",
  },
  {
    id: "paola1",
    title: "PAOLA-1: Olaparib + Bevacizumab first-line maintenance",
    journal: "NEJM 2019",
    tags: ["PARP", "贝伐", "一线维持"],
    pmid: "31851799",
  },
  {
    id: "icon7",
    title: "ICON-7: Bevacizumab in ovarian cancer",
    journal: "NEJM 2011",
    tags: ["贝伐", "一线"],
    pmid: "22203703",
  },
  {
    id: "chorus",
    title: "CHORUS: Neoadjuvant chemotherapy vs primary surgery",
    journal: "Lancet 2015",
    tags: ["NACT", "手术时机"],
    pmid: "26197741",
  },
  {
    id: "keystone",
    title: "KEYNOTE-826: Pembrolizumab + chemo in cervical cancer",
    journal: "NEJM 2021",
    tags: ["免疫", "宫颈癌"],
    pmid: "34553496",
  },
];

export const LITERATURE_SAVE_KEY = "ovarian_literature_saved";
