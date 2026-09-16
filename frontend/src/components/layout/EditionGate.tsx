"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  AGENT_EDITION_META,
  canAccessRoute,
  routeFeatureForEdition,
  FEATURE_LABELS,
  editionForFeature,
  type AgentEdition,
} from "@/lib/agent-editions";

type Props = {
  edition: AgentEdition;
  children: React.ReactNode;
};

export function EditionGate({ edition, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const allowed = canAccessRoute(edition, pathname);
  const feature = routeFeatureForEdition(pathname, edition);

  useEffect(() => {
    if (!allowed) {
      const home = AGENT_EDITION_META[edition].homeRoute;
      if (pathname !== home) {
        router.replace(home);
      }
    }
  }, [allowed, edition, pathname, router]);

  if (allowed) return <>{children}</>;

  const owners = feature ? editionForFeature(feature) : [];
  const meta = AGENT_EDITION_META[edition];

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div
        className={`rounded-2xl bg-gradient-to-br ${meta.accentClass} px-6 py-3 text-sm font-semibold text-white shadow-md`}
      >
        当前：{meta.label}
      </div>
      <h2 className="text-lg font-semibold text-slate-800">无权访问此模块</h2>
      <p className="max-w-md text-sm leading-relaxed text-slate-500">
        {feature ? (
          <>
            「{FEATURE_LABELS[feature]}」属于{" "}
            {owners.map((e) => AGENT_EDITION_META[e].shortLabel).join(" / ")} 能力范围。
            请切换 Agent 版本，或联系管理员开通授权。
          </>
        ) : (
          "请切换 Agent 版本后重试。"
        )}
      </p>
      <button
        type="button"
        onClick={() => router.push(meta.homeRoute)}
        className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
      >
        返回{meta.shortLabel}首页
      </button>
    </div>
  );
}
