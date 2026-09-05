"""Extract structured PICO from a natural-language research topic."""

from __future__ import annotations

import json
import logging
import re

from app.config import settings
from app.models.research import PICO

logger = logging.getLogger(__name__)


def plan_research_question(topic: str) -> dict:
    """Return PICO + study design + refined research question."""
    if settings.openai_api_key:
        try:
            return _plan_with_llm(topic)
        except Exception as exc:
            logger.warning("LLM planning failed, using rules: %s", exc)

    return _plan_with_rules(topic)


def _plan_with_llm(topic: str) -> dict:
    from app.llm import get_llm_client

    client = get_llm_client()
    response = client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a gynecologic oncology clinical epidemiologist specializing in "
                    "ovarian, cervical, and endometrial cancers. Given a research topic, output JSON with keys: "
                    "refined_question, pico (population, intervention, comparator, outcome, study_design), "
                    "rationale, suggested_analysis. Use standard oncology endpoints (PFS, OS, ORR, DoR) and "
                    "FIGO staging when relevant."
                ),
            },
            {"role": "user", "content": topic},
        ],
        response_format={"type": "json_object"},
        temperature=0.2,
    )
    content = response.choices[0].message.content or "{}"
    data = json.loads(content)
    pico_data = data.get("pico", {})
    pico = PICO(
        population=pico_data.get("population", ""),
        intervention=pico_data.get("intervention", ""),
        comparator=pico_data.get("comparator", ""),
        outcome=pico_data.get("outcome", ""),
        study_design=pico_data.get("study_design", "retrospective cohort study"),
    )
    return {
        "refined_question": data.get("refined_question", topic),
        "pico": pico.model_dump(),
        "rationale": data.get("rationale", ""),
        "suggested_analysis": data.get("suggested_analysis", ""),
        "source": "llm",
    }


def _plan_with_rules(topic: str) -> dict:
    """Rule-based PICO extraction for demo / offline mode."""
    lower = topic.lower()

    population = _match(
        lower,
        [
            (r"卵巢癌|ovarian", "铂敏感/复发性上皮性卵巢癌患者（FIGO III-IV期）"),
            (r"宫颈癌|cervical", "持续性/复发/转移性宫颈癌患者"),
            (r"子宫内膜|endometrial", "晚期/复发性子宫内膜癌患者"),
            (r"gtn|滋养", "妊娠滋养细胞肿瘤（GTN）患者"),
            (r"cancer|tumor|肿瘤", "妇科恶性肿瘤患者"),
        ],
        default="妇科肿瘤患者（符合研究纳入标准）",
    )

    intervention = _match(
        lower,
        [
            (r"parp|奥拉帕利|olaparib|尼拉帕利", "PARP抑制剂（奥拉帕利/尼拉帕利/卢卡帕利）"),
            (r"pd-?1|帕博利珠|pembrolizumab|免疫", "PD-1/PD-L1 免疫检查点抑制剂"),
            (r"贝伐|bevacizumab", "贝伐珠单抗"),
            (r"化疗|carboplatin|paclitaxel", "含铂双药化疗方案"),
            (r"维持治疗", "一线维持治疗（PARP抑制剂或贝伐珠单抗）"),
        ],
        default=_extract_drug_mention(topic) or "索引干预措施",
    )

    comparator = _match(
        lower,
        [(r"vs\.?|versus|相比|对比", "")],
        default="",
    )
    if "parp" in lower or "奥拉帕利" in topic:
        comparator = comparator or "安慰剂或标准观察"
    elif "pd-1" in lower or "免疫" in topic or "帕博利珠" in topic:
        comparator = comparator or "含铂化疗单药"
    elif not comparator:
        comparator = "标准治疗或活性对照"

    outcome = _match(
        lower,
        [
            (r"pfs|无进展", "无进展生存期（PFS）"),
            (r"os|总生存|生存期", "总生存期（OS）"),
            (r"orr|缓解率", "客观缓解率（ORR）"),
            (r"dor|缓解持续时间", "缓解持续时间（DoR）"),
            (r"复发", "疾病复发或进展"),
        ],
        default="主要肿瘤学终点（PFS 或 OS）",
    )

    pico = PICO(
        population=population,
        intervention=intervention,
        comparator=comparator,
        outcome=outcome,
        study_design="retrospective cohort study with propensity score matching",
    )

    refined = (
        f"In {pico.population}, does {pico.intervention} compared with "
        f"{pico.comparator} improve {pico.outcome}?"
    )

    return {
        "refined_question": refined,
        "pico": pico.model_dump(),
        "rationale": (
            "基于妇科肿瘤流行病学模板结构化解析。"
            "参考 NCCN/ESMO 指南及关键 III 期 RCT 设计。"
            "请主任审批后进入文献检索。"
        ),
        "suggested_analysis": (
            "Primary: Cox 比例风险模型（PFS/OS）；"
            "Secondary: PSM (1:1, caliper 0.2)，FIGO 分期/HRD 状态亚组分析。"
        ),
        "source": "rules",
    }


def _match(text: str, patterns: list[tuple[str, str]], default: str) -> str:
    for pattern, value in patterns:
        if re.search(pattern, text, re.IGNORECASE):
            return value
    return default


def _extract_drug_mention(topic: str) -> str:
    drug_patterns = [
        r"(PARP[\-\s]?抑制剂?)",
        r"(奥拉帕利|olaparib)",
        r"(帕博利珠单抗|pembrolizumab)",
        r"(贝伐珠单抗|bevacizumab)",
        r"(PD-1[\-\s]?抑制剂?)",
    ]
    for pat in drug_patterns:
        m = re.search(pat, topic, re.IGNORECASE)
        if m:
            return m.group(1)
    return ""
