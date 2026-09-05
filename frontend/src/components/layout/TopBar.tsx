"use client";

import { usePathname } from "next/navigation";
import { IconPlus, IconRefresh, IconUser, IconWallet } from "@/components/IconFont";
import { useApp } from "@/context/AppContext";

const PAGE_TITLES: Record<string, string> = {
  "/": "科学导航",
  "/research": "深度研究",
  "/read": "读 · 文献调研",
  "/compute": "算 · 数据分析",
  "/produce": "做 · 科研产出",
  "/imaging": "影像标注与病理分级",
  "/clinical/nact-ovarian": "卵巢癌 NACT 多模态预测",
  "/clinical/genomics": "基因组多源数据",
  "/apps": "Apps 工具库",
  "/knowledge": "垂类知识库",
};

const AUTH_BASE = "http://118.195.160.99";
const TOKEN_RECHARGE_URL = `${AUTH_BASE}/dashboard/overview`;
const LOGIN_URL = AUTH_BASE;

export function TopBar() {
  const pathname = usePathname();
  const { refreshStudies, refreshConfig, checkBackend, backendOnline, setShowNewStudyModal } =
    useApp();

  const title =
    Object.entries(PAGE_TITLES).find(([k]) =>
      k === "/" ? pathname === "/" : pathname.startsWith(k)
    )?.[1] ?? "MedNexus GynOnc";

  const handleRefresh = async () => {
    await checkBackend();
    await refreshConfig();
    await refreshStudies();
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="min-w-0">
        <h1 className="text-base font-semibold text-slate-900">{title}</h1>
        <div className="mt-0.5 flex items-center gap-2">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              backendOnline === null
                ? "bg-slate-300"
                : backendOnline
                  ? "bg-emerald-500"
                  : "bg-red-500"
            }`}
          />
          <p className="text-xs text-slate-400">
            {backendOnline === null
              ? "检测后端…"
              : backendOnline
                ? "后端已连接"
                : "后端未连接 · 请确认 uvicorn 运行在 8000 端口"}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <a
          href={TOKEN_RECHARGE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        >
          <IconWallet size={14} color="#64748b" />
          Token 充值
        </a>
        <a
          href={LOGIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
        >
          <IconUser size={14} color="#fff" />
          登录
        </a>
        <div className="mx-1 h-5 w-px bg-slate-200" />
        <button
          onClick={handleRefresh}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
          title="刷新"
        >
          <IconRefresh size={16} />
        </button>
        {pathname !== "/" && (
          <button
            onClick={() => setShowNewStudyModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-xs font-medium text-white hover:bg-rose-700"
          >
            <IconPlus size={14} color="#fff" />
            新建
          </button>
        )}
      </div>
    </header>
  );
}
