"use client";

import { useApp } from "@/context/AppContext";
import { useRouter } from "next/navigation";

/** Apps 工具库 — 对标玻尔 Apps Store */
export function AppsView() {
  const { config, setShowNewStudyModal } = useApp();
  const router = useRouter();
  const tools = config?.app_tools ?? [];

  const routes: Record<string, string> = {
    "PICO 结构化": "/read",
    "Evidence Table": "/read",
    "OMOP 队列构建": "/compute",
    "Cox/PSM 分析": "/compute",
    "KM / Forest Plot": "/compute",
    "Research Report": "/produce",
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="mx-auto max-w-5xl px-6 py-8">
      <p className="text-sm text-slate-500">
        集成科研工具，覆盖文献调研、数据分析、报告生成全场景
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <button
            key={tool.name}
            onClick={() => {
              const path = routes[tool.name];
              if (path) router.push(path);
              else setShowNewStudyModal(true);
            }}
            className="rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-rose-200 hover:shadow-sm"
          >
            <span className="rounded bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700">
              {tool.category}
            </span>
            <p className="mt-2 font-medium text-slate-800">{tool.name}</p>
            <p className="mt-1 text-xs text-slate-500">{tool.desc}</p>
          </button>
        ))}
      </div>
    </div>
    </div>
  );
}
