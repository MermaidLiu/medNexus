"use client";

import { useApp } from "@/context/AppContext";
import { getEditionTheme, type EditionTheme } from "@/lib/agent-editions";

export function useEditionTheme(): EditionTheme {
  const { agentEdition } = useApp();
  return getEditionTheme(agentEdition);
}
