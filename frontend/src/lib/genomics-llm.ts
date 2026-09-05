import type { GenomicsCase, GenomicsInterpretation } from "./genomics-types";
import { interpretGenomicsRules } from "./genomics-interpret";

const SYSTEM_PROMPT = `你是妇科肿瘤基因组学 MDT 助手，擅长整合多源测序数据（胚系、WES、Panel、ctDNA、RNA-seq、HRD）。

根据用户提供的病例与变异表，输出严格 JSON（不要 markdown）：
{
  "hrdConsensus": "HRD 综合结论（中文）",
  "brcaStatus": "BRCA/同源重组相关结论",
  "parpEligible": true/false,
  "parpRationale": "PARP 适用性依据",
  "immunotherapyHint": "免疫治疗相关提示（可选）",
  "conflicts": ["多源不一致或需复核点"],
  "recommendations": ["MDT 建议条目，3-5条"],
  "reasoning": "3-5句融合推理过程"
}

注意：标注 ctDNA 与组织检出的 VAF 差异；提及 NCCN 卵巢癌 PARP/铂类策略；冲突项要具体。`;

export function buildGenomicsUserPrompt(caseData: GenomicsCase): string {
  const sources = caseData.sources
    .filter((s) => s.linked)
    .map((s) => `- ${s.label}（${s.platform}，${s.sampleDate ?? "日期待补"}，质控 ${s.quality ?? "—"}）`)
    .join("\n");

  const variants = caseData.variants
    .map(
      (v) =>
        `- ${v.gene} ${v.alteration}${v.vaf != null ? ` VAF ${v.vaf}%` : ""} · ${v.tier ?? "—"} · 来源 [${v.sources.join(", ")}]${v.conflict ? " ⚠冲突" : ""}${v.therapy ? ` · 治疗: ${v.therapy}` : ""}`
    )
    .join("\n");

  return [
    "## 病例",
    `- ID: ${caseData.patientId}`,
    `- 诊断: ${caseData.diagnosis} · ${caseData.figoStage} · ${caseData.histology}`,
    `- HRD: ${caseData.hrdStatus ?? "unknown"}${caseData.hrdScore != null ? ` (${caseData.hrdScore})` : ""}`,
    `- TMB: ${caseData.tmb ?? "—"} · MSI: ${caseData.msi ?? "—"}`,
    "",
    "## 已关联数据源",
    sources || "（无）",
    "",
    "## 变异整合表",
    variants || "（无）",
    "",
    "请给出多源基因组融合解读与 MDT 建议。",
  ].join("\n");
}

export function parseLlmInterpretation(
  raw: unknown,
  fallback: GenomicsInterpretation
): GenomicsInterpretation {
  let data: Record<string, unknown>;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return { ...fallback, reasoning: raw.slice(0, 500), source: "llm" };
    }
  } else if (raw && typeof raw === "object") {
    data = raw as Record<string, unknown>;
  } else {
    return fallback;
  }

  return {
    hrdConsensus: String(data.hrdConsensus ?? fallback.hrdConsensus),
    brcaStatus: String(data.brcaStatus ?? fallback.brcaStatus),
    parpEligible: typeof data.parpEligible === "boolean" ? data.parpEligible : fallback.parpEligible,
    parpRationale: String(data.parpRationale ?? fallback.parpRationale),
    immunotherapyHint: data.immunotherapyHint
      ? String(data.immunotherapyHint)
      : fallback.immunotherapyHint,
    conflicts: Array.isArray(data.conflicts)
      ? data.conflicts.map(String).slice(0, 5)
      : fallback.conflicts,
    recommendations: Array.isArray(data.recommendations)
      ? data.recommendations.map(String).slice(0, 6)
      : fallback.recommendations,
    reasoning: String(data.reasoning ?? fallback.reasoning),
    source: "llm",
  };
}

export { SYSTEM_PROMPT, interpretGenomicsRules as rulesFallback };
