"use client";

import { useApp } from "@/context/AppContext";
import { PharmaHomeView } from "./PharmaHomeView";
import { ResearchHomeView } from "./ResearchHomeView";

export function PlatformHomeView() {
  const { agentEdition } = useApp();
  return agentEdition === "pharma" ? <PharmaHomeView /> : <ResearchHomeView />;
}
