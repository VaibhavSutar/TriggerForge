"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { LOCAL_STORAGE_KEYS, ROUTES } from "@/config/constants";
import { useRouter } from "next/navigation";

type AuthContextType = {
  user: any | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user?: any) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check token on load
  useEffect(() => {
    const storedToken = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);
    const storedUser = localStorage.getItem(LOCAL_STORAGE_KEYS.USER);

    if (storedToken) {
      setToken(storedToken);
      if (storedUser) setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const login = (token: string, user?: any) => {
    setToken(token);
    if (user) setUser(user);
    localStorage.setItem(LOCAL_STORAGE_KEYS.TOKEN, token);
    if (user) localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
    router.push(ROUTES.LOGIN);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
