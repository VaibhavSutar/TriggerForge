"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { LOCAL_STORAGE_KEYS, ROUTES } from "@/config/constants";
import { useRouter } from "next/navigation";
const AuthContext = createContext({
    user: null,
    token: null,
    loading: true,
    login: () => { },
    logout: () => { },
});
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    // Check token on load
    useEffect(() => {
        const storedToken = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);
        const storedUser = localStorage.getItem(LOCAL_STORAGE_KEYS.USER);
        if (storedToken) {
            setToken(storedToken);
            if (storedUser)
                setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);
    const login = (token, user) => {
        setToken(token);
        if (user)
            setUser(user);
        localStorage.setItem(LOCAL_STORAGE_KEYS.TOKEN, token);
        if (user)
            localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(user));
    };
    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN);
        localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
        router.push(ROUTES.LOGIN);
    };
    return (<AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>);
};
export const useAuth = () => useContext(AuthContext);
