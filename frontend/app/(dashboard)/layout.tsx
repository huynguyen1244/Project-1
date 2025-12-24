'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import Sidebar from '@/components/layouts/Sidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
                <Sidebar />
                <main className="ml-64 p-8">
                    {children}
                </main>
            </div>
        </AuthProvider>
    );
}
