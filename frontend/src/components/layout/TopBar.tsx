"use client";

import { usePathname } from "next/navigation";
import { IconPlus, IconRefresh, IconUser, IconWallet } from "@/components/IconFont";
import { AGENT_EDITION_META, getEditionTheme } from "@/lib/agent-editions";
import { useApp } from "@/context/AppContext";

const PAGE_TITLES: Record<string, string> = {
  "/": "工作台",
  "/navigator": "科学导航",
  "/research": "深度研究",
  "/read": "读 · 文献调研",
  "/compute": "算 · 数据分析",
  "/produce": "做 · 科研产出",
  "/cases": "病例详情",
  "/omics": "多组学分析",
  "/imaging": "影像组学 · CT + PCI",
  "/genomics": "基因组组学",
  "/stratification": "患者富集分层",
  "/biomarkers": "生物标志物发现",
  "/targets": "靶点发现",
  "/clinical/nact-ovarian": "NACT 多模态预测",
  "/apps": "Apps 工具库",
  "/knowledge": "垂类知识库",
};

const AUTH_BASE = "http://118.195.160.99";
const TOKEN_RECHARGE_URL = `${AUTH_BASE}/dashboard/overview`;
const LOGIN_URL = AUTH_BASE;

export function TopBar() {
  const pathname = usePathname();
  const {
    refreshStudies,
    refreshConfig,
    checkBackend,
    backendOnline,
    setShowNewStudyModal,
    agentEdition,
    canAccess,
  } = useApp();
  const editionMeta = AGENT_EDITION_META[agentEdition];
  const theme = getEditionTheme(agentEdition);

  const title =
    Object.entries(PAGE_TITLES).find(([k]) =>
      k === "/" ? pathname === "/" : pathname.startsWith(k)
    )?.[1] ?? "MedNexus GynOnc";

  const backendLabel =
    backendOnline === null
      ? "检测后端…"
      : backendOnline
        ? "后端已连接"
        : "后端未连接";

  const handleRefresh = async () => {
    await checkBackend();
    await refreshConfig();
    await refreshStudies();
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-6 border-b border-slate-200 bg-white px-6">
      <div className="flex min-w-0 items-center gap-3">
        <h1 className="truncate text-base font-semibold text-slate-900">{title}</h1>
        <span className="hidden h-4 w-px shrink-0 bg-slate-200 sm:block" aria-hidden />
        <span className={`hidden shrink-0 text-xs font-medium sm:inline ${theme.subtitleClass}`}>
          {editionMeta.shortLabel}
        </span>
        <span
          className={`hidden shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] md:inline-flex ${
            backendOnline === false
              ? "bg-red-50 text-red-600"
              : backendOnline
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-500"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              backendOnline === null
                ? "bg-slate-400"
                : backendOnline
                  ? "bg-emerald-500"
                  : "bg-red-500"
            }`}
          />
          {backendLabel}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <a
          href={TOKEN_RECHARGE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        >
          <IconWallet size={14} color="#64748b" />
          Token 充值
        </a>
        <a
          href={LOGIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
        >
          <IconUser size={14} color="#fff" />
          登录
        </a>
        <span className="mx-0.5 h-5 w-px shrink-0 bg-slate-200" aria-hidden />
        <button
          type="button"
          onClick={handleRefresh}
          className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
          title="刷新"
        >
          <IconRefresh size={16} />
        </button>
        {pathname !== "/" && agentEdition === "research" && canAccess("research_pipeline") && (
          <button
            type="button"
            onClick={() => setShowNewStudyModal(true)}
            className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium text-white ${theme.btnSolidClass}`}
          >
            <IconPlus size={14} color="#fff" />
            新建
          </button>
        )}
      </div>
    </header>
  );
}
