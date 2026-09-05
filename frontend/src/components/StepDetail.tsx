"use client";

import type { PipelineStep } from "@/lib/types";
import {
  CohortDefinitionView,
  DataCleaningView,
  DataExtractionView,
  StatisticalAnalysisView,
  VisualizationView,
} from "./M2StepViews";

interface Props {
  step: PipelineStep | null;
  topic: string;
  onApprove?: () => void;
  approving?: boolean;
}

function PICOTable({ pico }: { pico: Record<string, string> }) {
  const rows = [
    ["Population", pico.population],
    ["Intervention", pico.intervention],
    ["Comparator", pico.comparator],
    ["Outcome", pico.outcome],
    ["Study Design", pico.study_design],
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="border-b border-slate-100 last:border-0">
              <td className="w-36 bg-slate-50 px-4 py-2.5 font-medium text-slate-600">
                {label}
              </td>
              <td className="px-4 py-2.5 text-slate-800">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PapersList({ papers }: { papers: Array<Record<string, unknown>> }) {
  return (
    <div className="space-y-3">
      {papers.map((p, i) => (
        <article
          key={i}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-semibold text-slate-900">
              {String(p.title)}
            </h4>
            {p.relevance_score != null && (
              <span className="shrink-0 rounded-full bg-violet-50 px-2 py-0.5 text-xs text-violet-700">
                {(Number(p.relevance_score) * 100).toFixed(0)}% relevant
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {String(p.authors)} · {String(p.journal)} ({String(p.year)})
          </p>
          <p className="mt-2 text-sm text-slate-700">{String(p.key_findings)}</p>
        </article>
      ))}
    </div>
  );
}

function MarkdownView({ content }: { content: string }) {
  return (
    <article className="prose prose-sm prose-slate max-w-none rounded-xl border border-slate-200 bg-white p-6 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
      {content}
    </article>
  );
}

function ComparisonTable({ rows }: { rows: Array<Record<string, string>> }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            {["Study", "Design", "Effect", "95% CI", "Consistency"].map((h) => (
              <th key={h} className="px-3 py-2 text-left font-medium text-slate-600">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-slate-100">
              <td className="px-3 py-2 font-medium">{r.study}</td>
              <td className="px-3 py-2 text-slate-600">{r.design}</td>
              <td className="px-3 py-2">{r.effect_estimate}</td>
              <td className="px-3 py-2 text-slate-600">{r.confidence_interval}</td>
              <td className="px-3 py-2 text-slate-700">{r.consistency}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StepDetail({ step, topic, onApprove, approving }: Props) {
  if (!step) {
    return (
      <div className="flex flex-1 items-center justify-center text-slate-400">
        <p>选择左侧流水线步骤查看 Agent 产出</p>
      </div>
    );
  }

  if (step.status === "locked") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-slate-400">
        <p className="text-lg font-medium">{step.label}</p>
        <p className="text-sm">此步骤暂不可用</p>
      </div>
    );
  }

  if (step.status === "pending") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-slate-400">
        <p className="text-lg font-medium">{step.label}</p>
        <p className="text-sm">等待 Agent 执行…</p>
      </div>
    );
  }

  if (step.status === "running") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
        <p className="text-sm text-slate-600">Agent 正在执行：{step.label}</p>
      </div>
    );
  }

  if (step.status === "failed") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-red-500">
        <p className="font-medium">步骤执行失败</p>
        <p className="text-sm">{step.error}</p>
      </div>
    );
  }

  const artifact = step.artifact ?? {};

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{step.label}</h2>
          <p className="mt-0.5 text-sm text-slate-500 truncate max-w-xl">{topic}</p>
        </div>
        {step.status === "awaiting_approval" && onApprove && (
          <button
            onClick={onApprove}
            disabled={approving}
            className="rounded-lg bg-gradient-to-r from-rose-500 to-violet-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {approving ? "审批中…" : "主任审批通过"}
          </button>
        )}
        {step.status === "completed" && (
          <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 ring-1 ring-rose-200/80">
            已审批
          </span>
        )}
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        {step.id === "research_question" && (
          <div className="space-y-5 max-w-3xl">
            <section>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">
                精炼研究问题
              </h3>
              <p className="rounded-xl bg-gradient-to-r from-rose-50 to-violet-50 p-4 text-slate-800 ring-1 ring-rose-100">
                {String(artifact.refined_question ?? topic)}
              </p>
            </section>
            {artifact.pico && (
              <section>
                <h3 className="mb-2 text-sm font-semibold text-slate-700">
                  PICO 框架
                </h3>
                <PICOTable pico={artifact.pico as Record<string, string>} />
              </section>
            )}
            {artifact.rationale && (
              <section>
                <h3 className="mb-2 text-sm font-semibold text-slate-700">设计 rationale</h3>
                <p className="text-sm text-slate-600">{String(artifact.rationale)}</p>
              </section>
            )}
            {artifact.suggested_analysis && (
              <section>
                <h3 className="mb-2 text-sm font-semibold text-slate-700">建议分析方法</h3>
                <p className="text-sm text-slate-600">{String(artifact.suggested_analysis)}</p>
              </section>
            )}
            <p className="text-xs text-slate-400">
              来源：{String(artifact.source ?? "agent")}
            </p>
          </div>
        )}

        {step.id === "literature_search" && (
          <div className="space-y-5">
            <div className="flex gap-4">
              <div className="rounded-xl bg-white border border-slate-200 px-5 py-3 shadow-sm">
                <p className="text-2xl font-bold text-rose-600">
                  {String(artifact.total_found ?? "—")}
                </p>
                <p className="text-xs text-slate-500">检索总数</p>
              </div>
              <div className="rounded-xl bg-white border border-slate-200 px-5 py-3 shadow-sm">
                <p className="text-2xl font-bold text-violet-600">
                  {String(artifact.relevant_count ?? "—")}
                </p>
                <p className="text-xs text-slate-500">高度相关</p>
              </div>
            </div>
            {artifact.summary && (
              <p className="text-sm text-slate-600">{String(artifact.summary)}</p>
            )}
            {Array.isArray(artifact.papers) && (
              <PapersList papers={artifact.papers as Array<Record<string, unknown>>} />
            )}
          </div>
        )}

        {step.id === "literature_comparison" && (
          <div className="space-y-5 max-w-4xl">
            {Array.isArray(artifact.rows) && (
              <ComparisonTable rows={artifact.rows as Array<Record<string, string>>} />
            )}
            {artifact.narrative && (
              <section className="rounded-xl bg-slate-50 p-4">
                <h3 className="mb-2 text-sm font-semibold text-slate-700">综合解读</h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {String(artifact.narrative)}
                </p>
              </section>
            )}
          </div>
        )}

        {step.id === "cohort_definition" && (
          <CohortDefinitionView artifact={artifact} />
        )}

        {step.id === "data_extraction" && (
          <DataExtractionView artifact={artifact} />
        )}

        {step.id === "data_cleaning" && (
          <DataCleaningView artifact={artifact} />
        )}

        {step.id === "statistical_analysis" && (
          <StatisticalAnalysisView artifact={artifact} />
        )}

        {step.id === "visualization" && (
          <VisualizationView artifact={artifact} />
        )}

        {step.id === "research_report" && (
          <div className="max-w-3xl">
            {artifact.markdown ? (
              <MarkdownView content={String(artifact.markdown)} />
            ) : (
              <p className="text-slate-500">报告生成中…</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
