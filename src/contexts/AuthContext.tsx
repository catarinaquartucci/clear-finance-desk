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

  const tryAutoLinkColaborador = async (userId: string, email: string) => {
    try {
      if (import.meta.env.DEV) console.log('🔗 [AuthContext] Tentando vincular colaborador:', email);
      const { data, error } = await supabase.rpc('vincular_user_colaborador', {
        p_colaborador_email: email,
        p_user_id: userId,
      });
      if (import.meta.env.DEV) console.log('🔗 [AuthContext] Resultado vinculação:', { data, error });
    } catch (err) {
      // Silencioso - pode não ter colaborador cadastrado
      if (import.meta.env.DEV) console.log('🔗 [AuthContext] Vinculação não aplicável:', err);
    }
  };

  const checkUserRoles = async (userId: string, userEmail?: string, retryCount = 0) => {
    try {
      if (import.meta.env.DEV) console.log('🔍 [AuthContext] Verificando roles para:', userId, 'tentativa:', retryCount);

      // Tentar vincular colaborador automaticamente (idempotente)
      if (userEmail) {
        await tryAutoLinkColaborador(userId, userEmail);
      }
      
      // Query direta na tabela user_roles
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (import.meta.env.DEV) console.log('📊 [AuthContext] Roles response:', { data, error });
      
      if (error) {
        console.error('❌ [AuthContext] Erro ao buscar roles:', error.message);
        // Retry once after short delay (handles race condition with trigger)
        if (retryCount < 1) {
          if (import.meta.env.DEV) console.log('🔄 [AuthContext] Retry em 1.5s...');
          setTimeout(() => checkUserRoles(userId, userEmail, retryCount + 1), 1500);
          return;
        }
        resetRoles();
        return;
      }

      if (!data || data.length === 0) {
        // Retry once - triggers may not have fired yet
        if (retryCount < 1) {
          if (import.meta.env.DEV) console.log('⚠️ [AuthContext] Nenhuma role, retry em 1.5s...');
          setTimeout(() => checkUserRoles(userId, userEmail, retryCount + 1), 1500);
          return;
        }
        if (import.meta.env.DEV) console.warn('⚠️ [AuthContext] Nenhuma role encontrada após retry');
        resetRoles();
        return;
      }

      const roles = data.map(r => r.role as string);
      if (import.meta.env.DEV) console.log('📋 [AuthContext] Roles:', roles);
      
      const adminStatus = roles.includes("admin");
      const financeStatus = roles.includes("finance");
      const financeViewerStatus = roles.includes("finance_viewer");
      const adminViewerStatus = roles.includes("admin_viewer");
      
      const financeViewOnly = financeViewerStatus && !financeStatus && !adminStatus;
      const adminViewOnly = adminViewerStatus && !adminStatus;
      const editFinance = financeStatus || adminStatus;
      const editAdmin = adminStatus;
      
      setIsAdmin(adminStatus);
      setHasFinanceAccess(financeStatus || adminStatus);
      setHasFinanceViewOnly(financeViewOnly);
      setHasAdminViewOnly(adminViewOnly);
      setCanEditFinance(editFinance);
      setCanEditAdmin(editAdmin);
    } catch (error: any) {
      console.error('❌ [AuthContext] Exceção ao verificar roles:', error?.message);
      if (retryCount < 1) {
        setTimeout(() => checkUserRoles(userId, userEmail, retryCount + 1), 1500);
        return;
      }
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
      await checkUserRoles(user.id, user.email);
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
            checkUserRoles(session.user.id, session.user.email);
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
      if (import.meta.env.DEV) console.log('📦 [AuthContext] Sessão existente:', { 
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        error 
      });
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkUserRoles(session.user.id, session.user.email);
      } else {
        setLoading(false);
      }
    });

    return () => {
      if (import.meta.env.DEV) console.log('🧹 [AuthContext] Cleanup - unsubscribe');
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    if (import.meta.env.DEV) console.log('🚪 [AuthContext] SignOut iniciado');
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    resetRoles();
  };

  // Log do estado atual para debugging
  useEffect(() => {
    if (import.meta.env.DEV) console.log('📊 [AuthContext] Estado atual:', {
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
