'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../api/apiClient';
import { useQueryClient } from '@tanstack/react-query';

interface User {
  id: string;
  name: string;
  email: string;
  department?: string;
  designation?: string;
  employeeId?: string;
  roles: string[];
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasPermission: (perm: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('ghanshyam_token');
      if (!token) {
        setLoading(false);
        return;
      }
      const res: any = await apiClient.get('/api/auth/me');
      if (res.success) {
        setUser(res.data);
      }
    } catch (e) {
      localStorage.removeItem('ghanshyam_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res: any = await apiClient.post('/api/auth/login', { email, password });
    if (res.success) {
      localStorage.setItem('ghanshyam_token', res.data.accessToken);
      setUser(res.data.user);
      window.location.href = '/dashboard';
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/api/auth/logout', {});
    } catch (e) {
      // Ignore if session expired
    } finally {
      localStorage.removeItem('ghanshyam_token');
      setUser(null);
      queryClient.clear();
      router.push('/login');
    }
  };

  const hasRole = (role: string) => {
    if (!user) return false;
    return user.roles.includes('SUPER_ADMIN') || user.roles.includes(role);
  };

  const hasPermission = (perm: string) => {
    if (!user) return false;
    return user.roles.includes('SUPER_ADMIN') || user.permissions.includes(perm);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
