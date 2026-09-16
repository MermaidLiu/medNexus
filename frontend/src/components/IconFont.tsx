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

export function IconCompass(p: Props) {
  return (
    <Svg {...p}>
      <path d="M512 85.333c235.648 0 426.667 191.019 426.667 426.667S747.648 938.667 512 938.667 85.333 747.648 85.333 512 276.352 85.333 512 85.333zm0 85.334c-188.523 0-341.333 152.81-341.333 341.333S323.477 853.333 512 853.333 853.333 700.523 853.333 512 700.523 170.667 512 170.667zm-42.667 128l256 128-128 256-256-128 128-256zm85.334 170.666l-85.334 42.667 42.667 85.334 85.333-42.667-42.666-85.334z" />
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

export function IconBook(p: Props) {
  return (
    <Svg {...p}>
      <path d="M170.667 170.667h682.666v682.666H170.667V170.667zm85.333 85.333v512h512V256H256zm85.334 85.334h341.333v85.333H341.334v-85.333zm0 170.666h256v85.334H341.334v-85.334z" />
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

export function IconFile(p: Props) {
  return (
    <Svg {...p}>
      <path d="M256 128h341.333l170.667 170.667V896H256V128zm341.333 0v170.667h170.667L597.333 128zm-85.333 341.333h256v85.334H512v-85.334zm0 170.667h256v85.333H512v-85.333z" />
    </Svg>
  );
}

export function IconApps(p: Props) {
  return (
    <Svg {...p}>
      <path d="M213.333 213.333h256v256h-256v-256zm341.334 0h256v256h-256v-256zM213.333 554.667h256v256h-256v-256zm341.334 0h256v256h-256v-256z" />
    </Svg>
  );
}

export function IconDatabase(p: Props) {
  return (
    <Svg {...p}>
      <path d="M512 170.667c235.648 0 426.667 76.8 426.667 170.666S747.648 512 512 512 85.333 435.2 85.333 341.333 276.352 170.667 512 170.667zm0 85.333c-188.523 0-341.333 38.4-341.333 85.333S323.477 426.667 512 426.667s341.333-38.4 341.333-85.334S700.523 256 512 256zm0 256c235.648 0 426.667 76.8 426.667 170.667S747.648 853.333 512 853.333 85.333 776.533 85.333 682.667 276.352 512 512 512zm0 85.333c-188.523 0-341.333 38.4-341.333 85.334S323.477 768 512 768s341.333-38.4 341.333-85.333S700.523 597.333 512 597.333z" />
    </Svg>
  );
}

export function IconWallet(p: Props) {
  return (
    <Svg {...p}>
      <path d="M213.333 256h682.667c47.147 0 85.333 38.187 85.333 85.333v512c0 47.147-38.186 85.334-85.333 85.334H213.333c-47.147 0-85.333-38.187-85.333-85.334V341.333c0-47.146 38.186-85.333 85.333-85.333zm0 85.333v512h682.667V341.333H213.333zm512 256c47.147 0 85.333-38.187 85.333-85.333S772.48 426.667 725.333 426.667 640 464.853 640 512s38.187 85.333 85.333 85.333z" />
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

export function IconScan(p: Props) {
  return (
    <Svg {...p}>
      <path d="M213.333 170.667h85.334v85.333H213.333v-85.333zm512 0h85.334v85.333H725.333v-85.333zM213.333 768h85.334v85.333H213.333V768zm512 0h85.334v85.333H725.333V768zM128 341.333h85.333v341.334H128V341.333zm682.667 0H896v341.334h-85.333V341.333zM384 384h256v256H384V384z" />
    </Svg>
  );
}

export function IconGenome(p: Props) {
  return (
    <Svg {...p}>
      <path d="M512 85.333c188.523 0 341.333 152.81 341.333 341.334 0 73.387-23.253 141.227-62.72 196.693l60.16 60.16-60.331 60.331-60.16-60.16c-55.467 39.467-123.307 62.72-196.693 62.72-188.523 0-341.333-152.81-341.333-341.333S323.477 85.333 512 85.333zm0 85.334c-141.44 0-256 114.56-256 256s114.56 256 256 256 256-114.56 256-256-114.56-256-256-256zm-85.333 128h42.666v42.667h-42.666v-42.667zm170.666 0h42.667v42.667h-42.667v-42.667zm-256 128h42.667v42.667h-42.667v-42.667zm341.333 0h42.667v42.667h-42.667v-42.667zm-170.666 128h42.666v42.667h-42.666v-42.667z" />
    </Svg>
  );
}

export function IconClinical(p: Props) {
  return (
    <Svg {...p}>
      <path d="M384 170.667h256v128H384V170.667zm85.333 213.333H298.667v384h426.666V384H554.667v85.333H469.333V384zm85.334 170.667v128h85.333V554.667H554.667z" />
    </Svg>
  );
}

export function IconDiagnosis(p: Props) {
  return (
    <Svg {...p}>
      <path d="M341.333 213.333c0-94.293 76.374-170.667 170.667-170.667S682.667 119.04 682.667 213.333c0 70.4-42.667 130.987-103.467 157.014L512 768l-67.2-397.653C383.467 344.32 341.333 283.733 341.333 213.333zM512 128c47.147 0 85.333 38.187 85.333 85.333S559.147 298.667 512 298.667 426.667 260.48 426.667 213.333 464.853 128 512 128zM256 725.333h512v85.334H256v-85.334z" />
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

export function IconPlus(p: Props) {
  return (
    <Svg {...p}>
      <path d="M512 170.667c23.467 0 42.667 19.2 42.667 42.666v256h256c23.467 0 42.667 19.2 42.667 42.667s-19.2 42.667-42.667 42.667H554.667v256c0 23.467-19.2 42.667-42.667 42.666s-42.667-19.2-42.666-42.666V554.667H213.333c-23.467 0-42.667-19.2-42.666-42.667s19.2-42.667 42.666-42.667h256V213.333c0-23.467 19.2-42.666 42.667-42.666z" />
    </Svg>
  );
}

export function IconRefresh(p: Props) {
  return (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`shrink-0 ${p.className ?? ""}`}>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

export function IconOvarian(p: Props) {
  return (
    <Svg {...p}>
      <path d="M512 128c-141.44 0-256 114.56-256 256 0 98.133 55.467 183.467 136.533 226.133L512 896l119.467-285.867C712.533 567.467 768 482.133 768 384c0-141.44-114.56-256-256-256zm0 85.333c94.293 0 170.667 76.374 170.667 170.667S606.293 554.667 512 554.667 341.333 478.293 341.333 384s76.374-170.667 170.667-170.667z" />
    </Svg>
  );
}

export function IconCervical(p: Props) {
  return (
    <Svg {...p}>
      <path d="M512 85.333L170.667 256v512L512 938.667l341.333-170.667V256L512 85.333zm0 94.934l256 128v341.466L512 768 256 640V308.267l256-128z" />
    </Svg>
  );
}

export function IconEndometrial(p: Props) {
  return (
    <Svg {...p}>
      <path d="M213.333 256h597.334v512H213.333V256zm85.333 85.333v341.334h426.667V341.333H298.667zm85.334 85.334h256v85.333H384v-85.333zm0 170.666h170.667v85.334H384v-85.334z" />
    </Svg>
  );
}

export function IconGestational(p: Props) {
  return (
    <Svg {...p}>
      <path d="M341.333 256c0-94.293 76.374-170.667 170.667-170.667S682.667 161.707 682.667 256s-76.374 170.667-170.667 170.667S341.333 350.293 341.333 256zm85.333 0c0 47.147 38.187 85.333 85.334 85.333s85.333-38.186 85.333-85.333S559.147 170.667 512 170.667s-85.334 38.186-85.334 85.333zM256 597.333h512v85.334H256v-85.334zm85.333 170.667h341.334v85.333H341.333v-85.333z" />
    </Svg>
  );
}

export type NavIconName =
  | "compass"
  | "experiment"
  | "book"
  | "chart"
  | "file"
  | "apps"
  | "database"
  | "wallet"
  | "skill"
  | "scan"
  | "clinical"
  | "genome"
  | "diagnosis";

const NAV_ICON_MAP: Record<NavIconName, ComponentType<Props>> = {
  compass: IconCompass,
  experiment: IconExperiment,
  book: IconBook,
  chart: IconChart,
  file: IconFile,
  apps: IconApps,
  database: IconDatabase,
  wallet: IconWallet,
  skill: IconSkill,
  scan: IconScan,
  clinical: IconClinical,
  genome: IconGenome,
  diagnosis: IconDiagnosis,
};

export function NavIcon({ name, ...props }: Props & { name: NavIconName }) {
  const Comp = NAV_ICON_MAP[name];
  return <Comp {...props} />;
}

export type DiseaseIconName = "ovarian" | "cervical" | "endometrial" | "gestational";

const DISEASE_ICON_MAP: Record<DiseaseIconName, ComponentType<Props>> = {
  ovarian: IconOvarian,
  cervical: IconCervical,
  endometrial: IconEndometrial,
  gestational: IconGestational,
};

export function DiseaseIcon({ name, ...props }: Props & { name: DiseaseIconName }) {
  const Comp = DISEASE_ICON_MAP[name];
  return <Comp {...props} />;
}

// Re-export legacy names for compatibility
export { IconRefresh as IconRefreshLegacy, IconPlus as IconPlusLegacy };
export {
  IconCheck,
  IconCircle,
  IconLoader,
  IconClock,
  IconAlert,
  IconX,
  IconFlask,
} from "./Icons";
