import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            api.get('/user')
                .then((res) => setUser(res.data.data))
                .catch(() => {
                    localStorage.removeItem('token');
                    setUser(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = useCallback(async (email, password) => {
        const res = await api.post('/login', { email, password });
        const { user, token } = res.data.data;
        localStorage.setItem('token', token);
        setUser(user);
        return user;
    }, []);

    const register = useCallback(async (data) => {
        const res = await api.post('/register', data);
        const { user, token } = res.data.data;
        localStorage.setItem('token', token);
        setUser(user);
        return user;
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.post('/logout');
        } catch {
        } finally {
            localStorage.removeItem('token');
            setUser(null);
        }
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
