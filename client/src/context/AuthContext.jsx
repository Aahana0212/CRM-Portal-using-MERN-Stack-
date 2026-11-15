import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('crm_user'));
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(!!localStorage.getItem('crm_token'));

  // Re-validate token on app load
  useEffect(() => {
    if (!localStorage.getItem('crm_token')) return;
    api
      .get('/auth/me')
      .then(({ data }) => saveUser(data.user))
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, []);

  const saveUser = (u) => {
    setUser(u);
    localStorage.setItem('crm_user', JSON.stringify(u));
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('crm_token', data.token);
    saveUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, saveUser, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
