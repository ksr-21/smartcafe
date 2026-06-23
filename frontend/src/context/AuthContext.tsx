import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

interface CafeInfo {
  id: string;
  businessName: string;
  status: string;
  logo?: string;
  gstRate?: number;
  gstNumber?: string;
  subscription?: {
    plan: string;
    startDate: string;
    endDate: string;
    maxTables: number;
    maxMenuItems: number;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'cafe_admin' | 'kitchen_staff';
  avatar?: string;
  cafe?: CafeInfo;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  updateCafe: (updates: Partial<CafeInfo>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const login = (newToken: string, userData: User) => {
    localStorage.setItem('smartcafe_token', newToken);
    localStorage.setItem('smartcafe_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('smartcafe_token');
    localStorage.removeItem('smartcafe_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem('smartcafe_user', JSON.stringify(updated));
      return updated;
    });
  };

  const updateCafe = (updates: Partial<CafeInfo>) => {
    setUser((prev) => {
      if (!prev || !prev.cafe) return prev;
      const updated = {
        ...prev,
        cafe: { ...prev.cafe, ...updates }
      };
      localStorage.setItem('smartcafe_user', JSON.stringify(updated));
      return updated;
    });
  };

  const refreshUser = async () => {
    try {
      const res = await api.auth.me();
      if (res.success && res.user) {
        updateUser(res.user);
      }
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('smartcafe_token');
      const savedUser = localStorage.getItem('smartcafe_user');

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        
        // Fetch fresh profile in background
        try {
          const res = await api.auth.me();
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('smartcafe_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.error('Session verification failed, logging out.', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        updateUser,
        updateCafe,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
