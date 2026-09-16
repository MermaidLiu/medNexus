"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Doctor, Patient } from "@/lib/auth-types";
import {
  AGENT_EDITION_META,
  AGENT_EDITION_STORAGE_KEY,
  canAccessPanel,
  resolveAgentEdition,
  type AgentEdition,
  type SidebarPanel,
} from "@/lib/agent-editions";
import {
  bindVisitToPatient,
  createPatient,
  fetchCurrentDoctor,
  fetchMyPatients,
  loginDoctor,
  logoutDoctor,
  registerDoctor,
  setStoredToken,
  updateDoctorProfile,
} from "@/lib/auth-api";

type VisitControl = {
  loadVisit: (visitId: string) => Promise<void>;
  newVisit: (patientId?: string) => Promise<void>;
};

type DiagnosisContextValue = {
  doctor: Doctor | null;
  authLoading: boolean;
  patients: Patient[];
  patientsLoading: boolean;
  selectedPatient: Patient | null;
  showAuthModal: boolean;
  authModalMode: "login" | "register";
  openAuthModal: (mode?: "login" | "register") => void;
  closeAuthModal: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    department: string;
    title?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshPatients: () => Promise<void>;
  selectPatient: (patient: Patient | null) => Promise<void>;
  addPatient: (data: {
    name: string;
    gender?: string;
    age?: number;
    phone?: string;
    department?: string;
  }) => Promise<Patient>;
  updateDepartment: (department: string) => Promise<void>;
  registerVisitControl: (control: VisitControl | null) => void;
  bindCurrentVisit: (visitId: string) => Promise<void>;
  activePanel: SidebarPanel;
  setActivePanel: (p: SidebarPanel) => void;
  agentEdition: AgentEdition;
  setAgentEdition: (edition: AgentEdition) => void;
  canAccessPanel: (panel: SidebarPanel | "skill") => boolean;
  openVisitInWorkflow: (visitId: string) => Promise<void>;
};

const DiagnosisContext = createContext<DiagnosisContextValue | null>(null);

export function DiagnosisProvider({ children }: { children: ReactNode }) {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");
  const [activePanel, setActivePanelState] = useState<SidebarPanel>("workflow");
  const [agentEdition, setAgentEditionState] = useState<AgentEdition>("hospital");
  const visitControlRef = useRef<VisitControl | null>(null);

  const setAgentEdition = useCallback((edition: AgentEdition) => {
    setAgentEditionState(edition);
    localStorage.setItem(AGENT_EDITION_STORAGE_KEY, edition);
    const defaultPanel = AGENT_EDITION_META[edition].defaultPanel;
    setActivePanelState((prev) => {
      if (canAccessPanel(edition, prev)) return prev;
      return defaultPanel;
    });
  }, []);

  const setActivePanel = useCallback(
    (panel: SidebarPanel) => {
      if (!canAccessPanel(agentEdition, panel)) return;
      setActivePanelState(panel);
    },
    [agentEdition]
  );

  const checkPanel = useCallback(
    (panel: SidebarPanel | "skill") => canAccessPanel(agentEdition, panel),
    [agentEdition]
  );

  useEffect(() => {
    const edition = resolveAgentEdition();
    setAgentEditionState(edition);
    setActivePanelState(AGENT_EDITION_META[edition].defaultPanel);
  }, []);

  const refreshPatients = useCallback(async () => {
    if (!doctor) {
      setPatients([]);
      return;
    }
    setPatientsLoading(true);
    try {
      const list = await fetchMyPatients();
      setPatients(list);
      setSelectedPatient((prev) => {
        if (!prev) return prev;
        return list.find((p) => p.id === prev.id) ?? prev;
      });
    } finally {
      setPatientsLoading(false);
    }
  }, [doctor]);

  useEffect(() => {
    fetchCurrentDoctor()
      .then(setDoctor)
      .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    if (doctor) refreshPatients();
    else {
      setPatients([]);
      setSelectedPatient(null);
    }
  }, [doctor, refreshPatients]);

  const registerVisitControl = useCallback((control: VisitControl | null) => {
    visitControlRef.current = control;
  }, []);

  const openAuthModal = useCallback((mode: "login" | "register" = "login") => {
    setAuthModalMode(mode);
    setShowAuthModal(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setShowAuthModal(false);
  }, []);

  const selectPatient = useCallback(async (patient: Patient | null) => {
    setSelectedPatient(patient);
    setActivePanel("workflow");
    const ctrl = visitControlRef.current;
    if (!ctrl) return;
    if (!patient) return;
    const latestVisitId = patient.visitIds?.[patient.visitIds.length - 1];
    if (latestVisitId) await ctrl.loadVisit(latestVisitId);
    else await ctrl.newVisit(patient.id);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { doctor: d, token } = await loginDoctor({ email, password });
    setStoredToken(token);
    setDoctor(d);
    closeAuthModal();
  }, [closeAuthModal]);

  const register = useCallback(
    async (data: {
      email: string;
      password: string;
      name: string;
      department: string;
      title?: string;
    }) => {
      const { doctor: d, token } = await registerDoctor(data);
      setStoredToken(token);
      setDoctor(d);
      closeAuthModal();
    },
    [closeAuthModal]
  );

  const logout = useCallback(async () => {
    await logoutDoctor();
    setDoctor(null);
    setSelectedPatient(null);
  }, []);

  const addPatient = useCallback(
    async (data: {
      name: string;
      gender?: string;
      age?: number;
      phone?: string;
      department?: string;
    }) => {
      const patient = await createPatient({
        ...data,
        department: data.department ?? doctor?.department,
      });
      await refreshPatients();
      setSelectedPatient(patient);
      await visitControlRef.current?.newVisit(patient.id);
      return patient;
    },
    [doctor, refreshPatients]
  );

  const updateDepartment = useCallback(
    async (department: string) => {
      if (!doctor) return;
      const updated = await updateDoctorProfile({ department });
      setDoctor(updated);
    },
    [doctor]
  );

  const bindCurrentVisit = useCallback(
    async (visitId: string) => {
      if (!selectedPatient || !doctor) return;
      await bindVisitToPatient(selectedPatient.id, visitId);
      await refreshPatients();
    },
    [selectedPatient, doctor, refreshPatients]
  );

  const openVisitInWorkflow = useCallback(async (visitId: string) => {
    setActivePanel("workflow");
    await visitControlRef.current?.loadVisit(visitId);
  }, []);

  return (
    <DiagnosisContext.Provider
      value={{
        doctor,
        authLoading,
        patients,
        patientsLoading,
        selectedPatient,
        showAuthModal,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        logout,
        refreshPatients,
        selectPatient,
        addPatient,
        updateDepartment,
        registerVisitControl,
        bindCurrentVisit,
        activePanel,
        setActivePanel,
        agentEdition,
        setAgentEdition,
        canAccessPanel: checkPanel,
        openVisitInWorkflow,
      }}
    >
      {children}
    </DiagnosisContext.Provider>
  );
}

export function useDiagnosis() {
  const ctx = useContext(DiagnosisContext);
  if (!ctx) throw new Error("useDiagnosis must be used within DiagnosisProvider");
  return ctx;
}
