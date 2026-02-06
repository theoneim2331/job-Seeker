import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing session
        const token = localStorage.getItem('jobmatch_token');
        const savedUser = localStorage.getItem('jobmatch_user');

        if (token && savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                localStorage.removeItem('jobmatch_token');
                localStorage.removeItem('jobmatch_user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const data = await authAPI.login(email, password);
        localStorage.setItem('jobmatch_token', data.token);
        localStorage.setItem('jobmatch_user', JSON.stringify(data.user));
        setUser(data.user);
        return data;
    };

    const logout = async () => {
        await authAPI.logout();
        setUser(null);
    };

    const updateUser = (updates) => {
        const newUser = { ...user, ...updates };
        localStorage.setItem('jobmatch_user', JSON.stringify(newUser));
        setUser(newUser);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
