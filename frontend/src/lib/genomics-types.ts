/** 基因组多源数据 — 病例与变异整合类型 */

export type GenomicsCaseStatus = "draft" | "ready" | "analyzing" | "done";

export type DataSourceId =
  | "germline"
  | "tumor_wes"
  | "panel"
  | "ctdna"
  | "rnaseq"
  | "hrd";

export interface GenomicsSourceMeta {
  id: DataSourceId;
  label: string;
  platform: string;
  sampleDate?: string;
  linked: boolean;
  quality?: "优" | "良" | "待复核";
}

export interface GenomicVariant {
  gene: string;
  alteration: string;
  vaf?: number;
  tier?: "I" | "II" | "III" | "VUS";
  sources: DataSourceId[];
  clinicalSignificance?: string;
  therapy?: string;
  conflict?: boolean;
}

export interface GenomicsCase {
  id: string;
  createdAt: string;
  status: GenomicsCaseStatus;
  patientId: string;
  diagnosis: string;
  figoStage: string;
  histology: string;
  sources: GenomicsSourceMeta[];
  variants: GenomicVariant[];
  hrdScore?: number;
  hrdStatus?: "positive" | "negative" | "unknown";
  tmb?: number;
  msi?: "MSS" | "MSI-H" | "unknown";
}

export interface SourceCoverage {
  sourceId: DataSourceId;
  label: string;
  geneCount: number;
  actionableCount: number;
  linked: boolean;
}

export interface GenomicsInterpretation {
  hrdConsensus: string;
  brcaStatus: string;
  parpEligible: boolean;
  parpRationale: string;
  immunotherapyHint?: string;
  conflicts: string[];
  recommendations: string[];
  reasoning: string;
  source?: "llm" | "rules";
  model?: string;
  warning?: string;
}

export function createEmptyGenomicsCase(patientId?: string): GenomicsCase {
  const id = `gen_${Date.now()}`;
  return {
    id,
    createdAt: new Date().toISOString(),
    status: "draft",
    patientId: patientId ?? `GEN-${id.slice(-6)}`,
    diagnosis: "高级别浆液性卵巢癌",
    figoStage: "IIIC",
    histology: "高级别浆液性癌",
    hrdStatus: "unknown",
    sources: DEFAULT_SOURCES.map((s) => ({ ...s, linked: false })),
    variants: [],
  };
}

export const DEFAULT_SOURCES: Omit<GenomicsSourceMeta, "linked">[] = [
  { id: "germline", label: "胚系检测", platform: "NGS Panel (118 genes)" },
  { id: "tumor_wes", label: "肿瘤 WES", platform: "全外显子 + CNV" },
  { id: "panel", label: "组织 Panel", platform: "FoundationOne CDx" },
  { id: "ctdna", label: "ctDNA", platform: "Guardant360 / 液体活检" },
  { id: "rnaseq", label: "RNA-seq", platform: "转录组 + 融合" },
  { id: "hrd", label: "HRD 评分", platform: "Myriad/myChoice" },
];

export const DEMO_GENOMICS_CASE = (): GenomicsCase => ({
  id: "gen_demo",
  createdAt: new Date().toISOString(),
  status: "ready",
  patientId: "OV-GEN-DEMO",
  diagnosis: "高级别浆液性卵巢癌",
  figoStage: "IIIC",
  histology: "高级别浆液性癌",
  hrdScore: 58,
  hrdStatus: "positive",
  tmb: 6.2,
  msi: "MSS",
  sources: [
    { id: "germline", label: "胚系检测", platform: "NGS Panel (118 genes)", sampleDate: "2025-11-02", linked: true, quality: "优" },
    { id: "tumor_wes", label: "肿瘤 WES", platform: "全外显子 + CNV", sampleDate: "2025-11-08", linked: true, quality: "良" },
    { id: "panel", label: "组织 Panel", platform: "FoundationOne CDx", sampleDate: "2025-11-10", linked: true, quality: "优" },
    { id: "ctdna", label: "ctDNA", platform: "Guardant360", sampleDate: "2026-01-15", linked: true, quality: "良" },
    { id: "rnaseq", label: "RNA-seq", platform: "转录组 + 融合", sampleDate: "2025-11-12", linked: true, quality: "优" },
    { id: "hrd", label: "HRD 评分", platform: "myChoice CDx", sampleDate: "2025-11-10", linked: true, quality: "优" },
  ],
  variants: [
    {
      gene: "BRCA1",
      alteration: "c.5266dupC (p.Gln1756Profs*74)",
      vaf: 42,
      tier: "I",
      sources: ["germline", "tumor_wes", "panel", "ctdna"],
      clinicalSignificance: "致病性胚系 + 体细胞二次打击",
      therapy: "PARP 抑制剂（奥拉帕利/尼拉帕利）",
    },
    {
      gene: "TP53",
      alteration: "p.R273H",
      vaf: 78,
      tier: "II",
      sources: ["tumor_wes", "panel", "ctdna"],
      clinicalSignificance: "HGSOC 典型驱动",
    },
    {
      gene: "CCNE1",
      alteration: "扩增 (8 copies)",
      tier: "II",
      sources: ["tumor_wes", "panel"],
      clinicalSignificance: "HRD 阴性亚型相关",
      conflict: true,
    },
    {
      gene: "RAD51C",
      alteration: "VUS c.905G>A",
      tier: "VUS",
      sources: ["germline"],
      clinicalSignificance: "意义未明，建议家系验证",
    },
    {
      gene: "HRD",
      alteration: "GIS 58 / LOH 高",
      tier: "I",
      sources: ["hrd", "panel"],
      clinicalSignificance: "HRD 阳性",
      therapy: "铂敏感 + PARP 维持",
    },
  ],
});
