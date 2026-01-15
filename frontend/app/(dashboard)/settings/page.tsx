'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import api from '@/lib/api';
import { User } from '@/types';

export default function SettingsPage() {
    const { user, setUser } = useAuth();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: user?.username || '',
        email: user?.email || '',
        fullName: user?.fullName || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const updatedUser = await api.patch<User>('/user/profile', formData);
            setUser(updatedUser);
            showToast('Cập nhật hồ sơ thành công', 'success');
        } catch (error) {
            console.error('Failed to update profile:', error);
            showToast('Cập nhật hồ sơ thất bại', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Cài đặt</h1>
                <p className="mt-1 text-gray-500 dark:text-gray-400">Quản lý thông tin cá nhân và tài khoản của bạn</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Hồ sơ cá nhân</h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Thông tin này sẽ được hiển thị trên các báo cáo và giao dịch của bạn.
                    </p>
                </div>

                <Card className="md:col-span-2">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label="Tên đăng nhập"
                            value={formData.username}
                            disabled
                            className="bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed"
                        />

                        <Input
                            label="Địa chỉ Email"
                            type="email"
                            value={formData.email}
                            disabled
                            className="bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed"
                        />

                        <Input
                            label="Họ và tên"
                            placeholder="Nhập họ và tên"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        />

                        <div className="flex justify-end">
                            <Button type="submit" isLoading={isLoading}>
                                Lưu thay đổi
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>

            <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1">
                        <h2 className="text-lg font-semibold text-red-600">Vùng nguy hiểm</h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Các hành động này có thể xóa vĩnh viễn dữ liệu của bạn.
                        </p>
                    </div>

                    <Card className="md:col-span-2 border-red-100 dark:border-red-900/30">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Xóa tài khoản</h3>
                                <p className="text-xs text-gray-500 mt-1">Dữ liệu của bạn sẽ bị xóa vĩnh viễn.</p>
                            </div>
                            <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30">
                                Xóa tài khoản
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
