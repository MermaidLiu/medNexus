"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { fetchCohort } from "@/lib/cohort-api";
import type { CohortMeta, CohortPatient } from "@/lib/cohort-types";
import { loadCohortLocal, saveCohortLocal } from "@/lib/cohort-types";

const SELECTED_KEY = "mednexus_selected_case_ids";

type ResearchContextValue = {
  cohort: CohortMeta | null;
  loading: boolean;
  error: string | null;
  refreshCohort: () => Promise<void>;
  selectedIds: string[];
  toggleSelect: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  setSelectedIds: (ids: string[]) => void;
  getPatient: (id: string) => CohortPatient | undefined;
};

const ResearchContext = createContext<ResearchContextValue | null>(null);

export function ResearchProvider({ children }: { children: ReactNode }) {
  const [cohort, setCohort] = useState<CohortMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIdsState] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SELECTED_KEY);
      if (raw) setSelectedIdsState(JSON.parse(raw) as string[]);
    } catch {
      /* ignore */
    }
  }, []);

  const persistSelection = useCallback((ids: string[]) => {
    setSelectedIdsState(ids);
    localStorage.setItem(SELECTED_KEY, JSON.stringify(ids));
  }, []);

  const refreshCohort = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCohort();
      setCohort(data);
      saveCohortLocal(data);
    } catch {
      const local = loadCohortLocal();
      if (local?.patients?.length) {
        setCohort(local);
        setError("后端未连接，已加载本地缓存队列");
      } else {
        setCohort({ patient_count: 0, patients: [] });
        setError("暂无关联病例，请导入 Excel 或启动后端 cohort API");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCohort();
  }, [refreshCohort]);

  const toggleSelect = useCallback(
    (id: string) => {
      persistSelection(
        selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]
      );
    },
    [persistSelection, selectedIds]
  );

  const selectAll = useCallback(
    (ids: string[]) => persistSelection(ids),
    [persistSelection]
  );

  const clearSelection = useCallback(() => persistSelection([]), [persistSelection]);

  const getPatient = useCallback(
    (id: string) => cohort?.patients?.find((p) => p.id === id),
    [cohort]
  );

  return (
    <ResearchContext.Provider
      value={{
        cohort,
        loading,
        error,
        refreshCohort,
        selectedIds,
        toggleSelect,
        selectAll,
        clearSelection,
        setSelectedIds: persistSelection,
        getPatient,
      }}
    >
      {children}
    </ResearchContext.Provider>
  );
}

export function useResearch() {
  const ctx = useContext(ResearchContext);
  if (!ctx) throw new Error("useResearch must be used within ResearchProvider");
  return ctx;
}
