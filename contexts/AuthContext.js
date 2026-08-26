import React, { createContext, useState, useEffect, useContext } from 'react';

import { authService } from '../services/auth.service';
import { storage } from '../utils/storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Cargar sesión al iniciar la app
  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const savedToken = await storage.getToken();
        const savedUser = await storage.getUser();

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(savedUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error cargando auth:', error);
      } finally {
        setLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  const login = async (email, password) => {
    const result = await authService.login(email, password);
    if (result.requires2FA) {
      return result; // Retornamos para que el login.js lo maneje
    }
    const { token: newToken, user: newUser } = result;
    setToken(newToken);
    setUser(newUser);
    setIsAuthenticated(true);
    return result;
  };

  const setAuthState = ({ token: newToken, user: newUser }) => {
    setToken(newToken);
    setUser(newUser);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await authService.logout();
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUserInSession = async (newData) => {
    const updatedUser = { ...user, ...newData };
    setUser(updatedUser);
    await storage.setUser(updatedUser);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    logout,
    setAuthState,
    updateUserInSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};