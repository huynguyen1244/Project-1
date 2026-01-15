'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import CurrencyInput from '@/components/ui/CurrencyInput';
import { formatCurrency, formatDate } from '@/lib/utils';
import api from '@/lib/api';
import { RecurringTransaction, Category, Account, Frequency } from '@/types';

const frequencyOptions = [
    { value: 'DAILY', label: 'Hàng ngày' },
    { value: 'WEEKLY', label: 'Hàng tuần' },
    { value: 'MONTHLY', label: 'Hàng tháng' },
    { value: 'YEARLY', label: 'Hàng năm' },
];

const getFrequencyLabel = (frequency: Frequency) => {
    return frequencyOptions.find(f => f.value === frequency)?.label || frequency;
};

export default function RecurringTransactionsPage() {
    const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null);

    const [formData, setFormData] = useState({
        accountId: '',
        categoryId: '',
        amount: '',
        description: '',
        frequency: 'MONTHLY' as Frequency,
        nextDate: new Date().toISOString().split('T')[0],
        endDate: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filters
    const [filterCategory, setFilterCategory] = useState<string>('ALL');
    const [filterFrequency, setFilterFrequency] = useState<string>('ALL');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [transactionsData, categoriesData, accountsData] = await Promise.all([
                api.get<RecurringTransaction[]>('/recurring-transaction'),
                api.get<Category[]>('/category'),
                api.get<Account[]>('/account'),
            ]);
            setRecurringTransactions(transactionsData);
            setCategories(categoriesData);
            setAccounts(accountsData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const openModal = (item?: RecurringTransaction) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                accountId: String(item.accountId),
                categoryId: String(item.categoryId),
                amount: String(item.amount),
                description: item.description || '',
                frequency: item.frequency,
                nextDate: new Date(item.nextDate).toISOString().split('T')[0],
                endDate: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '',
            });
        } else {
            setEditingItem(null);
            setFormData({
                accountId: accounts.length > 0 ? String(accounts[0].id) : '',
                categoryId: '',
                amount: '',
                description: '',
                frequency: 'MONTHLY',
                nextDate: new Date().toISOString().split('T')[0],
                endDate: '',
            });
        }
        setErrors({});
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setErrors({});
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.accountId) newErrors.accountId = 'Vui lòng chọn tài khoản';
        if (!formData.categoryId) newErrors.categoryId = 'Vui lòng chọn danh mục';
        if (!formData.amount || Number.isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
            newErrors.amount = 'Vui lòng nhập số tiền hợp lệ';
        }
        if (!formData.nextDate) newErrors.nextDate = 'Vui lòng chọn ngày tiếp theo';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        try {
            const payload = {
                accountId: Number(formData.accountId),
                categoryId: Number(formData.categoryId),
                amount: Number(formData.amount),
                description: formData.description || undefined,
                frequency: formData.frequency,
                nextDate: new Date(formData.nextDate).toISOString(),
                endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
            };

            if (editingItem) {
                await api.patch(`/recurring-transaction/${editingItem.id}`, payload);
            } else {
                await api.post('/recurring-transaction', payload);
            }

            await loadData();
            closeModal();
        } catch (error) {
            console.error('Failed to save recurring transaction:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Bạn có chắc chắn muốn xóa giao dịch định kỳ này?')) return;

        try {
            await api.delete(`/recurring-transaction/${id}`);
            await loadData();
        } catch (error) {
            console.error('Failed to delete recurring transaction:', error);
        }
    };

    const getCategoryById = (id: number) => categories.find(c => c.id === id);
    const getAccountById = (id: number) => accounts.find(a => a.id === id);

    // Filtered items
    const filteredItems = recurringTransactions.filter((item) => {
        const matchCategory = filterCategory === 'ALL' || item.categoryId === Number(filterCategory);
        const matchFrequency = filterFrequency === 'ALL' || item.frequency === filterFrequency;
        return matchCategory && matchFrequency;
    });

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
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Giao dịch định kỳ</h1>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">Quản lý các khoản thu chi lặp lại</p>
                </div>
                <Button onClick={() => openModal()}>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Thêm giao dịch định kỳ
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card variant="gradient">
                    <p className="text-white/80 text-sm">Tổng giao dịch định kỳ</p>
                    <p className="text-3xl font-bold mt-2">{recurringTransactions.length}</p>
                </Card>
                <Card>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Thu nhập định kỳ</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                        {recurringTransactions.filter(t => getCategoryById(t.categoryId)?.type === 'INCOME').length}
                    </p>
                </Card>
                <Card>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Chi tiêu định kỳ</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">
                        {recurringTransactions.filter(t => getCategoryById(t.categoryId)?.type === 'EXPENSE').length}
                    </p>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                    <label htmlFor="category-filter" className="text-sm text-gray-600 dark:text-gray-400">Danh mục:</label>
                    <select
                        id="category-filter"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                        <option value="ALL">Tất cả</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <label htmlFor="frequency-filter" className="text-sm text-gray-600 dark:text-gray-400">Tần suất:</label>
                    <select
                        id="frequency-filter"
                        value={filterFrequency}
                        onChange={(e) => setFilterFrequency(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                        <option value="ALL">Tất cả</option>
                        {frequencyOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
                {(filterCategory !== 'ALL' || filterFrequency !== 'ALL') && (
                    <button
                        onClick={() => {
                            setFilterCategory('ALL');
                            setFilterFrequency('ALL');
                        }}
                        className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                    >
                        Xóa bộ lọc
                    </button>
                )}
            </div>

            {/* List */}
            {filteredItems.length === 0 ? (
                <Card>
                    <div className="text-center py-12">
                        <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                            {recurringTransactions.length === 0 ? 'Chưa có giao dịch định kỳ nào' : 'Không tìm thấy giao dịch phù hợp'}
                        </p>
                        {recurringTransactions.length === 0 && (
                            <Button onClick={() => openModal()}>Thêm giao dịch đầu tiên</Button>
                        )}
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map((item) => {
                        const category = getCategoryById(item.categoryId);
                        const account = getAccountById(item.accountId);
                        const isIncome = category?.type === 'INCOME';

                        return (
                            <Card key={item.id} className="relative group hover:shadow-lg transition-shadow">
                                {/* Frequency badge */}
                                <div className="absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                                    {getFrequencyLabel(item.frequency)}
                                </div>

                                <div className="flex items-start gap-4 mb-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isIncome
                                        ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                                        : 'bg-gradient-to-br from-red-500 to-rose-500'
                                        } text-white`}>
                                        {isIncome ? (
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                            </svg>
                                        ) : (
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                            {category?.name || 'N/A'}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {account?.name || 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Số tiền</p>
                                        <p className={`text-2xl font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                                            {isIncome ? '+' : '-'}{formatCurrency(Number(item.amount))}
                                        </p>
                                    </div>
                                    {item.description && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                            {item.description}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                        <span>Tiếp theo: {formatDate(item.nextDate)}</span>
                                        {item.endDate && (
                                            <span>Kết thúc: {formatDate(item.endDate)}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openModal(item)}
                                        className="flex-1"
                                    >
                                        Sửa
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(item.id)}
                                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/50"
                                    >
                                        Xóa
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingItem ? 'Sửa giao dịch định kỳ' : 'Thêm giao dịch định kỳ'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Row 1: Tài khoản + Danh mục */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Select
                            label="Tài khoản"
                            value={formData.accountId}
                            onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                            options={accounts.map(a => ({ value: String(a.id), label: a.name }))}
                            placeholder="Chọn tài khoản"
                            error={errors.accountId}
                        />

                        <Select
                            label="Danh mục"
                            value={formData.categoryId}
                            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                            options={categories.map(c => ({ value: String(c.id), label: `${c.name} (${c.type === 'INCOME' ? 'Thu' : 'Chi'})` }))}
                            placeholder="Chọn danh mục"
                            error={errors.categoryId}
                        />
                    </div>

                    {/* Row 2: Số tiền + Tần suất */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <CurrencyInput
                            label="Số tiền"
                            placeholder="0"
                            value={formData.amount}
                            onChange={(value) => setFormData({ ...formData, amount: value })}
                            error={errors.amount}
                        />

                        <Select
                            label="Tần suất"
                            value={formData.frequency}
                            onChange={(e) => setFormData({ ...formData, frequency: e.target.value as Frequency })}
                            options={frequencyOptions}
                        />
                    </div>

                    {/* Row 3: Mô tả */}
                    <Input
                        label="Mô tả"
                        placeholder="Mô tả giao dịch (tùy chọn)"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />

                    {/* Row 4: Ngày tiếp theo + Ngày kết thúc */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Ngày tiếp theo"
                            type="date"
                            value={formData.nextDate}
                            onChange={(e) => setFormData({ ...formData, nextDate: e.target.value })}
                            error={errors.nextDate}
                        />

                        <Input
                            label="Ngày kết thúc (tùy chọn)"
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={closeModal} className="flex-1">
                            Hủy
                        </Button>
                        <Button type="submit" isLoading={isSubmitting} className="flex-1">
                            {editingItem ? 'Cập nhật' : 'Thêm mới'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
