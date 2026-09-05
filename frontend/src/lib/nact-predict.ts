import type { NactCase, NactPrediction, PredictionFactor } from "./nact-types";

/** M1 规则评分卡 — 后续可替换为真实模型 API */
export function predictNactOutcome(caseData: NactCase): NactPrediction {
  const { clinical, imaging, pathology, molecular } = caseData;

  let clinicalScore = 50;
  const factors: PredictionFactor[] = [];

  if (clinical.ca125Baseline && clinical.ca125Mid) {
    const drop = (clinical.ca125Baseline - clinical.ca125Mid) / clinical.ca125Baseline;
    if (drop >= 0.5) {
      clinicalScore += 25;
      factors.push({
        name: "CA125 下降≥50%",
        contribution: 25,
        direction: "positive",
        detail: `下降 ${(drop * 100).toFixed(0)}%`,
      });
    } else if (drop >= 0.3) {
      clinicalScore += 10;
      factors.push({
        name: "CA125 部分下降",
        contribution: 10,
        direction: "neutral",
        detail: `下降 ${(drop * 100).toFixed(0)}%`,
      });
    } else {
      clinicalScore -= 15;
      factors.push({
        name: "CA125 下降不足",
        contribution: -15,
        direction: "negative",
        detail: `下降 ${(drop * 100).toFixed(0)}%`,
      });
    }
  }

  if (clinical.nactCyclesDone >= 3) {
    clinicalScore += 5;
    factors.push({
      name: "NACT ≥3 周期",
      contribution: 5,
      direction: "positive",
      detail: `${clinical.nactCyclesDone}/${clinical.nactCyclesPlanned} 周期`,
    });
  }

  if (clinical.ascites === "severe") {
    clinicalScore -= 10;
    factors.push({
      name: "大量腹水",
      contribution: -10,
      direction: "negative",
      detail: "手术难度增加",
    });
  }

  let imagingScore = 40;
  if (imaging.linked && imaging.pciScore != null) {
    if (imaging.pciScore <= 10) {
      imagingScore += 30;
      factors.push({
        name: "PCI 负荷较低",
        contribution: 30,
        direction: "positive",
        detail: `PCI ${imaging.pciScore}`,
      });
    } else if (imaging.pciScore <= 20) {
      imagingScore += 10;
      factors.push({
        name: "PCI 中等",
        contribution: 10,
        direction: "neutral",
        detail: `PCI ${imaging.pciScore}`,
      });
    } else {
      imagingScore -= 15;
      factors.push({
        name: "PCI 负荷偏高",
        contribution: -15,
        direction: "negative",
        detail: `PCI ${imaging.pciScore}`,
      });
    }
  } else {
    factors.push({
      name: "未关联影像",
      contribution: 0,
      direction: "neutral",
      detail: "建议上传 CT 并完成 PCI 分析",
    });
  }

  let pathologyScore = 50;
  if (pathology.grade === "G3") pathologyScore -= 5;

  let molecularScore = 50;
  if (molecular.hrdStatus === "positive" || molecular.brca === "mutated") {
    molecularScore += 20;
    factors.push({
      name: "HRD/BRCA 阳性",
      contribution: 20,
      direction: "positive",
      detail: "NACT 敏感性较好",
    });
  }

  const stagePenalty = clinical.figoStage.includes("IV") ? -10 : 0;
  if (stagePenalty) {
    clinicalScore += stagePenalty;
    factors.push({
      name: "IV 期",
      contribution: stagePenalty,
      direction: "negative",
      detail: clinical.figoStage,
    });
  }

  const combined =
    clinicalScore * 0.35 +
    imagingScore * 0.3 +
    pathologyScore * 0.15 +
    molecularScore * 0.2;

  const sensitivityProb = Math.max(5, Math.min(95, Math.round(combined)));
  const r0Prob = Math.max(
    5,
    Math.min(92, Math.round(combined * 0.9 - (imaging.pciScore && imaging.pciScore > 20 ? 15 : 0)))
  );

  const sensitivityLabel: NactPrediction["sensitivityLabel"] =
    sensitivityProb >= 65 ? "敏感" : sensitivityProb >= 40 ? "不确定" : "耐药倾向";

  const r0Label: NactPrediction["r0Label"] =
    r0Prob >= 60 ? "理想减瘤可能" : r0Prob >= 35 ? "需 MDT 讨论" : "减瘤难度高";

  let recommendation = "";
  if (sensitivityProb >= 65 && r0Prob >= 55) {
    recommendation =
      "化疗反应良好且肿瘤负荷可控，建议评估中间型减瘤术时机，MDT 讨论 R0 可行性。";
  } else if (sensitivityProb < 40) {
    recommendation =
      "化疗反应欠佳，建议 MDT 复核方案（铂耐药评估 / 换药 / 临床试验）后再决定手术时机。";
  } else if (r0Prob < 35) {
    recommendation =
      "减瘤难度较高，建议继续 NACT 或联合影像 re-staging，重点评估 PCI 变化趋势。";
  } else {
    recommendation =
      "处于灰色地带，建议结合 CA125 曲线、二次 CT（PCI）及 MDT 综合决策。";
  }

  factors.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  return {
    sensitivityProb,
    sensitivityLabel,
    r0Prob,
    r0Label,
    recommendation,
    factors: factors.slice(0, 6),
    modalityScores: {
      clinical: Math.round(clinicalScore),
      imaging: Math.round(imagingScore),
      pathology: Math.round(pathologyScore),
      molecular: Math.round(molecularScore),
    },
  };
}
