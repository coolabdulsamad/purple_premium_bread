// src/hooks/useAuth.js
import { useState, useEffect } from 'react';

const getValidUser = () => {
  const userData = localStorage.getItem('user');
  if (!userData || userData === 'undefined') return null;
  try {
    return JSON.parse(userData);
  } catch {
    return null;
  }
};

const useAuth = () => {
  const initialToken = localStorage.getItem('token');
  const [isAuthenticated, setIsAuthenticated] = useState(!!initialToken);
  const [user, setUser] = useState(getValidUser());
  const userRole = user?.role || null; // <-- Add this line

  useEffect(() => {
    const token = localStorage.getItem('token');
    const validUser = getValidUser();
    if (token && validUser) {
      setIsAuthenticated(true);
      setUser(validUser);
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    window.location.href = '/';
  };

  return { isAuthenticated, user, userRole, logout }; // <-- Return userRole
};

export default useAuth;