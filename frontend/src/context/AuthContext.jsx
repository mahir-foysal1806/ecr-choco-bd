import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, TOKEN_KEY } from '../lib/api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem(TOKEN_KEY));

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    api.get('/auth/me').then((r) => setUser(r.data.user)).catch(() => localStorage.removeItem(TOKEN_KEY)).finally(() => setLoading(false));
  }, []);

  const accept = useCallback((data) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const login = async (email, password) => accept((await api.post('/auth/login', { email, password })).data);
  const register = async (payload) => accept((await api.post('/auth/register', payload)).data);
  const logout = () => { localStorage.removeItem(TOKEN_KEY); setUser(null); };

  return <Ctx.Provider value={{ user, loading, login, register, logout, setUser, accept }}>{children}</Ctx.Provider>;
}
