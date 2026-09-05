from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class StepId(str, Enum):
    RESEARCH_QUESTION = "research_question"
    LITERATURE_SEARCH = "literature_search"
    COHORT_DEFINITION = "cohort_definition"
    DATA_EXTRACTION = "data_extraction"
    DATA_CLEANING = "data_cleaning"
    STATISTICAL_ANALYSIS = "statistical_analysis"
    VISUALIZATION = "visualization"
    LITERATURE_COMPARISON = "literature_comparison"
    RESEARCH_REPORT = "research_report"


class StepStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    AWAITING_APPROVAL = "awaiting_approval"
    COMPLETED = "completed"
    SKIPPED = "skipped"
    FAILED = "failed"
    LOCKED = "locked"


class StudyStatus(str, Enum):
    DRAFT = "draft"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"


# Full 9-step pipeline (M2)
PIPELINE_STEPS: list[StepId] = list(StepId)

# Legacy aliases kept for imports
M1_STEPS: list[StepId] = PIPELINE_STEPS
M2_LOCKED_STEPS: list[StepId] = []

STEP_LABELS: dict[StepId, str] = {
    StepId.RESEARCH_QUESTION: "Research Question",
    StepId.LITERATURE_SEARCH: "Literature Search",
    StepId.COHORT_DEFINITION: "Cohort Definition",
    StepId.DATA_EXTRACTION: "Clinical Data Extraction",
    StepId.DATA_CLEANING: "Data Cleaning",
    StepId.STATISTICAL_ANALYSIS: "Statistical Analysis",
    StepId.VISUALIZATION: "Visualization",
    StepId.LITERATURE_COMPARISON: "Literature Comparison",
    StepId.RESEARCH_REPORT: "Research Report",
}

PIPELINE_ORDER: list[StepId] = list(StepId)


class PICO(BaseModel):
    population: str = ""
    intervention: str = ""
    comparator: str = ""
    outcome: str = ""
    study_design: str = "retrospective cohort study"


class LiteraturePaper(BaseModel):
    title: str
    authors: str = ""
    year: int | None = None
    journal: str = ""
    doi: str = ""
    abstract: str = ""
    relevance_score: float = 0.0
    key_findings: str = ""


class LiteratureComparisonRow(BaseModel):
    study: str
    design: str = ""
    effect_estimate: str = ""
    confidence_interval: str = ""
    consistency: str = ""


class PipelineStep(BaseModel):
    id: StepId
    label: str
    status: StepStatus = StepStatus.PENDING
    artifact: dict[str, Any] | None = None
    error: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None


class Study(BaseModel):
    id: str
    topic: str
    status: StudyStatus = StudyStatus.DRAFT
    steps: list[PipelineStep] = Field(default_factory=list)
    current_step_id: StepId | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class CreateStudyRequest(BaseModel):
    topic: str = Field(..., min_length=10, max_length=2000)


class ApproveStepRequest(BaseModel):
    feedback: str = ""


class StudySummary(BaseModel):
    id: str
    topic: str
    status: StudyStatus
    current_step_id: StepId | None
    progress: float
    created_at: datetime
    updated_at: datetime
