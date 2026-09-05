"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { IconPlus, NavIcon, type NavIconName } from "@/components/IconFont";

const MAIN_NAV: { href: string; label: string; icon: NavIconName }[] = [
  { href: "/", label: "科学导航", icon: "compass" },
  { href: "/research", label: "深度研究", icon: "experiment" },
];

const READ_COMPUTE_DO: { href: string; label: string; icon: NavIconName }[] = [
  { href: "/read", label: "读 · 文献", icon: "book" },
  { href: "/compute", label: "算 · 分析", icon: "chart" },
  { href: "/produce", label: "做 · 产出", icon: "file" },
];

const CLINICAL_DECISION_NAV: { href: string; label: string; icon: NavIconName }[] = [
  { href: "/clinical/nact-ovarian", label: "卵巢癌 NACT 预测", icon: "clinical" },
  { href: "/clinical/genomics", label: "基因组多源数据", icon: "genome" },
];

const CLINICAL_NAV: { href: string; label: string; icon: NavIconName }[] = [
  { href: "/imaging", label: "影像标注与病理分级", icon: "scan" },
];

const RESOURCE_NAV: { href: string; label: string; icon: NavIconName }[] = [
  { href: "/apps", label: "Apps 工具库", icon: "apps" },
  { href: "/knowledge", label: "垂类知识库", icon: "database" },
];

const EXTERNAL_RESOURCE_NAV: {
  href: string;
  label: string;
  icon: NavIconName;
}[] = [
  {
    href: "http://122.51.204.136/mland",
    label: "医疗 Skill 广场",
    icon: "skill",
  },
];

function ExternalNavItem({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: NavIconName;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 transition-colors hover:bg-white hover:text-slate-900"
    >
      <NavIcon name={icon} size={18} color="#64748b" />
      <span className="flex-1 truncate">{label}</span>
      <span className="text-[10px] text-slate-400">↗</span>
    </a>
  );
}

function NavItem({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: NavIconName;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
        active
          ? "bg-rose-50 font-medium text-rose-700 ring-1 ring-rose-200/80"
          : "text-slate-600 hover:bg-white hover:text-slate-900"
      }`}
    >
      <NavIcon
        name={icon}
        size={18}
        color={active ? "#e11d48" : "#64748b"}
      />
      <span className="flex-1 truncate">{label}</span>
    </Link>
  );
}

export function LeftNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { studies, setShowNewStudyModal } = useApp();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="flex w-[260px] shrink-0 flex-col border-r border-slate-200 bg-[#f7f8fa]">
      <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-violet-600 text-sm font-bold text-white">
          MN
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-900">MedNexus</p>
          <p className="truncate text-xs text-rose-600">GynOnc · 妇科肿瘤 AI4S</p>
        </div>
      </div>

      <div className="px-4 pt-4">
        <button
          onClick={() => setShowNewStudyModal(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-rose-500 to-violet-600 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-90"
        >
          <IconPlus size={14} color="#fff" />
          新建研究
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          科研空间站
        </p>
        <div className="space-y-1">
          {MAIN_NAV.map((item) => (
            <NavItem key={item.href} {...item} active={isActive(item.href)} />
          ))}
        </div>

        <p className="mb-2 mt-6 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          读 · 算 · 做
        </p>
        <div className="space-y-1">
          {READ_COMPUTE_DO.map((item) => (
            <NavItem key={item.href} {...item} active={isActive(item.href)} />
          ))}
        </div>

        <p className="mb-2 mt-6 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          临床决策
        </p>
        <div className="space-y-1">
          {CLINICAL_DECISION_NAV.map((item) => (
            <NavItem key={item.href} {...item} active={isActive(item.href)} />
          ))}
        </div>

        <p className="mb-2 mt-6 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          临床工具
        </p>
        <div className="space-y-1">
          {CLINICAL_NAV.map((item) => (
            <NavItem key={item.href} {...item} active={isActive(item.href)} />
          ))}
        </div>

        <p className="mb-2 mt-6 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          资源
        </p>
        <div className="space-y-1">
          {RESOURCE_NAV.map((item) => (
            <NavItem key={item.href} {...item} active={isActive(item.href)} />
          ))}
          {EXTERNAL_RESOURCE_NAV.map((item) => (
            <ExternalNavItem key={item.href} {...item} />
          ))}
        </div>

        <p className="mb-2 mt-6 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          我的研究
        </p>
        {studies.length === 0 ? (
          <p className="px-3 text-xs leading-relaxed text-slate-400">暂无研究项目</p>
        ) : (
          <ul className="space-y-1">
            {studies.slice(0, 8).map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => router.push(`/research?id=${s.id}`)}
                  className="w-full rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-white hover:shadow-sm"
                >
                  <p className="line-clamp-2 text-xs font-medium leading-relaxed text-slate-700">
                    {s.topic}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {s.progress}% · {s.status}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </nav>

      <div className="border-t border-slate-200 px-4 py-3">
        <p className="text-center text-[10px] text-slate-400">Science Navigator</p>
      </div>
    </aside>
  );
}
