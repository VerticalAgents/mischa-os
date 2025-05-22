
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is already authenticated on load
  useEffect(() => {
    const checkAuth = () => {
      const authData = localStorage.getItem('auth');
      if (authData) {
        setIsAuthenticated(true);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Developer credentials
  const DEV_USERNAME = 'devmischa';
  const DEV_PASSWORD = 'mischa9898';

  const login = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    
    try {
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (username === DEV_USERNAME && password === DEV_PASSWORD) {
        // Save auth state to local storage
        localStorage.setItem('auth', JSON.stringify({ username }));
        setIsAuthenticated(true);
        
        // Navigate to original intended route or default to home
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
        
        toast.success("Login realizado com sucesso");
        return true;
      } else {
        toast.error("Credenciais inválidas");
        return false;
      }
    } catch (error) {
      toast.error("Erro ao fazer login");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth');
    setIsAuthenticated(false);
    navigate('/login');
    toast.info("Você foi desconectado");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
