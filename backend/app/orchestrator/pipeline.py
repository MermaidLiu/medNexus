"""In-memory study store and pipeline orchestration."""

from __future__ import annotations

import uuid
from datetime import datetime

from app.models.research import (
    PIPELINE_ORDER,
    PIPELINE_STEPS,
    STEP_LABELS,
    ApproveStepRequest,
    CreateStudyRequest,
    PipelineStep,
    StepId,
    StepStatus,
    Study,
    StudyStatus,
    StudySummary,
)
from app.orchestrator.executor import execute_step


class StudyStore:
    def __init__(self) -> None:
        self._studies: dict[str, Study] = {}

    def list_studies(self) -> list[StudySummary]:
        return [
            self._to_summary(s)
            for s in sorted(
                self._studies.values(), key=lambda x: x.updated_at, reverse=True
            )
        ]

    def get_study(self, study_id: str) -> Study | None:
        return self._studies.get(study_id)

    def create_study(self, req: CreateStudyRequest) -> Study:
        study_id = str(uuid.uuid4())
        steps = [
            PipelineStep(
                id=step_id,
                label=STEP_LABELS[step_id],
                status=StepStatus.PENDING,
            )
            for step_id in PIPELINE_ORDER
        ]
        study = Study(
            id=study_id,
            topic=req.topic,
            status=StudyStatus.DRAFT,
            steps=steps,
        )
        self._studies[study_id] = study
        return study

    async def run_pipeline(self, study_id: str) -> Study:
        study = self._require(study_id)
        study.status = StudyStatus.RUNNING
        study.updated_at = datetime.utcnow()

        context: dict = {"topic": study.topic}

        for step_id in PIPELINE_ORDER:
            step = self._get_step(study, step_id)
            step.status = StepStatus.RUNNING
            step.started_at = datetime.utcnow()
            study.current_step_id = step_id
            study.updated_at = datetime.utcnow()

            try:
                artifact = execute_step(step_id, context)
                step.artifact = artifact
                step.status = StepStatus.AWAITING_APPROVAL
                step.completed_at = datetime.utcnow()
                self._merge_context(context, step_id, artifact)
            except Exception as exc:
                step.status = StepStatus.FAILED
                step.error = str(exc)
                study.status = StudyStatus.FAILED
                study.updated_at = datetime.utcnow()
                return study

        awaiting = any(
            s.status == StepStatus.AWAITING_APPROVAL for s in study.steps
        )
        study.status = StudyStatus.PAUSED if awaiting else StudyStatus.COMPLETED
        study.current_step_id = None
        study.updated_at = datetime.utcnow()
        return study

    async def run_step(self, study_id: str, step_id: StepId) -> Study:
        study = self._require(study_id)
        step = self._get_step(study, step_id)
        if step.status == StepStatus.LOCKED:
            raise ValueError(f"Step {step_id} is locked")

        context = self._build_context(study)
        step.status = StepStatus.RUNNING
        step.started_at = datetime.utcnow()
        step.error = None
        study.status = StudyStatus.RUNNING
        study.current_step_id = step_id
        study.updated_at = datetime.utcnow()

        try:
            artifact = execute_step(step_id, context)
            step.artifact = artifact
            step.status = StepStatus.AWAITING_APPROVAL
            step.completed_at = datetime.utcnow()
            self._merge_context(context, step_id, artifact)
        except Exception as exc:
            step.status = StepStatus.FAILED
            step.error = str(exc)
            study.status = StudyStatus.FAILED

        study.updated_at = datetime.utcnow()
        return study

    def approve_step(
        self, study_id: str, step_id: StepId, req: ApproveStepRequest
    ) -> Study:
        study = self._require(study_id)
        step = self._get_step(study, step_id)
        if step.status != StepStatus.AWAITING_APPROVAL:
            raise ValueError("Step is not awaiting approval")

        step.status = StepStatus.COMPLETED
        if req.feedback and step.artifact:
            step.artifact["director_feedback"] = req.feedback
        study.updated_at = datetime.utcnow()

        all_done = all(
            s.status == StepStatus.COMPLETED for s in study.steps
        )
        if all_done:
            study.status = StudyStatus.COMPLETED
        return study

    def _require(self, study_id: str) -> Study:
        study = self._studies.get(study_id)
        if not study:
            raise KeyError(f"Study {study_id} not found")
        return study

    def _get_step(self, study: Study, step_id: StepId) -> PipelineStep:
        for step in study.steps:
            if step.id == step_id:
                return step
        raise KeyError(f"Step {step_id} not found")

    def _merge_context(self, context: dict, step_id: StepId, artifact: dict) -> None:
        if step_id == StepId.RESEARCH_QUESTION:
            context.update(artifact)
        elif step_id == StepId.LITERATURE_SEARCH:
            context["papers"] = artifact.get("papers", [])
            context["literature_summary"] = artifact.get("summary", "")
            context["total_found"] = artifact.get("total_found")
            context["relevant_count"] = artifact.get("relevant_count")
        elif step_id == StepId.COHORT_DEFINITION:
            context["cohort"] = artifact
        elif step_id == StepId.DATA_EXTRACTION:
            context["extraction"] = artifact
        elif step_id == StepId.DATA_CLEANING:
            context["cleaning"] = artifact
        elif step_id == StepId.STATISTICAL_ANALYSIS:
            context["statistics"] = artifact
        elif step_id == StepId.VISUALIZATION:
            context["visualization"] = artifact
        elif step_id == StepId.LITERATURE_COMPARISON:
            context["comparison_rows"] = artifact.get("rows", [])
            context["comparison_narrative"] = artifact.get("narrative", "")
        elif step_id == StepId.RESEARCH_REPORT:
            context["report"] = artifact

    def _build_context(self, study: Study) -> dict:
        context: dict = {"topic": study.topic}
        for step in study.steps:
            if step.artifact and step.status in (
                StepStatus.COMPLETED,
                StepStatus.AWAITING_APPROVAL,
            ):
                self._merge_context(context, step.id, step.artifact)
        return context

    def _to_summary(self, study: Study) -> StudySummary:
        total = len(PIPELINE_STEPS)
        done = sum(
            1 for s in study.steps if s.status == StepStatus.COMPLETED
        )
        return StudySummary(
            id=study.id,
            topic=study.topic,
            status=study.status,
            current_step_id=study.current_step_id,
            progress=round(done / total * 100, 1) if total else 0,
            created_at=study.created_at,
            updated_at=study.updated_at,
        )


store = StudyStore()
