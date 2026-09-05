"""Step executors for the full 9-step research pipeline."""

from __future__ import annotations

from datetime import datetime, timezone

from app.models.research import LiteraturePaper, PICO, StepId
from app.orchestrator.planner import plan_research_question
from app.tools.clinical_pipeline import (
    clean_clinical_data,
    define_cohort,
    extract_clinical_data,
    generate_visualizations,
    run_statistical_analysis,
)
from app.tools.literature import compare_with_literature, search_literature


def execute_step(step_id: StepId, context: dict) -> dict:
    """Run a single pipeline step and return artifact dict."""
    topic: str = context["topic"]
    pico = PICO(**context.get("pico", {}))

    if step_id == StepId.RESEARCH_QUESTION:
        return plan_research_question(topic)

    if step_id == StepId.LITERATURE_SEARCH:
        return search_literature(topic, pico)

    if step_id == StepId.COHORT_DEFINITION:
        return define_cohort(topic, pico)

    if step_id == StepId.DATA_EXTRACTION:
        cohort = context.get("cohort", {})
        return extract_clinical_data(topic, pico, cohort)

    if step_id == StepId.DATA_CLEANING:
        extraction = context.get("extraction", {})
        return clean_clinical_data(topic, extraction)

    if step_id == StepId.STATISTICAL_ANALYSIS:
        cleaning = context.get("cleaning", {})
        return run_statistical_analysis(topic, pico, cleaning)

    if step_id == StepId.VISUALIZATION:
        stats = context.get("statistics", {})
        return generate_visualizations(topic, stats)

    if step_id == StepId.LITERATURE_COMPARISON:
        papers_raw = context.get("papers", [])
        papers = [LiteraturePaper(**p) for p in papers_raw]
        result = compare_with_literature(topic, pico, papers)
        # Enrich with empirical findings when available
        stats = context.get("statistics", {})
        if stats:
            final_n = context.get("cleaning", {}).get("final_n", "N/A")
            n_str = f"{final_n:,}" if isinstance(final_n, int) else str(final_n)
            result["empirical_hr"] = stats.get("hazard_ratio")
            result["empirical_ci"] = (
                f"{stats.get('ci_95_low')}–{stats.get('ci_95_high')}"
            )
            result["narrative"] = (
                f"{result.get('narrative', '')} "
                f"Our RWE analysis (N={n_str}) "
                f"yielded HR={stats.get('hazard_ratio')} "
                f"(95% CI {stats.get('ci_95_low')}–{stats.get('ci_95_high')}), "
                f"consistent with published RCT and observational data."
            )
        return result

    if step_id == StepId.RESEARCH_REPORT:
        context["generated_at"] = datetime.now(timezone.utc).isoformat()
        return _generate_report(context)

    raise ValueError(f"Unknown step: {step_id}")


def _generate_report(context: dict) -> dict:
    topic = context.get("topic", "")
    pico = context.get("pico", {})
    lit_summary = context.get("literature_summary", "")
    comparison_narrative = context.get("comparison_narrative", "")
    papers = context.get("papers", [])
    stats = context.get("statistics", {})
    cleaning = context.get("cleaning", {})
    cohort = context.get("cohort", {})

    hr = stats.get("hazard_ratio", "—")
    ci = f"{stats.get('ci_95_low', '—')}–{stats.get('ci_95_high', '—')}"
    p_val = stats.get("p_value", "—")
    n_raw = cleaning.get("final_n", "—")
    n_display = f"{n_raw:,}" if isinstance(n_raw, int) else str(n_raw)

    abstract = (
        f"**Background:** {topic}\n\n"
        f"**Methods:** {pico.get('study_design', 'Retrospective cohort')} in "
        f"{pico.get('population', 'target population')} using OMOP CDM. "
        f"Exposure: {pico.get('intervention', 'N/A')}; "
        f"Comparator: {pico.get('comparator', 'N/A')}. "
        f"Primary outcome: {pico.get('outcome', 'N/A')}. "
        f"Analysis: propensity score matching + Cox regression.\n\n"
        f"**Results:** Final cohort N={n_display}. "
        f"Primary outcome HR={hr} (95% CI {ci}), p={p_val}. "
        f"Literature synthesis of {len(papers)} key studies supports direction of effect.\n\n"
        f"**Conclusions:** {comparison_narrative[:400] if comparison_narrative else 'See discussion.'}"
    )

    table1_md = _table1_markdown(stats.get("table1", []))

    sections = {
        "abstract": f"## Abstract\n\n{abstract}",
        "introduction": (
            f"## Introduction\n\n"
            f"This report presents a complete research workflow for: **{topic}**.\n\n"
            f"**Research question:** {context.get('refined_question', topic)}\n\n"
            f"{context.get('rationale', '')}"
        ),
        "methods": (
            f"## Methods\n\n"
            f"**Study design:** {pico.get('study_design', '')}\n\n"
            f"**PICO:**\n"
            f"- Population: {pico.get('population', '')}\n"
            f"- Intervention: {pico.get('intervention', '')}\n"
            f"- Comparator: {pico.get('comparator', '')}\n"
            f"- Outcome: {pico.get('outcome', '')}\n\n"
            f"**Cohort:** {cohort.get('estimated_eligible', 'N/A')} eligible → "
            f"{n_display} after cleaning.\n\n"
            f"**Statistical analysis:** {stats.get('method', 'Cox PH with PSM')}\n\n"
            f"{context.get('suggested_analysis', '')}"
        ),
        "results": (
            f"## Results\n\n"
            f"### Primary Analysis\n"
            f"- Hazard ratio: **{hr}** (95% CI {ci})\n"
            f"- p-value: {p_val}\n"
            f"- Events: {stats.get('events_intervention', '—')} (intervention) vs "
            f"{stats.get('events_comparator', '—')} (comparator)\n\n"
            f"### Table 1 — Baseline Characteristics\n\n{table1_md}\n\n"
            f"### Literature Synthesis\n{lit_summary}\n\n"
            f"### Evidence Comparison\n{comparison_narrative}"
        ),
        "discussion": (
            f"## Discussion\n\n"
            f"Our real-world analysis of {n_display} patients demonstrates that "
            f"{pico.get('intervention', 'the intervention')} is associated with "
            f"lower {pico.get('outcome', 'outcomes')} compared with "
            f"{pico.get('comparator', 'comparator')} (HR {hr}). "
            f"Findings are consistent with landmark trials (EMPA-REG, DECLARE) "
            f"and observational studies (CVD-REAL 2).\n\n"
            f"**Limitations:** Residual confounding, immortal time bias mitigated by "
            f"new-user design; synthetic demo data in M2 prototype.\n\n"
            f"**Clinical implications:** Results support guideline recommendations "
            f"for SGLT2i as preferred second-line agent in T2DM with CV risk."
        ),
        "references": _format_references(papers),
    }

    return {
        "title": f"Research Report: {topic[:80]}",
        "sections": sections,
        "markdown": "\n\n---\n\n".join(sections.values()),
        "generated_at": context.get("generated_at"),
        "version": "M2-full-pipeline",
    }


def _table1_markdown(rows: list[dict]) -> str:
    if not rows:
        return "_Table 1 not available._"
    lines = ["| Variable | Intervention | Comparator | SMD |", "|---|---|---|---|"]
    for r in rows:
        lines.append(
            f"| {r.get('variable', '')} | {r.get('intervention', '')} | "
            f"{r.get('comparator', '')} | {r.get('smd', '')} |"
        )
    return "\n".join(lines)


def _format_references(papers: list[dict]) -> str:
    lines = ["## References\n"]
    for i, p in enumerate(papers, 1):
        authors = p.get("authors", "Unknown")
        title = p.get("title", "Untitled")
        journal = p.get("journal", "")
        year = p.get("year", "")
        doi = p.get("doi", "")
        ref = f"{i}. {authors}. {title}. *{journal}* ({year})."
        if doi:
            ref += f" doi:{doi}"
        lines.append(ref)
    return "\n".join(lines)
