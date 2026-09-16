"use client";

import type { ComponentType, ReactNode } from "react";

type Props = { size?: number; className?: string; color?: string };

function Svg({
  size = 16,
  className = "",
  color = "currentColor",
  children,
}: Props & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1024 1024"
      fill={color}
      className={`shrink-0 ${className}`}
      aria-hidden
    >
      {children}
    </svg>
  );
}

/** 阿里巴巴 IconFont 风格 — 与 MedNexus 主站一致 */

export function IconDiagnosis(p: Props) {
  return (
    <Svg {...p}>
      <path d="M341.333 213.333c0-94.293 76.374-170.667 170.667-170.667S682.667 119.04 682.667 213.333c0 70.4-42.667 130.987-103.467 157.014L512 768l-67.2-397.653C383.467 344.32 341.333 283.733 341.333 213.333zM512 128c47.147 0 85.333 38.187 85.333 85.333S559.147 298.667 512 298.667 426.667 260.48 426.667 213.333 464.853 128 512 128zM256 725.333h512v85.334H256v-85.334z" />
    </Svg>
  );
}

export function IconUsers(p: Props) {
  return (
    <Svg {...p}>
      <path d="M682.667 512c94.293 0 170.667-76.373 170.666-170.667S776.96 170.667 682.667 170.667 512 247.04 512 341.333s76.373 170.667 170.667 170.667zm0 85.333c-113.92 0-341.334 57.174-341.334 170.667v85.333h682.667V768c0-113.493-227.414-170.667-341.333-170.667zM341.333 512c94.293 0 170.667-76.373 170.667-170.667S435.627 170.667 341.333 170.667 170.667 247.04 170.667 341.333 247.04 512 341.333 512zm0 85.333C227.413 597.333 0 654.507 0 768v85.333h256V768c0-70.4 42.667-130.987 85.333-170.667z" />
    </Svg>
  );
}

export function IconFile(p: Props) {
  return (
    <Svg {...p}>
      <path d="M256 128h341.333l170.667 170.667V896H256V128zm341.333 0v170.667h170.667L597.333 128zm-85.333 341.333h256v85.334H512v-85.334zm0 170.667h256v85.333H512v-85.333z" />
    </Svg>
  );
}

export function IconBook(p: Props) {
  return (
    <Svg {...p}>
      <path d="M170.667 170.667h682.666v682.666H170.667V170.667zm85.333 85.333v512h512V256H256zm85.334 85.334h341.333v85.333H341.334v-85.333zm0 170.666h256v85.334H341.334v-85.334z" />
    </Svg>
  );
}

export function IconGuide(p: Props) {
  return (
    <Svg {...p}>
      <path d="M384 170.667h256v128H384V170.667zm85.333 213.333H298.667v384h426.666V384H554.667v85.333H469.333V384zm85.334 170.667v128h85.333V554.667H554.667z" />
    </Svg>
  );
}

export function IconExperiment(p: Props) {
  return (
    <Svg {...p}>
      <path d="M256 128h512l-85.333 256H341.333L256 128zm170.667 341.333h170.666L768 896H256l170.667-426.667zM384 512l-64 170.667h384L640 512H384z" />
    </Svg>
  );
}

export function IconChart(p: Props) {
  return (
    <Svg {...p}>
      <path d="M170.667 768V426.667h170.666V768H170.667zm256 0V298.667h170.666V768H426.667zm256 0V170.667H853.333V768H682.667z" />
    </Svg>
  );
}

export function IconMessage(p: Props) {
  return (
    <Svg {...p}>
      <path d="M128 170.667h768c47.147 0 85.333 38.187 85.333 85.333v384c0 47.147-38.186 85.333-85.333 85.334H384l-170.667 128v-128H128c-47.147 0-85.333-38.187-85.333-85.334V256c0-47.146 38.186-85.333 85.333-85.333zm85.333 170.666v85.334h512V341.333H213.333zm0 170.667v85.333h341.333V512H213.333z" />
    </Svg>
  );
}

export function IconSkill(p: Props) {
  return (
    <Svg {...p}>
      <path d="M512 128l341.333 170.667v256L512 725.333 170.667 554.667V298.667L512 128zm0 94.934L298.667 308.267v196.266L512 640l213.333-135.467V308.267L512 222.934zM128 768h768v85.333H128V768z" />
    </Svg>
  );
}

export function IconOvarian(p: Props) {
  return (
    <Svg {...p}>
      <path d="M512 128c-141.44 0-256 114.56-256 256 0 98.133 55.467 183.467 136.533 226.133L512 896l119.467-285.867C712.533 567.467 768 482.133 768 384c0-141.44-114.56-256-256-256zm0 85.333c94.293 0 170.667 76.374 170.667 170.667S606.293 554.667 512 554.667 341.333 478.293 341.333 384s76.374-170.667 170.667-170.667z" />
    </Svg>
  );
}

export function IconUser(p: Props) {
  return (
    <Svg {...p}>
      <path d="M512 512c94.293 0 170.667-76.373 170.667-170.667S606.293 170.667 512 170.667 341.333 247.04 341.333 341.333 417.707 512 512 512zm0 85.333c-113.92 0-341.333 57.174-341.333 170.667V853.333h682.666V768c0-113.493-227.413-170.667-341.333-170.667z" />
    </Svg>
  );
}

export function IconExternalLink(p: Props) {
  return (
    <Svg {...p}>
      <path d="M682.667 170.667h170.666v170.666h-85.333V349.44L554.667 552.107l-60.331-60.33L707.669 289.067H682.667V170.667zm-512 85.333h384v85.334H256v256h512v-256h85.333v341.333H170.667V256z" />
    </Svg>
  );
}

export function IconClose(p: Props) {
  return (
    <Svg {...p}>
      <path d="M810.667 273.92L750.08 213.333 512 451.413 273.92 213.333 213.333 273.92 451.413 512 213.333 750.08 273.92 810.667 512 572.587 750.08 810.667 810.667 750.08 572.587 512 810.667 273.92z" />
    </Svg>
  );
}

export function IconPlus(p: Props) {
  return (
    <Svg {...p}>
      <path d="M512 170.667c23.467 0 42.667 19.2 42.667 42.666v256h256c23.467 0 42.667 19.2 42.667 42.667s-19.2 42.667-42.667 42.667H554.667v256c0 23.467-19.2 42.667-42.667 42.666s-42.667-19.2-42.666-42.666V554.667H213.333c-23.467 0-42.667-19.2-42.666-42.667s19.2-42.667 42.666-42.667h256V213.333c0-23.467 19.2-42.666 42.667-42.666z" />
    </Svg>
  );
}

export type SidebarIconName =
  | "diagnosis"
  | "users"
  | "file"
  | "book"
  | "guide"
  | "experiment"
  | "chart"
  | "message"
  | "skill"
  | "ovarian";

const SIDEBAR_ICON_MAP: Record<SidebarIconName, ComponentType<Props>> = {
  diagnosis: IconDiagnosis,
  users: IconUsers,
  file: IconFile,
  book: IconBook,
  guide: IconGuide,
  experiment: IconExperiment,
  chart: IconChart,
  message: IconMessage,
  skill: IconSkill,
  ovarian: IconOvarian,
};

export function SidebarIcon({ name, ...props }: Props & { name: SidebarIconName }) {
  const Comp = SIDEBAR_ICON_MAP[name];
  if (!Comp) return null;
  return <Comp {...props} />;
}
