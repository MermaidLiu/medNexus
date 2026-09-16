"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { AGENT_EDITION_META, getEditionTheme, type FeatureKey } from "@/lib/agent-editions";
import { IconPlus, NavIcon, type NavIconName } from "@/components/IconFont";
import { AgentEditionSwitcher } from "./AgentEditionSwitcher";

type NavLink = {
  href: string;
  label: string;
  icon: NavIconName;
  feature: FeatureKey;
  external?: boolean;
  editions?: ("research" | "pharma")[];
};

type NavSection = {
  title: string;
  items: NavLink[];
  editions?: ("research" | "pharma")[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    title: "工作台",
    items: [
      { href: "/", label: "首页 · 病例队列", icon: "compass", feature: "research_home", editions: ["research"] },
      { href: "/", label: "首页 · 研发管线", icon: "compass", feature: "pharma_home", editions: ["pharma"] },
      { href: "/omics", label: "多组学分析", icon: "chart", feature: "multi_omics" },
    ],
  },
  {
    title: "科研训练",
    editions: ["research"],
    items: [
      { href: "/navigator", label: "科学导航", icon: "compass", feature: "navigator" },
      { href: "/research", label: "深度研究", icon: "experiment", feature: "research_pipeline" },
      { href: "/read", label: "读 · 文献", icon: "book", feature: "literature_understanding" },
      { href: "/compute", label: "算 · 分析", icon: "chart", feature: "compute_analysis" },
      { href: "/produce", label: "做 · 产出", icon: "file", feature: "produce_report" },
    ],
  },
  {
    title: "药企研发",
    editions: ["pharma"],
    items: [
      { href: "/stratification", label: "患者富集分层", icon: "clinical", feature: "patient_stratification" },
      { href: "/biomarkers", label: "标志物发现", icon: "experiment", feature: "biomarker_discovery" },
      { href: "/targets", label: "靶点发现", icon: "genome", feature: "target_discovery" },
    ],
  },
  {
    title: "多组学模块",
    items: [
      { href: "/imaging", label: "影像组学 · PCI", icon: "scan", feature: "imaging_omics" },
      { href: "/genomics", label: "基因组组学", icon: "genome", feature: "genomics_omics" },
      { href: "/clinical/nact-ovarian", label: "NACT 预测", icon: "clinical", feature: "nact_multimodal", editions: ["pharma"] },
    ],
  },
  {
    title: "资源",
    items: [
      { href: "/apps", label: "Apps 工具库", icon: "apps", feature: "apps_tools", editions: ["research"] },
      { href: "/knowledge", label: "垂类知识库", icon: "database", feature: "knowledge_base" },
      {
        href: "http://122.51.204.136/mland",
        label: "医疗 Skill 广场",
        icon: "skill",
        feature: "skills_plaza",
        external: true,
      },
    ],
  },
];

function ExternalNavItem({ href, label, icon }: { href: string; label: string; icon: NavIconName }) {
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
  theme,
}: {
  href: string;
  label: string;
  icon: NavIconName;
  active: boolean;
  theme: ReturnType<typeof getEditionTheme>;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
        active ? theme.navActiveClass : "text-slate-600 hover:bg-white hover:text-slate-900"
      }`}
    >
      <NavIcon name={icon} size={18} color={active ? theme.navIconActive : "#64748b"} />
      <span className="flex-1 truncate">{label}</span>
    </Link>
  );
}

export function LeftNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { studies, setShowNewStudyModal, agentEdition, setAgentEdition, canAccess } = useApp();
  const editionMeta = AGENT_EDITION_META[agentEdition];
  const theme = getEditionTheme(agentEdition);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const handleEditionChange = (edition: typeof agentEdition) => {
    setAgentEdition(edition);
    router.push("/");
  };

  const showNewStudy = agentEdition === "research" && canAccess("research_pipeline");

  return (
    <aside className="flex w-[260px] shrink-0 flex-col border-r border-slate-200 bg-[#f7f8fa]">
      <div className="border-b border-slate-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${theme.accentClass} text-sm font-bold text-white`}
          >
            MN
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900">MedNexus</p>
            <p className={`truncate text-xs ${theme.subtitleClass}`}>{editionMeta.shortLabel} · 科研平台</p>
          </div>
        </div>
        <div className="mt-3">
          <AgentEditionSwitcher edition={agentEdition} onChange={handleEditionChange} compact />
        </div>
      </div>

      {showNewStudy && (
        <div className="px-4 pt-4">
          <button
            onClick={() => setShowNewStudyModal(true)}
            className={`flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-white shadow-sm ${theme.btnPrimaryClass}`}
          >
            <IconPlus size={14} color="#fff" />
            新建研究
          </button>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4">
        {NAV_SECTIONS.map((section) => {
          if (section.editions && !section.editions.includes(agentEdition)) return null;
          const items = section.items.filter((item) => {
            if (item.editions && !item.editions.includes(agentEdition)) return false;
            return canAccess(item.feature);
          });
          if (items.length === 0) return null;
          return (
            <div key={section.title} className="mb-6 last:mb-0">
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {section.title}
              </p>
              <div className="space-y-1">
                {items.map((item) =>
                  item.external ? (
                    <ExternalNavItem key={item.href + item.label} {...item} />
                  ) : (
                    <NavItem
                      key={item.href + item.label}
                      {...item}
                      active={isActive(item.href)}
                      theme={theme}
                    />
                  )
                )}
              </div>
            </div>
          );
        })}

        {showNewStudy && (
          <>
            <p className="mb-2 mt-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
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
          </>
        )}
      </nav>

      <div className="border-t border-slate-200 px-4 py-3">
        <p className="text-center text-[10px] leading-relaxed text-slate-400">{editionMeta.tagline}</p>
      </div>
    </aside>
  );
}
