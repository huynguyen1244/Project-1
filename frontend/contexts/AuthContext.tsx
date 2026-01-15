'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/api';

import { User } from '@/types';

interface AuthContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (accessToken: string, refreshToken: string, userData: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_PATHS = ['/login', '/register'];

export function AuthProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isPublicPath = PUBLIC_PATHS.includes(pathname);

    const logout = useCallback(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);
        router.push('/login');
    }, [router]);

    const login = useCallback((accessToken: string, refreshToken: string, userData: User) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify({
            id: userData.id,
            username: userData.username,
            email: userData.email,
        }));
        setUser(userData);
    }, []);

    // Load user từ localStorage và verify token khi app khởi động
    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('accessToken');
            const savedUser = localStorage.getItem('user');

            // Nếu không có token
            if (!token) {
                setIsLoading(false);
                if (!isPublicPath) {
                    router.push('/login');
                }
                return;
            }

            // Load user từ localStorage trước để hiển thị ngay
            if (savedUser) {
                try {
                    const parsedUser = JSON.parse(savedUser);
                    setUser(parsedUser);
                } catch {
                    // Invalid JSON, ignore
                }
            }

            // Verify token với backend
            try {
                const userData = await api.get<User>('/auth/me');
                // Update localStorage với dữ liệu mới nhất
                localStorage.setItem('user', JSON.stringify({
                    id: userData.id,
                    username: userData.username,
                    email: userData.email,
                }));
                setUser(userData);
            } catch {
                // Token hết hạn hoặc không hợp lệ - logout
                console.log('Token expired or invalid, logging out...');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                setUser(null);
                if (!isPublicPath) {
                    router.push('/login');
                }
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, [isPublicPath, router]);

    return (
        <AuthContext.Provider
            value={{
                user,
                setUser,
                isLoading,
                isAuthenticated: !!user,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
