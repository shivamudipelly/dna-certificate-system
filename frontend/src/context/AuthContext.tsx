import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, setAuthToken, getStoredToken } from '../services/api';
import toast from 'react-hot-toast';
import { AdminUser, AuthLoginResponse, AuthProfileResponse } from '../types';

interface AuthContextType {
    user: AdminUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<AdminUser | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);

    // On mount: restore session from sessionStorage if token exists
    useEffect(() => {
        const clearAuth = () => {
            logout();
            toast.error('Session has expired. Please log in again.');
        };
        window.addEventListener('auth:expired', clearAuth);

        restoreSession();

        return () => window.removeEventListener('auth:expired', clearAuth);
    }, []);

    const restoreSession = async () => {
        const storedToken = getStoredToken();
        if (!storedToken) {
            setIsLoading(false);
            return;
        }
        // Token exists — validate it against the server
        try {
            const response: AuthProfileResponse = await authAPI.getProfile();
            if (response.success) {
                setUser(response.admin);
                setIsAuthenticated(true);
            } else {
                setAuthToken(null);
            }
        } catch {
            // Token invalid/expired — clear it
            setAuthToken(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            const response: AuthLoginResponse = await authAPI.login(email, password);
            if (response?.success) {
                setAuthToken(response.token);
                setUser(response.admin);
                setIsAuthenticated(true);
                return { success: true };
            }
            return { success: false, error: 'Authentication failed' };
        } catch (error: any) {
            return { success: false, error: error.error || 'Login failed' };
        }
    };

    const logout = () => {
        setAuthToken(null);
        setUser(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
