'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import CurrencyInput from '@/components/ui/CurrencyInput';
import { formatCurrency, getAccountTypeLabel } from '@/lib/utils';
import api from '@/lib/api';
import { Account, AccountType } from '@/types';

const accountTypeOptions = [
    { value: 'CASH', label: 'Tiền mặt' },
    { value: 'BANK', label: 'Ngân hàng' },
    { value: 'E_WALLET', label: 'Ví điện tử' },
    { value: 'INVESTMENT', label: 'Đầu tư' },
    { value: 'CREDIT_CARD', label: 'Thẻ tín dụng' },
    { value: 'CRYPTO_WALLET', label: 'Tiền điện tử' },
    { value: 'OTHER', label: 'Khác' },
];

export default function AccountsPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'CASH' as AccountType,
        balance: '',
        currency: 'VND',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [filterType, setFilterType] = useState<string>('ALL');

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        try {
            const data = await api.get<Account[]>('/account');
            setAccounts(data);
        } catch (error) {
            console.error('Failed to load accounts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const openModal = (account?: Account) => {
        if (account) {
            setEditingAccount(account);
            setFormData({
                name: account.name,
                type: account.type,
                balance: String(account.balance),
                currency: account.currency,
            });
        } else {
            setEditingAccount(null);
            setFormData({ name: '', type: 'CASH', balance: '', currency: 'VND' });
        }
        setErrors({});
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingAccount(null);
        setFormData({ name: '', type: 'CASH', balance: '', currency: 'VND' });
        setErrors({});
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) {
            newErrors.name = 'Vui lòng nhập tên tài khoản';
        }
        if (!formData.balance || isNaN(Number(formData.balance))) {
            newErrors.balance = 'Vui lòng nhập số dư hợp lệ';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        try {
            const payload = {
                name: formData.name,
                type: formData.type,
                balance: Number(formData.balance),
                currency: formData.currency,
            };

            if (editingAccount) {
                await api.patch(`/account/${editingAccount.id}`, payload);
            } else {
                await api.post('/account', payload);
            }

            await loadAccounts();
            closeModal();
        } catch (error) {
            console.error('Failed to save account:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) return;

        try {
            await api.delete(`/account/${id}`);
            await loadAccounts();
        } catch (error) {
            console.error('Failed to delete account:', error);
        }
    };

    const filteredAccounts = filterType === 'ALL'
        ? accounts
        : accounts.filter(a => a.type === filterType);

    const totalBalance = filteredAccounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Quản lý Tài khoản</h1>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">Quản lý các tài khoản tài chính của bạn</p>
                </div>
                <Button onClick={() => openModal()}>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Thêm tài khoản
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card variant="gradient">
                    <p className="text-white/80 text-sm">Tổng số dư</p>
                    <p className="text-3xl font-bold mt-2">{formatCurrency(totalBalance)}</p>
                </Card>
                <Card>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Số tài khoản</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{accounts.length}</p>
                </Card>
                <Card>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Loại tài khoản</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                        {new Set(accounts.map(a => a.type)).size}
                    </p>
                </Card>
            </div>

            {/* Filter */}
            <Card>
                <div className="flex flex-wrap items-center gap-4">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Lọc theo loại:</span>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setFilterType('ALL')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterType === 'ALL'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            Tất cả ({accounts.length})
                        </button>
                        {accountTypeOptions.map((type) => {
                            const count = accounts.filter(a => a.type === type.value).length;
                            if (count === 0) return null;
                            return (
                                <button
                                    key={type.value}
                                    onClick={() => setFilterType(type.value)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterType === type.value
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {type.label} ({count})
                                </button>
                            );
                        })}
                    </div>
                </div>
            </Card>

            {/* Accounts Grid */}
            {filteredAccounts.length === 0 ? (
                <Card>
                    <div className="text-center py-12">
                        <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">Chưa có tài khoản nào</p>
                        <Button onClick={() => openModal()}>Thêm tài khoản đầu tiên</Button>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAccounts.map((account) => (
                        <Card key={account.id} className="relative group hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                                        {account.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{account.name}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {getAccountTypeLabel(account.type)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openModal(account)}
                                        className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(account.id)}
                                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div className="mt-6">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Số dư</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                                    {formatCurrency(Number(account.balance), account.currency)}
                                </p>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingAccount ? 'Sửa tài khoản' : 'Thêm tài khoản mới'}
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    <Input
                        label="Tên tài khoản"
                        placeholder="VD: Tiền mặt, Vietcombank..."
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        error={errors.name}
                    />

                    <Select
                        label="Loại tài khoản"
                        options={accountTypeOptions}
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as AccountType })}
                    />

                    <CurrencyInput
                        label="Số dư"
                        placeholder="0"
                        value={formData.balance}
                        onChange={(value) => setFormData({ ...formData, balance: value })}
                        error={errors.balance}
                    />

                    <Input
                        label="Đơn vị tiền tệ"
                        placeholder="VND"
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    />

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={closeModal} className="flex-1">
                            Hủy
                        </Button>
                        <Button type="submit" className="flex-1" isLoading={isSubmitting}>
                            {editingAccount ? 'Cập nhật' : 'Thêm mới'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
