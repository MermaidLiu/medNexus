"""Literature search & comparison — ToolUniverse or curated mock."""

from __future__ import annotations

from app.models.research import LiteratureComparisonRow, LiteraturePaper, PICO
from app.tools.tooluniverse_client import tu_client


def search_literature(topic: str, pico: PICO) -> dict:
    """Run literature search; returns papers + summary stats."""
    if tu_client.is_available:
        result = tu_client.run(
            "conduct_literature_review_and_summarize",
            {"topic": topic},
        )
        if result.get("status") != "error":
            return _normalize_tu_result(result, topic)

    return _mock_literature_search(topic, pico)


def compare_with_literature(
    topic: str,
    pico: PICO,
    papers: list[LiteraturePaper],
) -> dict:
    """Build literature comparison table from retrieved papers."""
    if tu_client.is_available:
        result = tu_client.run(
            "conduct_literature_review_and_summarize",
            {"topic": f"Compare evidence for: {topic}"},
        )
        if result.get("status") != "error":
            return _normalize_comparison(result, papers)

    return _mock_literature_comparison(pico, papers)


def _normalize_tu_result(result: dict, topic: str) -> dict:
    """Best-effort mapping of ToolUniverse output."""
    papers_raw = result.get("papers") or result.get("results") or []
    papers = [
        LiteraturePaper(
            title=p.get("title", "Untitled"),
            authors=p.get("authors", ""),
            year=p.get("year"),
            journal=p.get("journal", ""),
            doi=p.get("doi", ""),
            abstract=p.get("abstract", ""),
            relevance_score=float(p.get("relevance_score", 0.8)),
            key_findings=p.get("key_findings", p.get("summary", "")),
        )
        for p in papers_raw[:25]
    ]
    return {
        "total_found": result.get("total_found", len(papers)),
        "relevant_count": len(papers),
        "papers": [p.model_dump() for p in papers],
        "summary": result.get("summary", f"Literature review for: {topic}"),
        "source": "tooluniverse",
    }


def _normalize_comparison(result: dict, papers: list[LiteraturePaper]) -> dict:
    rows_raw = result.get("comparison") or result.get("rows") or []
    rows = [
        LiteratureComparisonRow(
            study=r.get("study", ""),
            design=r.get("design", ""),
            effect_estimate=r.get("effect_estimate", ""),
            confidence_interval=r.get("confidence_interval", ""),
            consistency=r.get("consistency", ""),
        )
        for r in rows_raw
    ]
    return {
        "rows": [r.model_dump() for r in rows],
        "narrative": result.get("narrative", result.get("summary", "")),
        "source": "tooluniverse",
    }


def _mock_literature_search(topic: str, pico: PICO) -> dict:
    """Curated mock for gynecologic oncology evidence base."""
    papers = [
        LiteraturePaper(
            title="Olaparib Maintenance in Newly Diagnosed Advanced Ovarian Cancer (SOLO-1)",
            authors="Moore K, et al.",
            year=2018,
            journal="NEJM",
            doi="10.1056/NEJMoa1811830",
            relevance_score=0.98,
            key_findings="SOLO-1: 奥拉帕利维持 HR 0.59 (PFS)，BRCA突变一线维持显著获益。",
        ),
        LiteraturePaper(
            title="Pembrolizumab plus Chemotherapy in Cervical Cancer (KEYNOTE-826)",
            authors="Colombo N, et al.",
            year=2021,
            journal="NEJM",
            doi="10.1056/NEJMoa2112435",
            relevance_score=0.96,
            key_findings="KEYNOTE-826: PD-1+化疗 HR 0.64 (OS)，CPS≥1 全人群获益。",
        ),
        LiteraturePaper(
            title="Pembrolizumab plus Chemotherapy in Endometrial Cancer (NRG-GY018)",
            authors="Eskander RN, et al.",
            year=2023,
            journal="NEJM",
            doi="10.1056/NEJMoa2302312",
            relevance_score=0.95,
            key_findings="NRG-GY018: dMMR 组 PFS HR 0.36；pMMR 组 HR 0.71。",
        ),
        LiteraturePaper(
            title="Olaparib plus Bevacizumab in Ovarian Cancer (PAOLA-1)",
            authors="Ray-Coquard I, et al.",
            year=2019,
            journal="NEJM",
            doi="10.1056/NEJMoa1911361",
            relevance_score=0.94,
            key_findings="PAOLA-1: 奥拉帕利+贝伐 HR 0.59 (PFS)，HRD阳性人群获益最大。",
        ),
        LiteraturePaper(
            title="Niraparib Maintenance in Recurrent Ovarian Cancer (NOVA)",
            authors="Mirza MR, et al.",
            year=2016,
            journal="NEJM",
            doi="10.1056/NEJMoa1611310",
            relevance_score=0.92,
            key_findings="NOVA: 尼拉帕利维持 HR 0.27 (PFS)，铂敏感复发人群。",
        ),
    ]

    # Filter loosely by topic keywords when not default demo topic
    keywords = _extract_keywords(topic, pico)
    if keywords:
        filtered = [
            p
            for p in papers
            if any(k.lower() in (p.title + p.key_findings).lower() for k in keywords)
        ]
        if filtered:
            papers = filtered

    return {
        "total_found": 1243,
        "relevant_count": len(papers),
        "papers": [p.model_dump() for p in papers],
        "summary": (
            f"Identified {len(papers)} highly relevant studies for: {topic}. "
            f"PICO — P: {pico.population}; I: {pico.intervention}; "
            f"C: {pico.comparator}; O: {pico.outcome}."
        ),
        "source": "mock",
    }


def _mock_literature_comparison(pico: PICO, papers: list[LiteraturePaper]) -> dict:
    rows = [
        LiteratureComparisonRow(
            study="SOLO-1",
            design="RCT (PARP vs placebo)",
            effect_estimate="HR 0.59 (PFS)",
            confidence_interval="0.42–0.83",
            consistency="BRCA突变一线维持金标准",
        ),
        LiteratureComparisonRow(
            study="PAOLA-1",
            design="RCT (PARP+Bev vs Bev)",
            effect_estimate="HR 0.59 (PFS)",
            confidence_interval="0.49–0.72",
            consistency="HRD阳性人群一致获益",
        ),
        LiteratureComparisonRow(
            study="KEYNOTE-826",
            design="RCT (PD-1+chemo vs chemo)",
            effect_estimate="HR 0.64 (OS)",
            confidence_interval="0.50–0.81",
            consistency="CPS≥1 宫颈癌一线标准",
        ),
        LiteratureComparisonRow(
            study="NRG-GY018",
            design="RCT (PD-1+chemo vs chemo)",
            effect_estimate="HR 0.36 (PFS, dMMR)",
            confidence_interval="0.23–0.55",
            consistency="dMMR 子宫内膜癌强获益",
        ),
    ]
    narrative = (
        f"现有证据显示 {pico.intervention} 在 {pico.population} 中"
        f"可显著改善 {pico.outcome}。"
        f"关键 RCT（SOLO-1、PAOLA-1、KEYNOTE-826）效应量 HR 0.36–0.64。"
        f"真实世界研究验证 {pico.intervention} vs {pico.comparator} "
        f"的外部有效性仍有待补充。"
    )
    return {
        "rows": [r.model_dump() for r in rows],
        "narrative": narrative,
        "papers_reviewed": len(papers),
        "source": "mock",
    }


def _extract_keywords(topic: str, pico: PICO) -> list[str]:
    parts = [topic, pico.intervention, pico.comparator, pico.outcome]
    keywords: list[str] = []
    for part in parts:
        for token in part.replace(",", " ").split():
            if len(token) > 3:
                keywords.append(token)
    return keywords[:8]
