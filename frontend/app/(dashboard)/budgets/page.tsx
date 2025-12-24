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
import { Budget, Category, Transaction } from '@/types';

export default function BudgetsPage() {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

    const [formData, setFormData] = useState({
        categoryId: '',
        amount: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter state
    const [filterCategory, setFilterCategory] = useState<string>('ALL');
    const [filterStatus, setFilterStatus] = useState<string>('ALL');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [budgetsData, categoriesData, transactionsData] = await Promise.all([
                api.get<Budget[]>('/budget'),
                api.get<Category[]>('/category'),
                api.get<Transaction[]>('/transaction'),
            ]);
            setBudgets(budgetsData);
            setCategories(categoriesData.filter(c => c.type === 'EXPENSE'));
            setTransactions(transactionsData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const openModal = (budget?: Budget) => {
        if (budget) {
            setEditingBudget(budget);
            setFormData({
                categoryId: String(budget.categoryId),
                amount: String(budget.amount),
                startDate: new Date(budget.startDate).toISOString().split('T')[0],
                endDate: new Date(budget.endDate).toISOString().split('T')[0],
            });
        } else {
            setEditingBudget(null);
            const today = new Date();
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            setFormData({
                categoryId: '',
                amount: '',
                startDate: today.toISOString().split('T')[0],
                endDate: endOfMonth.toISOString().split('T')[0],
            });
        }
        setErrors({});
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingBudget(null);
        setErrors({});
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.categoryId) newErrors.categoryId = 'Vui lòng chọn danh mục';
        if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
            newErrors.amount = 'Vui lòng nhập ngân sách hợp lệ';
        }
        if (!formData.startDate) newErrors.startDate = 'Vui lòng chọn ngày bắt đầu';
        if (!formData.endDate) newErrors.endDate = 'Vui lòng chọn ngày kết thúc';
        if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
            newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
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
                categoryId: Number(formData.categoryId),
                amount: Number(formData.amount),
                startDate: new Date(formData.startDate).toISOString(),
                endDate: new Date(formData.endDate).toISOString(),
            };

            if (editingBudget) {
                await api.patch(`/budget/${editingBudget.id}`, payload);
            } else {
                await api.post('/budget', payload);
            }

            await loadData();
            closeModal();
        } catch (error) {
            console.error('Failed to save budget:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Bạn có chắc chắn muốn xóa ngân sách này?')) return;

        try {
            await api.delete(`/budget/${id}`);
            await loadData();
        } catch (error) {
            console.error('Failed to delete budget:', error);
        }
    };

    const getCategoryById = (id: number) => categories.find(c => c.id === id);

    const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount), 0);

    // Check if budget is active
    const isActive = (budget: Budget) => {
        const now = new Date();
        return new Date(budget.startDate) <= now && new Date(budget.endDate) >= now;
    };

    const activeBudgets = budgets.filter(isActive);

    // Tính số tiền đã chi tiêu cho một ngân sách
    const getSpentAmount = (budget: Budget): number => {
        const startDate = new Date(budget.startDate);
        const endDate = new Date(budget.endDate);

        return transactions
            .filter((t) => {
                const transDate = new Date(t.executionDate);
                return (
                    t.categoryId === budget.categoryId &&
                    transDate >= startDate &&
                    transDate <= endDate
                );
            })
            .reduce((sum, t) => sum + Number(t.amount), 0);
    };

    // Filtered budgets
    const filteredBudgets = budgets.filter((budget) => {
        const matchCategory = filterCategory === 'ALL' || budget.categoryId === Number(filterCategory);
        const active = isActive(budget);
        const matchStatus = filterStatus === 'ALL' ||
            (filterStatus === 'ACTIVE' && active) ||
            (filterStatus === 'EXPIRED' && !active);
        return matchCategory && matchStatus;
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
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Quản lý Ngân sách</h1>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">Thiết lập và theo dõi ngân sách chi tiêu</p>
                </div>
                <Button onClick={() => openModal()}>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Thêm ngân sách
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card variant="gradient">
                    <p className="text-white/80 text-sm">Tổng ngân sách</p>
                    <p className="text-3xl font-bold mt-2">{formatCurrency(totalBudget)}</p>
                </Card>
                <Card>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Số ngân sách</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{budgets.length}</p>
                </Card>
                <Card>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Đang hoạt động</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{activeBudgets.length}</p>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 dark:text-gray-400">Danh mục:</label>
                    <select
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
                    <label className="text-sm text-gray-600 dark:text-gray-400">Trạng thái:</label>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                        <option value="ALL">Tất cả</option>
                        <option value="ACTIVE">Đang hoạt động</option>
                        <option value="EXPIRED">Hết hạn</option>
                    </select>
                </div>
                {(filterCategory !== 'ALL' || filterStatus !== 'ALL') && (
                    <button
                        onClick={() => {
                            setFilterCategory('ALL');
                            setFilterStatus('ALL');
                        }}
                        className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                    >
                        Xóa bộ lọc
                    </button>
                )}
            </div>

            {/* Budgets Grid */}
            {filteredBudgets.length === 0 ? (
                <Card>
                    <div className="text-center py-12">
                        <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                            {budgets.length === 0 ? 'Chưa có ngân sách nào' : 'Không tìm thấy ngân sách phù hợp'}
                        </p>
                        {budgets.length === 0 && (
                            <Button onClick={() => openModal()}>Thêm ngân sách đầu tiên</Button>
                        )}
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBudgets.map((budget) => {
                        const category = getCategoryById(budget.categoryId);
                        const active = isActive(budget);

                        return (
                            <Card key={budget.id} className="relative group hover:shadow-lg transition-shadow">
                                {/* Status badge */}
                                <div className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-medium ${active
                                    ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                    }`}>
                                    {active ? 'Đang hoạt động' : 'Hết hạn'}
                                </div>

                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                            {category?.name || 'N/A'}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {formatDate(budget.startDate)} - {formatDate(budget.endDate)}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Ngân sách</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                            {formatCurrency(Number(budget.amount))}
                                        </p>
                                    </div>

                                    {/* Progress bar với số tiền thực tế */}
                                    {(() => {
                                        const spent = getSpentAmount(budget);
                                        const budgetAmount = Number(budget.amount);
                                        const percentage = budgetAmount > 0 ? Math.min((spent / budgetAmount) * 100, 100) : 0;
                                        const remaining = budgetAmount - spent;
                                        const isOverBudget = spent > budgetAmount;

                                        return (
                                            <>
                                                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${isOverBudget
                                                            ? 'bg-gradient-to-r from-red-500 to-red-600'
                                                            : percentage > 80
                                                                ? 'bg-gradient-to-r from-orange-500 to-red-500'
                                                                : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                                                            }`}
                                                        style={{ width: `${Math.min(percentage, 100)}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className={isOverBudget ? 'text-red-600 font-medium' : 'text-gray-500 dark:text-gray-400'}>
                                                        Đã chi: {formatCurrency(spent)}
                                                    </span>
                                                    <span className={`font-medium ${isOverBudget ? 'text-red-600' : 'text-gray-600 dark:text-gray-300'}`}>
                                                        {percentage.toFixed(0)}%
                                                    </span>
                                                </div>
                                                <p className={`text-xs ${isOverBudget ? 'text-red-600' : 'text-gray-500 dark:text-gray-400'}`}>
                                                    {isOverBudget
                                                        ? `Vượt ngân sách: ${formatCurrency(Math.abs(remaining))}`
                                                        : `Còn lại: ${formatCurrency(remaining)}`
                                                    }
                                                </p>
                                            </>
                                        );
                                    })()}
                                </div>

                                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openModal(budget)}
                                        className="flex-1"
                                    >
                                        Sửa
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(budget.id)}
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
                title={editingBudget ? 'Sửa ngân sách' : 'Thêm ngân sách mới'}
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    <Select
                        label="Danh mục"
                        options={categories.map(c => ({ value: String(c.id), label: c.name }))}
                        value={formData.categoryId}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        error={errors.categoryId}
                        placeholder="Chọn danh mục chi tiêu"
                    />

                    <CurrencyInput
                        label="Ngân sách"
                        placeholder="0"
                        value={formData.amount}
                        onChange={(value) => setFormData({ ...formData, amount: value })}
                        error={errors.amount}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Ngày bắt đầu"
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            error={errors.startDate}
                        />

                        <Input
                            label="Ngày kết thúc"
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            error={errors.endDate}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={closeModal} className="flex-1">
                            Hủy
                        </Button>
                        <Button type="submit" className="flex-1" isLoading={isSubmitting}>
                            {editingBudget ? 'Cập nhật' : 'Thêm mới'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
