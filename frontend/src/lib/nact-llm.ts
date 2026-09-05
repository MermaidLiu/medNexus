import type { NactCase, NactPrediction, PredictionFactor } from "./nact-types";

const SYSTEM_PROMPT = `你是妇科肿瘤 MDT 决策助手，专精高级别浆液性卵巢癌 NACT（新辅助化疗）多模态评估。

根据用户提供的临床、影像 PCI、病理、分子数据，输出严格 JSON（不要 markdown），字段如下：
{
  "sensitivityProb": 0-100 的整数（NACT 化疗敏感概率）,
  "sensitivityLabel": "敏感" | "不确定" | "耐药倾向",
  "r0Prob": 0-100 的整数（理想减瘤 R0 或残留≤1cm 概率）,
  "r0Label": "理想减瘤可能" | "需 MDT 讨论" | "减瘤难度高",
  "recommendation": "2-4 句中文 MDT 建议，面向主任汇报，专业但简洁",
  "reasoning": "3-5 句中文推理过程，说明如何综合四模态得出判断",
  "factors": [
    { "name": "因子名", "contribution": -30到30整数, "direction": "positive"|"negative"|"neutral", "detail": "一句话依据" }
  ],
  "modalityScores": { "clinical": 0-100, "imaging": 0-100, "pathology": 0-100, "molecular": 0-100 }
}

评估要点（参考 NCCN/ESMO）：
- CA125 下降 ≥50% 提示化疗敏感；PCI ≤10 减瘤条件较好，>20 难度显著增加
- HRD+/BRCA 突变通常对铂类及 PARP 更敏感
- 结合 FIGO 分期、腹水、ECOG、NACT 周期数综合判断
- factors 列出 4-6 条最关键决策因子，按 |contribution| 降序`;

export function buildNactUserPrompt(caseData: NactCase): string {
  const { clinical, imaging, pathology, molecular } = caseData;
  const ca125Drop =
    clinical.ca125Baseline && clinical.ca125Mid
      ? `${(((clinical.ca125Baseline - clinical.ca125Mid) / clinical.ca125Baseline) * 100).toFixed(0)}%`
      : "未提供";

  return [
    "## 临床",
    `- 病例 ID: ${clinical.patientId}`,
    `- 年龄: ${clinical.age ?? "未知"}`,
    `- FIGO: ${clinical.figoStage}`,
    `- 组织学: ${clinical.histology}`,
    `- ECOG: ${clinical.ecog}`,
    `- 腹水: ${clinical.ascites}`,
    `- CA125 基线/中期: ${clinical.ca125Baseline ?? "—"} / ${clinical.ca125Mid ?? "—"} U/mL（下降 ${ca125Drop}）`,
    `- NACT: ${clinical.nactRegimen}，已完成 ${clinical.nactCyclesDone}/${clinical.nactCyclesPlanned} 周期`,
    "",
    "## 影像",
    imaging.linked
      ? `- 已关联 CT+PCI，PCI 总分 ${imaging.pciScore ?? "未知"}，层数 ${imaging.ctCount ?? "—"}`
      : "- 未关联影像 PCI（请基于临床/病理/分子推断，并在 factors 中注明影像缺失）",
    "",
    "## 病理",
    `- 分级 ${pathology.grade}，p53 ${pathology.p53}，WT1 ${pathology.wt1}${pathology.ki67 != null ? `，Ki67 ${pathology.ki67}%` : ""}`,
    "",
    "## 分子",
    `- HRD ${molecular.hrdStatus}${molecular.hrdScore != null ? `（评分 ${molecular.hrdScore}）` : ""}，BRCA ${molecular.brca}`,
    "",
    "请给出 NACT 敏感性与减瘤术转归预测。",
  ].join("\n");
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function toProb(v: unknown, fallback: number): number {
  if (typeof v === "number" && !Number.isNaN(v)) return clamp(v, 5, 95);
  if (typeof v === "string") {
    const m = v.match(/\d+/);
    if (m) return clamp(Number(m[0]), 5, 95);
    if (/高|good|high|敏感/i.test(v)) return 75;
    if (/低|poor|low|耐药/i.test(v)) return 25;
    if (/中|moderate|不确定/i.test(v)) return 50;
  }
  return fallback;
}

function pickLabel<T extends string>(v: unknown, allowed: T[], fallback: T): T {
  if (typeof v === "string" && allowed.includes(v as T)) return v as T;
  return fallback;
}

function normalizeFactor(raw: unknown): PredictionFactor | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const name = String(o.name ?? "").trim();
  if (!name) return null;
  const direction = pickLabel(o.direction, ["positive", "negative", "neutral"] as const, "neutral");
  let contribution = typeof o.contribution === "number" ? o.contribution : 0;
  if (typeof o.contribution === "string") {
    const m = o.contribution.match(/-?\d+/);
    contribution = m ? Number(m[0]) : 0;
  }
  return {
    name,
    contribution: clamp(contribution, -30, 30),
    direction,
    detail: String(o.detail ?? ""),
  };
}

export function parseLlmPrediction(raw: unknown, fallback: NactPrediction): NactPrediction {
  let data: Record<string, unknown>;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return { ...fallback, source: "llm", reasoning: raw.slice(0, 500) };
    }
  } else if (raw && typeof raw === "object") {
    data = raw as Record<string, unknown>;
  } else {
    return fallback;
  }

  const sensitivityProb = toProb(data.sensitivityProb, fallback.sensitivityProb);
  const r0Prob = toProb(data.r0Prob, fallback.r0Prob);

  const sensitivityLabel = pickLabel(
    data.sensitivityLabel,
    ["敏感", "不确定", "耐药倾向"] as const,
    sensitivityProb >= 65 ? "敏感" : sensitivityProb >= 40 ? "不确定" : "耐药倾向"
  );

  const r0Label = pickLabel(
    data.r0Label,
    ["理想减瘤可能", "需 MDT 讨论", "减瘤难度高"] as const,
    r0Prob >= 60 ? "理想减瘤可能" : r0Prob >= 35 ? "需 MDT 讨论" : "减瘤难度高"
  );

  const ms = (data.modalityScores as Record<string, unknown>) ?? {};
  const modalityScores = {
    clinical: clamp(toProb(ms.clinical, fallback.modalityScores.clinical), 0, 100),
    imaging: clamp(toProb(ms.imaging, fallback.modalityScores.imaging), 0, 100),
    pathology: clamp(toProb(ms.pathology, fallback.modalityScores.pathology), 0, 100),
    molecular: clamp(toProb(ms.molecular, fallback.modalityScores.molecular), 0, 100),
  };

  const factors = Array.isArray(data.factors)
    ? data.factors.map(normalizeFactor).filter(Boolean) as PredictionFactor[]
    : fallback.factors;

  factors.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  return {
    sensitivityProb,
    sensitivityLabel,
    r0Prob,
    r0Label,
    recommendation: String(data.recommendation ?? fallback.recommendation),
    reasoning: String(data.reasoning ?? ""),
    factors: factors.slice(0, 6),
    modalityScores,
    source: "llm",
    model: typeof data.model === "string" ? data.model : undefined,
  };
}

export { SYSTEM_PROMPT };
