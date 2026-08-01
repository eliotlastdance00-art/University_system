import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserFromToken, clearTokens } from '../utils/token';
import { logout as apiLogout } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user exists on mount
    const currentUser = getUserFromToken();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const loginSuccess = () => {
    const currentUser = getUserFromToken();
    setUser(currentUser);
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('us_refresh_token');
      if (refreshToken) {
        await apiLogout(refreshToken);
      }
    } catch (err) {
      console.error('Logout failed on backend:', err);
    } finally {
      clearTokens();
      setUser(null);
    }
  };

  if (loading) {
    return <div className="page-loader"><div className="spinner spinner-lg"></div></div>;
  }

  return (
    <AuthContext.Provider value={{ user, loginSuccess, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
