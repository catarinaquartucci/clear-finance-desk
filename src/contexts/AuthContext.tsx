import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  hasFinanceAccess: boolean;
  hasFinanceViewOnly: boolean;
  hasAdminViewOnly: boolean;
  canEditFinance: boolean;
  canEditAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isAdmin: false,
  hasFinanceAccess: false,
  hasFinanceViewOnly: false,
  hasAdminViewOnly: false,
  canEditFinance: false,
  canEditAdmin: false,
  loading: true,
  signOut: async () => {},
  refreshRoles: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasFinanceAccess, setHasFinanceAccess] = useState(false);
  const [hasFinanceViewOnly, setHasFinanceViewOnly] = useState(false);
  const [hasAdminViewOnly, setHasAdminViewOnly] = useState(false);
  const [canEditFinance, setCanEditFinance] = useState(false);
  const [canEditAdmin, setCanEditAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkUserRoles = async (userId: string) => {
    try {
      if (import.meta.env.DEV) console.log('🔍 [AuthContext] Iniciando verificação de roles para userId:', userId);
      
      // Query direta na tabela user_roles
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (import.meta.env.DEV) console.log('📊 [AuthContext] Resposta da query user_roles:', { 
        userId,
        data, 
        error,
        dataLength: data?.length || 0
      });
      
      if (error) {
        if (import.meta.env.DEV) console.error('❌ [AuthContext] Erro ao buscar roles:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        resetRoles();
        return;
      }

      if (!data || data.length === 0) {
        if (import.meta.env.DEV) console.warn('⚠️ [AuthContext] Nenhuma role encontrada para o usuário:', userId);
        resetRoles();
        return;
      }

      const roles = data.map(r => r.role as string);
      if (import.meta.env.DEV) console.log('📋 [AuthContext] Roles do usuário:', roles);
      
      const adminStatus = roles.includes("admin");
      const financeStatus = roles.includes("finance");
      const financeViewerStatus = roles.includes("finance_viewer");
      const adminViewerStatus = roles.includes("admin_viewer");
      
      // View-only: tem viewer mas NÃO tem a role completa
      const financeViewOnly = financeViewerStatus && !financeStatus && !adminStatus;
      const adminViewOnly = adminViewerStatus && !adminStatus;
      
      // Pode editar: tem a role completa (finance/admin vence viewer)
      const editFinance = financeStatus || adminStatus;
      const editAdmin = adminStatus;
      
      if (import.meta.env.DEV) console.log('✅ [AuthContext] Status calculado:', { 
        userId,
        roles,
        isAdmin: adminStatus, 
        hasFinanceAccess: financeStatus || adminStatus,
        hasFinanceViewOnly: financeViewOnly,
        hasAdminViewOnly: adminViewOnly,
        canEditFinance: editFinance,
        canEditAdmin: editAdmin
      });
      
      setIsAdmin(adminStatus);
      setHasFinanceAccess(financeStatus || adminStatus);
      setHasFinanceViewOnly(financeViewOnly);
      setHasAdminViewOnly(adminViewOnly);
      setCanEditFinance(editFinance);
      setCanEditAdmin(editAdmin);
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('❌ [AuthContext] Exceção ao verificar roles:', {
        message: error?.message,
        stack: error?.stack
      });
      resetRoles();
    } finally {
      setLoading(false);
    }
  };

  const resetRoles = () => {
    setIsAdmin(false);
    setHasFinanceAccess(false);
    setHasFinanceViewOnly(false);
    setHasAdminViewOnly(false);
    setCanEditFinance(false);
    setCanEditAdmin(false);
  };

  const refreshRoles = async () => {
    if (user?.id) {
      if (import.meta.env.DEV) console.log('🔄 [AuthContext] Refresh de roles solicitado');
      setLoading(true);
      await checkUserRoles(user.id);
    }
  };

  useEffect(() => {
    if (import.meta.env.DEV) console.log('🚀 [AuthContext] Inicializando AuthProvider');
    
    // Configurar listener PRIMEIRO
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (import.meta.env.DEV) console.log('🔄 [AuthContext] Auth state changed:', { 
          event, 
          userId: session?.user?.id,
          email: session?.user?.email 
        });
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setLoading(true);
          // Usar setTimeout para evitar deadlock
          setTimeout(() => {
            checkUserRoles(session.user.id);
          }, 0);
        } else {
          if (import.meta.env.DEV) console.log('👤 [AuthContext] Usuário deslogado, resetando estados');
          resetRoles();
          setLoading(false);
        }
      }
    );

    // DEPOIS verificar sessão existente
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('📦 [AuthContext] Sessão existente:', { 
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        error 
      });
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkUserRoles(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => {
      console.log('🧹 [AuthContext] Cleanup - unsubscribe');
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    console.log('🚪 [AuthContext] SignOut iniciado');
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    resetRoles();
  };

  // Log do estado atual para debugging
  useEffect(() => {
    console.log('📊 [AuthContext] Estado atual:', {
      userId: user?.id,
      email: user?.email,
      isAdmin,
      hasFinanceAccess,
      hasFinanceViewOnly,
      hasAdminViewOnly,
      canEditFinance,
      canEditAdmin,
      loading
    });
  }, [user, isAdmin, hasFinanceAccess, hasFinanceViewOnly, hasAdminViewOnly, canEditFinance, canEditAdmin, loading]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      isAdmin, 
      hasFinanceAccess,
      hasFinanceViewOnly,
      hasAdminViewOnly,
      canEditFinance,
      canEditAdmin,
      loading, 
      signOut,
      refreshRoles 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
