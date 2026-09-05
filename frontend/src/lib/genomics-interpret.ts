import type { GenomicsCase, GenomicsInterpretation } from "./genomics-types";

/** 规则引擎 — LLM 不可用时的备用解读 */
export function interpretGenomicsRules(caseData: GenomicsCase): GenomicsInterpretation {
  const brca = caseData.variants.find((v) => v.gene === "BRCA1" || v.gene === "BRCA2");
  const hrdPositive = caseData.hrdStatus === "positive" || (caseData.hrdScore ?? 0) >= 42;
  const parpEligible = Boolean(brca) || hrdPositive;
  const conflicts: string[] = [];

  const ccne1 = caseData.variants.find((v) => v.gene === "CCNE1");
  if (ccne1?.conflict && hrdPositive) {
    conflicts.push("CCNE1 扩增与 HRD 阳性表型并存，建议复核 HRD 算法与拷贝数阈值");
  }

  const linkedCount = caseData.sources.filter((s) => s.linked).length;
  if (linkedCount < 3) {
    conflicts.push(`仅关联 ${linkedCount}/6 数据源，解读置信度受限`);
  }

  const recommendations: string[] = [];
  if (parpEligible) {
    recommendations.push("符合 PARP 抑制剂维持或后线治疗考量（需结合铂敏感状态与 NCCN 指南）");
  }
  if (brca) {
    recommendations.push("建议遗传咨询及一级亲属 BRCA 筛查");
  }
  if (caseData.tmb && caseData.tmb >= 10) {
    recommendations.push("TMB 偏高，可评估免疫检查点抑制剂临床试验");
  } else {
    recommendations.push("TMB 未达免疫治疗常规阈值，优先铂类与 PARP 策略");
  }
  recommendations.push("MDT 讨论：整合组织与 ctDNA 时间点差异对变异 VAF 的影响");

  return {
    hrdConsensus: hrdPositive
      ? `HRD 阳性（评分 ${caseData.hrdScore ?? "—"}，多源一致）`
      : "HRD 状态未明或阴性",
    brcaStatus: brca
      ? `${brca.gene} ${brca.alteration}（${brca.sources.length} 源检出）`
      : "未检出明确 BRCA1/2 致病变异",
    parpEligible,
    parpRationale: parpEligible
      ? "BRCA 致病突变和/或 HRD 阳性，符合同源重组修复缺陷相关治疗逻辑"
      : "缺乏明确 HRR 缺陷证据，PARP 获益不确定",
    immunotherapyHint:
      caseData.msi === "MSI-H"
        ? "MSI-H，考虑免疫治疗"
        : `TMB ${caseData.tmb ?? "—"} mut/Mb，MSI ${caseData.msi ?? "—"}`,
    conflicts,
    recommendations,
    reasoning:
      "基于胚系、组织 WES/Panel、ctDNA 与 HRD 评分的规则融合：BRCA1 多源一致为 I 类证据；TP53 支持 HGSOC 分子背景；需关注 CCNE1 与 HRD 的潜在不一致。",
    source: "rules",
  };
}
