import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { format } from "date-fns";

const STORAGE_KEY = "app-preferences";

interface ColaboradoresFilters {
  searchQuery: string;
  statusFilter: string;
  funcaoFilter: string;
  areaFilter: string;
  mesAniversarioFilter: string;
}

interface EquipamentosFilters {
  searchTerm: string;
  tipoFilter: string;
  estadoFilter: string;
  responsavelFilter: string;
}

interface ApprovalFilters {
  statusFilter: string;
  periodFilter: string;
  dateFrom: string | null;
  dateTo: string | null;
}

interface AppPreferencesState {
  // Seletor global de filial
  selectedCompanyId: string;
  
  // Módulo Financeiro
  financialYear: string;
  financialMonth: string;
  analysisMonth: string;
  
  // Fluxo de Caixa
  cashFlowPresentation: "grouped" | "detailed";
  cashFlowStatusFilter: "realized" | "projected" | "both";
  cashFlowShowPercentage: boolean;
  
  // Análise Financeira
  analysisYear: number;
  analysisComparisonType: "mom" | "yoy";
  
  // Módulo Admin
  adminDashboardTab: string;
  colaboradoresFilters: ColaboradoresFilters;
  equipamentosFilters: EquipamentosFilters;
  approvalFilters: ApprovalFilters;
  
  // Páginas Gerais
  solicitacoesTab: string;
}

interface AppPreferencesContextType extends AppPreferencesState {
  setSelectedCompanyId: (id: string) => void;
  setFinancialYear: (year: string) => void;
  setFinancialMonth: (month: string) => void;
  setAnalysisMonth: (month: string) => void;
  setCashFlowPresentation: (presentation: "grouped" | "detailed") => void;
  setCashFlowStatusFilter: (filter: "realized" | "projected" | "both") => void;
  setCashFlowShowPercentage: (show: boolean) => void;
  setAnalysisYear: (year: number) => void;
  setAnalysisComparisonType: (type: "mom" | "yoy") => void;
  setAdminDashboardTab: (tab: string) => void;
  setColaboradoresFilter: <K extends keyof ColaboradoresFilters>(key: K, value: ColaboradoresFilters[K]) => void;
  setEquipamentosFilter: <K extends keyof EquipamentosFilters>(key: K, value: EquipamentosFilters[K]) => void;
  setApprovalFilter: <K extends keyof ApprovalFilters>(key: K, value: ApprovalFilters[K]) => void;
  clearApprovalFilters: () => void;
  setSolicitacoesTab: (tab: string) => void;
}

const defaultColaboradoresFilters: ColaboradoresFilters = {
  searchQuery: "",
  statusFilter: "todos",
  funcaoFilter: "todos",
  areaFilter: "todos",
  mesAniversarioFilter: "todos",
};

const defaultEquipamentosFilters: EquipamentosFilters = {
  searchTerm: "",
  tipoFilter: "all",
  estadoFilter: "all",
  responsavelFilter: "all",
};

const defaultApprovalFilters: ApprovalFilters = {
  statusFilter: "todos",
  periodFilter: "todos",
  dateFrom: null,
  dateTo: null,
};

const getDefaultState = (): AppPreferencesState => {
  const currentDate = new Date();
  return {
    selectedCompanyId: "all",
    financialYear: currentDate.getFullYear().toString(),
    financialMonth: "all",
    analysisMonth: format(currentDate, 'yyyy-MM-01'),
    cashFlowPresentation: "grouped",
    cashFlowStatusFilter: "realized",
    cashFlowShowPercentage: false,
    analysisYear: currentDate.getFullYear(),
    analysisComparisonType: "mom",
    adminDashboardTab: "reembolsos",
    colaboradoresFilters: { ...defaultColaboradoresFilters },
    equipamentosFilters: { ...defaultEquipamentosFilters },
    approvalFilters: { ...defaultApprovalFilters },
    solicitacoesTab: "reembolso",
  };
};

const loadFromStorage = (): AppPreferencesState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const defaults = getDefaultState();
      return {
        ...defaults,
        ...parsed,
        colaboradoresFilters: {
          ...defaults.colaboradoresFilters,
          ...(parsed.colaboradoresFilters || {}),
        },
        equipamentosFilters: {
          ...defaults.equipamentosFilters,
          ...(parsed.equipamentosFilters || {}),
        },
        approvalFilters: {
          ...defaults.approvalFilters,
          ...(parsed.approvalFilters || {}),
        },
      };
    }
  } catch (e) {
    console.warn("Failed to load app preferences from localStorage:", e);
  }
  return getDefaultState();
};

const saveToStorage = (state: AppPreferencesState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Failed to save app preferences to localStorage:", e);
  }
};

const AppPreferencesContext = createContext<AppPreferencesContextType | undefined>(undefined);

export const AppPreferencesProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppPreferencesState>(loadFromStorage);

  // Salvar no localStorage sempre que o state mudar
  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  const setFinancialYear = useCallback((year: string) => {
    setState(prev => ({ ...prev, financialYear: year }));
  }, []);

  const setFinancialMonth = useCallback((month: string) => {
    setState(prev => ({ ...prev, financialMonth: month }));
  }, []);

  const setAnalysisMonth = useCallback((month: string) => {
    setState(prev => ({ ...prev, analysisMonth: month }));
  }, []);

  const setCashFlowPresentation = useCallback((presentation: "grouped" | "detailed") => {
    setState(prev => ({ ...prev, cashFlowPresentation: presentation }));
  }, []);

  const setCashFlowStatusFilter = useCallback((filter: "realized" | "projected" | "both") => {
    setState(prev => ({ ...prev, cashFlowStatusFilter: filter }));
  }, []);

  const setCashFlowShowPercentage = useCallback((show: boolean) => {
    setState(prev => ({ ...prev, cashFlowShowPercentage: show }));
  }, []);

  const setAnalysisYear = useCallback((year: number) => {
    setState(prev => ({ ...prev, analysisYear: year }));
  }, []);

  const setAnalysisComparisonType = useCallback((type: "mom" | "yoy") => {
    setState(prev => ({ ...prev, analysisComparisonType: type }));
  }, []);

  const setAdminDashboardTab = useCallback((tab: string) => {
    setState(prev => ({ ...prev, adminDashboardTab: tab }));
  }, []);

  const setColaboradoresFilter = useCallback(<K extends keyof ColaboradoresFilters>(
    key: K,
    value: ColaboradoresFilters[K]
  ) => {
    setState(prev => ({
      ...prev,
      colaboradoresFilters: {
        ...prev.colaboradoresFilters,
        [key]: value,
      },
    }));
  }, []);

  const setEquipamentosFilter = useCallback(<K extends keyof EquipamentosFilters>(
    key: K,
    value: EquipamentosFilters[K]
  ) => {
    setState(prev => ({
      ...prev,
      equipamentosFilters: {
        ...prev.equipamentosFilters,
        [key]: value,
      },
    }));
  }, []);

  const setSolicitacoesTab = useCallback((tab: string) => {
    setState(prev => ({ ...prev, solicitacoesTab: tab }));
  }, []);

  const setApprovalFilter = useCallback(<K extends keyof ApprovalFilters>(
    key: K,
    value: ApprovalFilters[K]
  ) => {
    setState(prev => ({
      ...prev,
      approvalFilters: {
        ...prev.approvalFilters,
        [key]: value,
      },
    }));
  }, []);

  const clearApprovalFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      approvalFilters: { ...defaultApprovalFilters },
    }));
  }, []);

  return (
    <AppPreferencesContext.Provider
      value={{
        ...state,
        setFinancialYear,
        setFinancialMonth,
        setAnalysisMonth,
        setCashFlowPresentation,
        setCashFlowStatusFilter,
        setCashFlowShowPercentage,
        setAnalysisYear,
        setAnalysisComparisonType,
        setAdminDashboardTab,
        setColaboradoresFilter,
        setEquipamentosFilter,
        setApprovalFilter,
        clearApprovalFilters,
        setSolicitacoesTab,
      }}
    >
      {children}
    </AppPreferencesContext.Provider>
  );
};

export const useAppPreferences = () => {
  const context = useContext(AppPreferencesContext);
  if (!context) {
    throw new Error("useAppPreferences must be used within an AppPreferencesProvider");
  }
  return context;
};
