"""Quick navigator search for gynecologic oncology — Bohrium Science Navigator style."""

from __future__ import annotations

from app.domain.gynonc import FEATURED_TRIALS, SUGGESTED_QUESTIONS
from app.models.research import PICO
from app.orchestrator.planner import plan_research_question
from app.tools.literature import search_literature


def navigator_search(query: str) -> dict:
    """Instant literature + PICO preview without full pipeline."""
    pico_plan = plan_research_question(query)
    pico = PICO(**pico_plan.get("pico", {}))
    lit = search_literature(query, pico)

    # Match featured trials by keywords
    related_trials = [
        t for t in FEATURED_TRIALS
        if any(
            kw in query.lower() or kw in t["disease"] or kw in t["name"].lower()
            for kw in _keywords(query, pico)
        )
    ]
    if not related_trials:
        related_trials = FEATURED_TRIALS[:3]

    papers = lit.get("papers", [])[:5]
    answer = _synthesize_answer(query, pico_plan, lit, related_trials)

    return {
        "query": query,
        "answer": answer,
        "pico": pico_plan.get("pico"),
        "refined_question": pico_plan.get("refined_question"),
        "papers": papers,
        "related_trials": related_trials,
        "suggested_followups": _followups(pico),
        "source": pico_plan.get("source", "agent"),
    }


def get_navigator_config() -> dict:
    from app.domain.gynonc import APP_TOOLS, DISEASE_AREAS, READ_COMPUTE_DO, SUGGESTED_QUESTIONS

    return {
        "platform": "MedNexus GynOnc Science Navigator",
        "vertical": "妇科肿瘤 Gynecologic Oncology",
        "tagline": "读文献 · 算数据 · 做产出 — 妇科肿瘤 AI4S 垂类平台",
        "disease_areas": DISEASE_AREAS,
        "suggested_questions": SUGGESTED_QUESTIONS,
        "read_compute_do": READ_COMPUTE_DO,
        "featured_trials": FEATURED_TRIALS,
        "app_tools": APP_TOOLS,
    }


def _keywords(query: str, pico: PICO) -> list[str]:
    parts = [query, pico.intervention, pico.comparator, pico.outcome, pico.population]
    kws: list[str] = []
    for p in parts:
        for t in p.replace("，", " ").replace(",", " ").split():
            if len(t) > 1:
                kws.append(t.lower())
    return kws


def _synthesize_answer(
    query: str,
    pico_plan: dict,
    lit: dict,
    trials: list[dict],
) -> str:
    pico = pico_plan.get("pico", {})
    n_papers = lit.get("relevant_count", 0)
    trial_lines = "\n".join(
        f"- **{t['name']}** ({t['disease']}): {t['finding']}" for t in trials[:3]
    )
    return (
        f"针对您的问题「{query[:80]}...」，MedNexus 妇科肿瘤导航检索到 **{n_papers}** 篇高相关文献。\n\n"
        f"**PICO 解析：**\n"
        f"- P: {pico.get('population', '—')}\n"
        f"- I: {pico.get('intervention', '—')}\n"
        f"- C: {pico.get('comparator', '—')}\n"
        f"- O: {pico.get('outcome', '—')}\n\n"
        f"**关键临床试验证据：**\n{trial_lines}\n\n"
        f"{lit.get('summary', '')}\n\n"
        f"→ 点击「启动完整流水线」可自动完成队列构建、统计分析与报告生成。"
    )


def _followups(pico: PICO) -> list[str]:
    return [
        f"{pico.intervention} 在 {pico.population} 中的亚组分析？",
        f"{pico.outcome} 的 NCCN/ESMO 指南推荐等级？",
        "真实世界证据与 RCT 结果一致性比较",
    ]
