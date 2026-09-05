"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { fetchNavigatorConfig, type NavigatorConfig } from "@/lib/navigator";
import { listStudies } from "@/lib/api";
import { checkBackendHealth } from "@/lib/api-base";
import type { StudySummary } from "@/lib/types";

interface AppContextValue {
  config: NavigatorConfig | null;
  studies: StudySummary[];
  backendOnline: boolean | null;
  refreshStudies: () => Promise<void>;
  refreshConfig: () => Promise<void>;
  checkBackend: () => Promise<boolean>;
  showNewStudyModal: boolean;
  setShowNewStudyModal: (v: boolean) => void;
  pendingQuery: string;
  setPendingQuery: (q: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<NavigatorConfig | null>(null);
  const [studies, setStudies] = useState<StudySummary[]>([]);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [showNewStudyModal, setShowNewStudyModal] = useState(false);
  const [pendingQuery, setPendingQuery] = useState("");

  const checkBackend = useCallback(async () => {
    const ok = await checkBackendHealth();
    setBackendOnline(ok);
    return ok;
  }, []);

  const refreshConfig = useCallback(async () => {
    try {
      const c = await fetchNavigatorConfig();
      setConfig(c);
      setBackendOnline(true);
    } catch {
      await checkBackend();
    }
  }, [checkBackend]);

  const refreshStudies = useCallback(async () => {
    try {
      const list = await listStudies();
      setStudies(list);
      setBackendOnline(true);
    } catch {
      await checkBackend();
    }
  }, [checkBackend]);

  useEffect(() => {
    checkBackend().then((ok) => {
      if (ok) {
        refreshConfig();
        refreshStudies();
      }
    });
  }, [checkBackend, refreshConfig, refreshStudies]);

  return (
    <AppContext.Provider
      value={{
        config,
        studies,
        backendOnline,
        refreshStudies,
        refreshConfig,
        checkBackend,
        showNewStudyModal,
        setShowNewStudyModal,
        pendingQuery,
        setPendingQuery,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
