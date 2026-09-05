export type StepId =
  | "research_question"
  | "literature_search"
  | "cohort_definition"
  | "data_extraction"
  | "data_cleaning"
  | "statistical_analysis"
  | "visualization"
  | "literature_comparison"
  | "research_report";

export type StepStatus =
  | "pending"
  | "running"
  | "awaiting_approval"
  | "completed"
  | "skipped"
  | "failed"
  | "locked";

export type StudyStatus = "draft" | "running" | "paused" | "completed" | "failed";

export interface PipelineStep {
  id: StepId;
  label: string;
  status: StepStatus;
  artifact?: Record<string, unknown> | null;
  error?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface Study {
  id: string;
  topic: string;
  status: StudyStatus;
  steps: PipelineStep[];
  current_step_id?: StepId | null;
  created_at: string;
  updated_at: string;
}

export interface StudySummary {
  id: string;
  topic: string;
  status: StudyStatus;
  current_step_id?: StepId | null;
  progress: number;
  created_at: string;
  updated_at: string;
}

export const STEP_ORDER: StepId[] = [
  "research_question",
  "literature_search",
  "cohort_definition",
  "data_extraction",
  "data_cleaning",
  "statistical_analysis",
  "visualization",
  "literature_comparison",
  "research_report",
];

export const PIPELINE_STEPS: StepId[] = STEP_ORDER;

/** @deprecated use PIPELINE_STEPS */
export const M1_STEPS: StepId[] = STEP_ORDER;
