import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Đăng nhập | FinanceApp',
    description: 'Đăng nhập vào ứng dụng quản lý chi tiêu cá nhân',
};

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {children}
            </div>
        </div>
    );
}
