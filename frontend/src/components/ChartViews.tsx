"use client";

interface KMPoint {
  month: number;
  survival_intervention: number;
  survival_comparator: number;
}

interface ForestRow {
  subgroup: string;
  hr: number;
  ci_low: number;
  ci_high: number;
}

interface LoveRow {
  covariate: string;
  smd_before: number;
  smd_after: number;
}

export function KaplanMeierChart({ data }: { data: KMPoint[] }) {
  const w = 480;
  const h = 280;
  const pad = { t: 20, r: 20, b: 40, l: 50 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;

  const toX = (m: number) => pad.l + (m / 36) * iw;
  const toY = (s: number) => pad.t + (1 - s) * ih;

  const path = (key: "survival_intervention" | "survival_comparator") =>
    data
      .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(p.month)} ${toY(p[key])}`)
      .join(" ");

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h4 className="mb-2 text-sm font-semibold text-slate-700">
        Kaplan-Meier 生存曲线
      </h4>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-lg">
        {[0.75, 0.8, 0.85, 0.9, 0.95, 1.0].map((s) => (
          <g key={s}>
            <line
              x1={pad.l}
              y1={toY(s)}
              x2={w - pad.r}
              y2={toY(s)}
              stroke="#e2e8f0"
              strokeDasharray="4"
            />
            <text x={pad.l - 8} y={toY(s) + 4} textAnchor="end" fontSize={10} fill="#94a3b8">
              {(s * 100).toFixed(0)}%
            </text>
          </g>
        ))}
        <path d={path("survival_intervention")} fill="none" stroke="#2b7cd3" strokeWidth={2.5} />
        <path d={path("survival_comparator")} fill="none" stroke="#ef4444" strokeWidth={2.5} />
        <text x={w / 2} y={h - 8} textAnchor="middle" fontSize={11} fill="#64748b">
          Months
        </text>
        <text
          x={14}
          y={h / 2}
          textAnchor="middle"
          fontSize={11}
          fill="#64748b"
          transform={`rotate(-90, 14, ${h / 2})`}
        >
          Survival
        </text>
        <circle cx={pad.l + 10} cy={pad.t + 10} r={4} fill="#2b7cd3" />
        <text x={pad.l + 20} y={pad.t + 14} fontSize={10} fill="#334155">
          Intervention
        </text>
        <circle cx={pad.l + 110} cy={pad.t + 10} r={4} fill="#ef4444" />
        <text x={pad.l + 120} y={pad.t + 14} fontSize={10} fill="#334155">
          Comparator
        </text>
      </svg>
    </div>
  );
}

export function ForestPlotChart({ data }: { data: ForestRow[] }) {
  const rowH = 36;
  const h = data.length * rowH + 60;
  const w = 420;
  const pad = { l: 120, r: 40, t: 30, b: 20 };
  const minHr = 0.5;
  const maxHr = 1.5;
  const toX = (hr: number) =>
    pad.l + ((Math.min(maxHr, Math.max(minHr, hr)) - minHr) / (maxHr - minHr)) * (w - pad.l - pad.r);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h4 className="mb-2 text-sm font-semibold text-slate-700">Forest Plot（亚组分析）</h4>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-lg">
        <line
          x1={toX(1)}
          y1={pad.t - 10}
          x2={toX(1)}
          y2={h - pad.b}
          stroke="#94a3b8"
          strokeDasharray="4"
        />
        {data.map((row, i) => {
          const y = pad.t + i * rowH + rowH / 2;
          return (
            <g key={row.subgroup}>
              <text x={pad.l - 8} y={y + 4} textAnchor="end" fontSize={10} fill="#334155">
                {row.subgroup}
              </text>
              <line
                x1={toX(row.ci_low)}
                y1={y}
                x2={toX(row.ci_high)}
                y2={y}
                stroke="#2b7cd3"
                strokeWidth={2}
              />
              <rect
                x={toX(row.hr) - 4}
                y={y - 4}
                width={8}
                height={8}
                fill="#2b7cd3"
                transform={`rotate(45 ${toX(row.hr)} ${y})`}
              />
              <text x={w - pad.r + 8} y={y + 4} fontSize={9} fill="#64748b">
                {row.hr} ({row.ci_low}–{row.ci_high})
              </text>
            </g>
          );
        })}
        <text x={toX(1)} y={h - 4} textAnchor="middle" fontSize={10} fill="#64748b">
          HR = 1
        </text>
      </svg>
    </div>
  );
}

export function LovePlotChart({ data }: { data: LoveRow[] }) {
  const rowH = 28;
  const h = data.length * rowH + 40;
  const w = 400;
  const pad = { l: 90, r: 20, t: 20, b: 30 };
  const maxSmd = 0.2;
  const toX = (smd: number) =>
    pad.l + (Math.min(maxSmd, smd) / maxSmd) * (w - pad.l - pad.r);
  const refX = toX(0.1);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h4 className="mb-2 text-sm font-semibold text-slate-700">
        Love Plot（PSM 平衡性）
      </h4>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-lg">
        <line
          x1={refX}
          y1={pad.t - 5}
          x2={refX}
          y2={h - pad.b}
          stroke="#f59e0b"
          strokeDasharray="4"
        />
        <text x={refX} y={h - 8} textAnchor="middle" fontSize={9} fill="#f59e0b">
          SMD=0.1
        </text>
        {data.map((row, i) => {
          const y = pad.t + i * rowH + rowH / 2;
          return (
            <g key={row.covariate}>
              <text x={pad.l - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#334155">
                {row.covariate}
              </text>
              <circle cx={toX(row.smd_before)} cy={y} r={5} fill="#ef4444" opacity={0.7} />
              <circle cx={toX(row.smd_after)} cy={y} r={5} fill="#2b7cd3" />
            </g>
          );
        })}
        <circle cx={pad.l + 10} cy={pad.t + 6} r={4} fill="#ef4444" opacity={0.7} />
        <text x={pad.l + 20} y={pad.t + 10} fontSize={9} fill="#64748b">
          Before PSM
        </text>
        <circle cx={pad.l + 100} cy={pad.t + 6} r={4} fill="#2b7cd3" />
        <text x={pad.l + 110} y={pad.t + 10} fontSize={9} fill="#64748b">
          After PSM
        </text>
      </svg>
    </div>
  );
}
