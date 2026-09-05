"use client";

import {
  KaplanMeierChart,
  ForestPlotChart,
  LovePlotChart,
} from "./ChartViews";

function CriteriaList({
  title,
  items,
}: {
  title: string;
  items: Array<{ criterion: string; omop_concept?: string }>;
}) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-slate-700">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
          >
            <span className="mt-0.5 text-rose-500">✓</span>
            <div>
              <p className="text-slate-800">{item.criterion}</p>
              {item.omop_concept && (
                <p className="text-xs text-slate-400">OMOP: {item.omop_concept}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CohortDefinitionView({ artifact }: { artifact: Record<string, unknown> }) {
  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex gap-4">
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
          <p className="text-2xl font-bold text-rose-600">
            {String(artifact.estimated_eligible ?? "—")}
          </p>
          <p className="text-xs text-slate-500">预估合格人数</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
          <p className="text-sm font-medium text-slate-700">
            {String(artifact.data_source ?? "OMOP CDM")}
          </p>
          <p className="text-xs text-slate-500">数据来源</p>
        </div>
      </div>
      {Array.isArray(artifact.inclusion_criteria) && (
        <CriteriaList
          title="纳入标准"
          items={artifact.inclusion_criteria as Array<{ criterion: string; omop_concept?: string }>}
        />
      )}
      {Array.isArray(artifact.exclusion_criteria) && (
        <CriteriaList
          title="排除标准"
          items={artifact.exclusion_criteria as Array<{ criterion: string; omop_concept?: string }>}
        />
      )}
      {artifact.sql_preview && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">OMOP SQL 预览</h3>
          <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs text-slate-100">
            {String(artifact.sql_preview)}
          </pre>
        </section>
      )}
    </div>
  );
}

export function DataExtractionView({ artifact }: { artifact: Record<string, unknown> }) {
  const variables = (artifact.variables as Array<Record<string, string>>) ?? [];
  const sample = (artifact.sample_rows as Array<Record<string, unknown>>) ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-4">
        <StatCard label="总患者数" value={String(artifact.total_patients ?? "—")} />
        <StatCard label="干预组" value={String(artifact.intervention_n ?? "—")} />
        <StatCard label="对照组" value={String(artifact.comparator_n ?? "—")} />
        <StatCard label="提取变量" value={String(artifact.variables_extracted ?? "—")} />
      </div>
      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">变量清单</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {["变量", "类型", "OMOP 表"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-medium text-slate-600">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {variables.map((v) => (
                <tr key={v.name} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-mono text-xs">{v.name}</td>
                  <td className="px-3 py-2 text-slate-600">{v.type}</td>
                  <td className="px-3 py-2 text-slate-500">{v.omop_table}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {sample.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">样本数据（脱敏）</h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr>
                  {Object.keys(sample[0]).map((k) => (
                    <th key={k} className="px-2 py-2 text-left font-medium text-slate-600">
                      {k}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sample.map((row, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    {Object.values(row).map((v, j) => (
                      <td key={j} className="px-2 py-1.5 font-mono">
                        {String(v)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

export function DataCleaningView({ artifact }: { artifact: Record<string, unknown> }) {
  const steps = (artifact.cleaning_steps as Array<Record<string, unknown>>) ?? [];

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex flex-wrap gap-4">
        <StatCard label="原始 N" value={String(artifact.raw_n ?? "—")} />
        <StatCard label="清洗后 N" value={String(artifact.final_n ?? "—")} highlight />
        <StatCard label="质量评分" value={String(artifact.quality_score ?? "—")} />
        <StatCard label="缺失率" value={String(artifact.missing_rate_overall ?? "—")} />
      </div>
      {artifact.summary && (
        <p className="text-sm text-slate-600">{String(artifact.summary)}</p>
      )}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">清洗步骤</h3>
        <div className="space-y-2">
          {steps.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium text-slate-800">{String(s.action)}</p>
                <p className="text-xs text-slate-500">{String(s.method)}</p>
              </div>
              <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs text-violet-700">
                n={String(s.n_affected)}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function StatisticalAnalysisView({ artifact }: { artifact: Record<string, unknown> }) {
  const table1 = (artifact.table1 as Array<Record<string, unknown>>) ?? [];

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="rounded-xl bg-gradient-to-r from-rose-50 to-violet-50 border border-rose-100 p-5">
        <p className="text-sm text-slate-600">{String(artifact.method)}</p>
        <p className="mt-2 text-3xl font-bold text-rose-700">
          HR = {String(artifact.hazard_ratio)}{" "}
          <span className="text-lg font-normal text-slate-500">
            (95% CI {String(artifact.ci_95_low)}–{String(artifact.ci_95_high)})
          </span>
        </p>
        <p className="mt-1 text-sm text-slate-600">
          p = {String(artifact.p_value)} · Primary: {String(artifact.primary_outcome)}
        </p>
      </div>
      {artifact.summary && (
        <p className="text-sm text-slate-600">{String(artifact.summary)}</p>
      )}
      {table1.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">
            Table 1 — 基线特征
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {["Variable", "Intervention", "Comparator", "SMD"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-medium text-slate-600">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table1.map((r) => (
                  <tr key={String(r.variable)} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium">{String(r.variable)}</td>
                    <td className="px-3 py-2">{String(r.intervention)}</td>
                    <td className="px-3 py-2">{String(r.comparator)}</td>
                    <td className="px-3 py-2 font-mono text-xs">{String(r.smd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {Array.isArray(artifact.subgroups) && (
        <ForestPlotChart
          data={artifact.subgroups as Array<{ subgroup: string; hr: number; ci_low: number; ci_high: number }>}
        />
      )}
    </div>
  );
}

export function VisualizationView({ artifact }: { artifact: Record<string, unknown> }) {
  const km = (artifact.kaplan_meier as Array<{ month: number; survival_intervention: number; survival_comparator: number }>) ?? [];
  const forest = (artifact.forest_plot as Array<{ subgroup: string; hr: number; ci_low: number; ci_high: number }>) ?? [];
  const love = (artifact.love_plot as Array<{ covariate: string; smd_before: number; smd_after: number }>) ?? [];

  return (
    <div className="space-y-5">
      {artifact.summary && (
        <p className="text-sm text-slate-600">{String(artifact.summary)}</p>
      )}
      <div className="grid gap-5 lg:grid-cols-2">
        {km.length > 0 && <KaplanMeierChart data={km} />}
        {love.length > 0 && <LovePlotChart data={love} />}
      </div>
      {forest.length > 0 && <ForestPlotChart data={forest} />}
      {artifact.log_rank_p != null && (
        <p className="text-xs text-slate-400">Log-rank p = {String(artifact.log_rank_p)}</p>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-5 py-3 shadow-sm ${
        highlight ? "border-rose-200 bg-gradient-to-br from-rose-50 to-violet-50" : "border-slate-200 bg-white"
      }`}
    >
      <p className={`text-2xl font-bold ${highlight ? "text-rose-600" : "text-violet-700"}`}>
        {value}
      </p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
