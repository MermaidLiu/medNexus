"""Synthetic OMOP CDM clinical pipeline for M2 (cohort → visualization)."""

from __future__ import annotations

import hashlib
import math
import random
from typing import Any

from app.models.research import PICO


def _seed(topic: str) -> random.Random:
    h = int(hashlib.sha256(topic.encode()).hexdigest()[:8], 16)
    return random.Random(h)


def define_cohort(topic: str, pico: PICO) -> dict[str, Any]:
    """Generate cohort inclusion/exclusion criteria and OMOP concept sets."""
    rng = _seed(topic + "cohort")
    n_eligible = rng.randint(11200, 14500)

    inclusion = [
        {"criterion": "Age 18–75 years at index date", "omop_concept": "216018 SNOMED"},
        {"criterion": "Type 2 diabetes mellitus (ICD-10 E11.*)", "omop_concept": "201826 Condition"},
        {"criterion": "New user of index drug (washout ≥ 365 days)", "omop_concept": "Drug Era"},
        {"criterion": "≥ 365 days follow-up after index", "omop_concept": "Observation period"},
    ]
    exclusion = [
        {"criterion": "Type 1 diabetes (E10.*)", "omop_concept": "201254 Condition"},
        {"criterion": "MACE within 90 days prior to index", "omop_concept": "Composite outcome"},
        {"criterion": "eGFR < 30 mL/min/1.73m²", "omop_concept": "46233669 Measurement"},
        {"criterion": "Concurrent GLP-1 RA use", "omop_concept": "43532299 Drug"},
    ]

    intervention_concepts = [
        {"name": "Empagliflozin", "rxnorm": "1545653", "atc": "A10BK03"},
        {"name": "Dapagliflozin", "rxnorm": "1488564", "atc": "A10BK01"},
        {"name": "Canagliflozin", "rxnorm": "1373458", "atc": "A10BK02"},
    ]
    comparator_concepts = [
        {"name": "Sitagliptin", "rxnorm": "593411", "atc": "A10BH01"},
        {"name": "Linagliptin", "rxnorm": "1100699", "atc": "A10BH05"},
        {"name": "Saxagliptin", "rxnorm": "857029", "atc": "A10BH03"},
    ]

    outcome_def = {
        "primary": pico.outcome or "MACE (MI, stroke, CV death)",
        "components": [
            "Myocardial infarction (ICD-10 I21.*)",
            "Ischemic stroke (ICD-10 I63.*)",
            "Cardiovascular death",
        ],
        "lookback_days": 0,
        "follow_up_days": 1095,
    }

    return {
        "population": pico.population,
        "study_design": pico.study_design,
        "inclusion_criteria": inclusion,
        "exclusion_criteria": exclusion,
        "intervention_concepts": intervention_concepts,
        "comparator_concepts": comparator_concepts,
        "outcome_definition": outcome_def,
        "index_date_definition": "First prescription date of index drug",
        "estimated_eligible": n_eligible,
        "data_source": "OMOP CDM v5.4 (synthetic demo)",
        "sql_preview": _cohort_sql_preview(pico),
        "source": "agent",
    }


def extract_clinical_data(topic: str, pico: PICO, cohort: dict) -> dict[str, Any]:
    """Simulate EHR/OMOP extraction with patient-level summary."""
    rng = _seed(topic + "extract")
    n = cohort.get("estimated_eligible", 12847)
    n_intervention = int(n * rng.uniform(0.52, 0.55))
    n_comparator = n - n_intervention

    variables = [
        {"name": "person_id", "type": "integer", "omop_table": "person"},
        {"name": "age_at_index", "type": "float", "omop_table": "person"},
        {"name": "gender", "type": "categorical", "omop_table": "person"},
        {"name": "index_date", "type": "date", "omop_table": "drug_exposure"},
        {"name": "exposure_group", "type": "categorical", "omop_table": "drug_exposure"},
        {"name": "hba1c_baseline", "type": "float", "omop_table": "measurement"},
        {"name": "egfr_baseline", "type": "float", "omop_table": "measurement"},
        {"name": "bmi", "type": "float", "omop_table": "measurement"},
        {"name": "prior_cvd", "type": "binary", "omop_table": "condition_occurrence"},
        {"name": "hypertension", "type": "binary", "omop_table": "condition_occurrence"},
        {"name": "statin_use", "type": "binary", "omop_table": "drug_exposure"},
        {"name": "follow_up_days", "type": "integer", "omop_table": "observation_period"},
        {"name": "mace_event", "type": "binary", "omop_table": "condition_occurrence"},
        {"name": "time_to_mace_days", "type": "integer", "omop_table": "derived"},
    ]

    sample_rows = []
    for i in range(5):
        is_int = i < 3
        sample_rows.append(
            {
                "person_id": f"P{100000 + i}",
                "age": round(rng.uniform(52, 68), 1),
                "gender": rng.choice(["M", "F"]),
                "exposure": pico.intervention[:20] if is_int else pico.comparator[:20],
                "hba1c": round(rng.uniform(7.2, 9.8), 1),
                "egfr": round(rng.uniform(55, 95), 0),
                "prior_cvd": rng.choice([0, 1]),
                "mace": rng.choice([0, 1]),
                "follow_up_days": rng.randint(365, 1095),
            }
        )

    return {
        "total_patients": n,
        "intervention_n": n_intervention,
        "comparator_n": n_comparator,
        "variables_extracted": len(variables),
        "variables": variables,
        "sample_rows": sample_rows,
        "extraction_time_sec": round(rng.uniform(45, 120), 1),
        "data_source": cohort.get("data_source", "OMOP CDM"),
        "storage_format": "Parquet (de-identified)",
        "source": "agent",
    }


def clean_clinical_data(topic: str, extraction: dict) -> dict[str, Any]:
    """Data quality checks and cleaning report."""
    rng = _seed(topic + "clean")
    n_raw = extraction.get("total_patients", 12847)
    n_missing_hba1c = int(n_raw * rng.uniform(0.04, 0.07))
    n_outlier_egfr = int(n_raw * rng.uniform(0.002, 0.005))
    n_duplicate = rng.randint(8, 24)
    n_excluded_post = int(n_raw * rng.uniform(0.03, 0.05))
    n_final = n_raw - n_excluded_post - n_duplicate

    steps = [
        {
            "action": "Remove duplicate person_id",
            "n_affected": n_duplicate,
            "method": "Keep earliest index date",
        },
        {
            "action": "Impute missing HbA1c",
            "n_affected": n_missing_hba1c,
            "method": "MICE (5 imputations, pooled estimates)",
        },
        {
            "action": "Winsorize eGFR outliers",
            "n_affected": n_outlier_egfr,
            "method": "IQR method (1.5×)",
        },
        {
            "action": "Exclude insufficient follow-up",
            "n_affected": n_excluded_post,
            "method": "< 365 days observation",
        },
        {
            "action": "Standardize drug ATC codes",
            "n_affected": n_raw,
            "method": "WHO ATC mapping v2024",
        },
    ]

    quality_score = round(rng.uniform(0.91, 0.97), 2)

    return {
        "raw_n": n_raw,
        "final_n": n_final,
        "intervention_n": int(n_final * extraction.get("intervention_n", 6821) / n_raw),
        "comparator_n": int(n_final * extraction.get("comparator_n", 6026) / n_raw),
        "cleaning_steps": steps,
        "missing_rate_overall": f"{rng.uniform(2.1, 4.8):.1f}%",
        "quality_score": quality_score,
        "summary": (
            f"Cleaned cohort: {n_raw:,} → {n_final:,} patients. "
            f"Overall data quality score: {quality_score:.0%}."
        ),
        "source": "agent",
    }


def run_statistical_analysis(
    topic: str, pico: PICO, cleaning: dict
) -> dict[str, Any]:
    """Propensity score matching + Cox proportional hazards (synthetic)."""
    rng = _seed(topic + "stats")
    n_int = cleaning.get("intervention_n", 6500)
    n_comp = cleaning.get("comparator_n", 5800)

    hr = round(rng.uniform(0.82, 0.92), 2)
    ci_low = round(hr - rng.uniform(0.06, 0.09), 2)
    ci_high = round(hr + rng.uniform(0.04, 0.07), 2)
    p_value = round(rng.uniform(0.002, 0.025), 4)

    table1 = [
        {
            "variable": "Age, years",
            "intervention": f"{rng.uniform(60, 63):.1f} ± {rng.uniform(9, 11):.1f}",
            "comparator": f"{rng.uniform(59, 62):.1f} ± {rng.uniform(9, 11):.1f}",
            "smd": round(rng.uniform(0.01, 0.06), 3),
        },
        {
            "variable": "Male, %",
            "intervention": f"{rng.uniform(52, 58):.1f}",
            "comparator": f"{rng.uniform(51, 57):.1f}",
            "smd": round(rng.uniform(0.01, 0.05), 3),
        },
        {
            "variable": "HbA1c, %",
            "intervention": f"{rng.uniform(7.8, 8.4):.1f} ± {rng.uniform(1.0, 1.4):.1f}",
            "comparator": f"{rng.uniform(7.9, 8.5):.1f} ± {rng.uniform(1.0, 1.4):.1f}",
            "smd": round(rng.uniform(0.02, 0.07), 3),
        },
        {
            "variable": "eGFR, mL/min",
            "intervention": f"{rng.uniform(72, 78):.0f} ± {rng.uniform(14, 18):.0f}",
            "comparator": f"{rng.uniform(71, 77):.0f} ± {rng.uniform(14, 18):.0f}",
            "smd": round(rng.uniform(0.01, 0.05), 3),
        },
        {
            "variable": "Prior CVD, %",
            "intervention": f"{rng.uniform(28, 34):.1f}",
            "comparator": f"{rng.uniform(29, 35):.1f}",
            "smd": round(rng.uniform(0.02, 0.06), 3),
        },
    ]

    subgroups = [
        {"subgroup": "Overall", "hr": hr, "ci_low": ci_low, "ci_high": ci_high},
        {
            "subgroup": "Age < 65",
            "hr": round(hr + rng.uniform(-0.05, 0.03), 2),
            "ci_low": round(ci_low + rng.uniform(-0.03, 0.02), 2),
            "ci_high": round(ci_high + rng.uniform(-0.02, 0.03), 2),
        },
        {
            "subgroup": "Age ≥ 65",
            "hr": round(hr + rng.uniform(-0.02, 0.06), 2),
            "ci_low": round(ci_low + rng.uniform(-0.04, 0.01), 2),
            "ci_high": round(ci_high + rng.uniform(0.0, 0.05), 2),
        },
        {
            "subgroup": "Prior CVD = Yes",
            "hr": round(hr + rng.uniform(-0.04, 0.04), 2),
            "ci_low": round(ci_low - 0.02, 2),
            "ci_high": round(ci_high + 0.02, 2),
        },
        {
            "subgroup": "Prior CVD = No",
            "hr": round(hr + rng.uniform(-0.03, 0.05), 2),
            "ci_low": round(ci_low - 0.01, 2),
            "ci_high": round(ci_high + 0.03, 2),
        },
    ]

    return {
        "method": "1:1 propensity score matching (nearest neighbor, caliper 0.2) + Cox PH",
        "primary_outcome": pico.outcome or "MACE",
        "hazard_ratio": hr,
        "ci_95_low": ci_low,
        "ci_95_high": ci_high,
        "p_value": p_value,
        "n_intervention": n_int,
        "n_comparator": n_comp,
        "events_intervention": int(n_int * rng.uniform(0.08, 0.11)),
        "events_comparator": int(n_comp * rng.uniform(0.10, 0.13)),
        "table1": table1,
        "subgroups": subgroups,
        "psm_balance_max_smd": max(r["smd"] for r in table1),
        "e_value_point": round(1 / (1 - (1 / hr)) if hr < 1 else hr + 1, 2),
        "summary": (
            f"Primary analysis: {pico.intervention[:30]} vs {pico.comparator[:30]} — "
            f"HR {hr} (95% CI {ci_low}–{ci_high}), p={p_value}. "
            f"PSM achieved balance (max SMD < 0.1)."
        ),
        "source": "agent",
    }


def generate_visualizations(topic: str, stats: dict) -> dict[str, Any]:
    """Chart-ready data for KM curve, forest plot, and Love plot."""
    rng = _seed(topic + "viz")
    hr = stats.get("hazard_ratio", 0.87)

    # Kaplan-Meier survival curves (monthly points, 0–36 months)
    km_points: list[dict] = []
    surv_int = 1.0
    surv_comp = 1.0
    for month in range(0, 37, 3):
        drop_int = rng.uniform(0.008, 0.015) * (1 if month > 0 else 0)
        drop_comp = rng.uniform(0.010, 0.018) * (1 if month > 0 else 0)
        surv_int = max(0.75, surv_int - drop_int)
        surv_comp = max(0.72, surv_comp - drop_comp)
        km_points.append(
            {
                "month": month,
                "survival_intervention": round(surv_int, 4),
                "survival_comparator": round(surv_comp, 4),
            }
        )

    forest = stats.get("subgroups", [])

    love_plot = [
        {"covariate": "Age", "smd_before": round(rng.uniform(0.08, 0.15), 3), "smd_after": round(rng.uniform(0.01, 0.04), 3)},
        {"covariate": "Male sex", "smd_before": round(rng.uniform(0.05, 0.12), 3), "smd_after": round(rng.uniform(0.01, 0.03), 3)},
        {"covariate": "HbA1c", "smd_before": round(rng.uniform(0.10, 0.18), 3), "smd_after": round(rng.uniform(0.02, 0.05), 3)},
        {"covariate": "eGFR", "smd_before": round(rng.uniform(0.06, 0.14), 3), "smd_after": round(rng.uniform(0.01, 0.04), 3)},
        {"covariate": "Prior CVD", "smd_before": round(rng.uniform(0.07, 0.13), 3), "smd_after": round(rng.uniform(0.02, 0.05), 3)},
        {"covariate": "Hypertension", "smd_before": round(rng.uniform(0.04, 0.11), 3), "smd_after": round(rng.uniform(0.01, 0.03), 3)},
    ]

    log_rank_p = round(rng.uniform(0.003, 0.018), 4)

    return {
        "kaplan_meier": km_points,
        "forest_plot": forest,
        "love_plot": love_plot,
        "log_rank_p": log_rank_p,
        "primary_hr": hr,
        "chart_types": ["kaplan_meier", "forest_plot", "love_plot"],
        "summary": (
            f"KM curves show separation favoring intervention (log-rank p={log_rank_p}). "
            f"Forest plot consistent across subgroups. Love plot confirms PSM balance (SMD < 0.1)."
        ),
        "source": "agent",
    }


def _cohort_sql_preview(pico: PICO) -> str:
    return f"""-- OMOP CDM cohort definition (preview)
WITH t2dm AS (
  SELECT person_id, condition_start_date
  FROM condition_occurrence co
  JOIN concept c ON co.condition_concept_id = c.concept_id
  WHERE c.concept_code LIKE 'E11%'
),
index_cohort AS (
  SELECT person_id, MIN(drug_exposure_start_date) AS index_date
  FROM drug_exposure de
  JOIN concept c ON de.drug_concept_id = c.concept_id
  WHERE c.concept_name ILIKE '%{pico.intervention[:15]}%'
  GROUP BY person_id
)
SELECT COUNT(DISTINCT ic.person_id) AS eligible_patients
FROM index_cohort ic
JOIN t2dm t ON ic.person_id = t.person_id;"""
