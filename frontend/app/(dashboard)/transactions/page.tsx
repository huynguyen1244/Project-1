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
import { Transaction, Account, Category } from '@/types';

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        accountId: '',
        categoryId: '',
        transactionType: '' as 'INCOME' | 'EXPENSE' | '',
        amount: '',
        description: '',
        executionDate: new Date().toISOString().split('T')[0],
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [filterType, setFilterType] = useState<string>('ALL');
    const [filterCategory, setFilterCategory] = useState<string>('ALL');
    const [filterAccount, setFilterAccount] = useState<string>('ALL');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [transactionsData, accountsData, categoriesData] = await Promise.all([
                api.get<Transaction[]>('/transaction'),
                api.get<Account[]>('/account'),
                api.get<Category[]>('/category'),
            ]);
            setTransactions(transactionsData);
            setAccounts(accountsData);
            setCategories(categoriesData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const openModal = (transaction?: Transaction) => {
        if (transaction) {
            const category = getCategoryById(transaction.categoryId);
            setEditingTransaction(transaction);
            setFormData({
                accountId: String(transaction.accountId),
                categoryId: String(transaction.categoryId),
                transactionType: category?.type || '',
                amount: String(transaction.amount),
                description: transaction.description || '',
                executionDate: new Date(transaction.executionDate).toISOString().split('T')[0],
            });
        } else {
            setEditingTransaction(null);
            setFormData({
                accountId: accounts[0]?.id ? String(accounts[0].id) : '',
                categoryId: '',
                transactionType: '',
                amount: '',
                description: '',
                executionDate: new Date().toISOString().split('T')[0],
            });
        }
        setErrors({});
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingTransaction(null);
        setErrors({});
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.accountId) newErrors.accountId = 'Vui lòng chọn tài khoản';
        if (!formData.categoryId) newErrors.categoryId = 'Vui lòng chọn danh mục';
        if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
            newErrors.amount = 'Vui lòng nhập số tiền hợp lệ';
        }
        if (!formData.executionDate) newErrors.executionDate = 'Vui lòng chọn ngày';
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
                description: formData.description || null,
                executionDate: new Date(formData.executionDate).toISOString(),
            };

            if (editingTransaction) {
                await api.patch(`/transaction/${editingTransaction.id}`, payload);
            } else {
                await api.post('/transaction', payload);
            }

            await loadData();
            closeModal();
        } catch (error) {
            console.error('Failed to save transaction:', error);
            // Hiển thị thông báo lỗi từ backend
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            const errorMessage = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi lưu giao dịch';
            setErrors({ ...errors, submit: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) return;

        setDeleteError(null); // Reset lỗi trước khi xóa
        try {
            await api.delete(`/transaction/${id}`);
            await loadData();
        } catch (error) {
            console.error('Failed to delete transaction:', error);
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            const errorMessage = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi xóa giao dịch';
            setDeleteError(errorMessage);
        }
    };

    const exportToCSV = () => {
        const headers = ['ID', 'Ngày', 'Danh mục', 'Loại', 'Mô tả', 'Tài khoản', 'Số tiền'];
        const rows = filteredTransactions.map(t => {
            const category = getCategoryById(t.categoryId);
            const account = getAccountById(t.accountId);
            return [
                t.id,
                formatDate(t.executionDate),
                category?.name || 'N/A',
                category?.type === 'INCOME' ? 'Thu nhập' : 'Chi tiêu',
                t.description || '',
                account?.name || 'N/A',
                t.amount
            ];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `giao-dich-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getCategoryById = (id: number) => categories.find(c => c.id === id);
    const getAccountById = (id: number) => accounts.find(a => a.id === id);

    // Apply filters
    const filteredTransactions = transactions.filter((t) => {
        const category = getCategoryById(t.categoryId);

        // Search filter by category name and description
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const categoryName = category?.name?.toLowerCase() || '';
            const description = t.description?.toLowerCase() || '';
            if (!categoryName.includes(query) && !description.includes(query)) return false;
        }

        if (filterType !== 'ALL' && category?.type !== filterType) return false;
        if (filterCategory !== 'ALL' && String(t.categoryId) !== filterCategory) return false;
        if (filterAccount !== 'ALL' && String(t.accountId) !== filterAccount) return false;

        if (startDate && new Date(t.executionDate) < new Date(startDate)) return false;
        if (endDate && new Date(t.executionDate) > new Date(endDate)) return false;

        return true;
    });

    // Calculate totals
    const totalIncome = filteredTransactions
        .filter(t => getCategoryById(t.categoryId)?.type === 'INCOME')
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = filteredTransactions
        .filter(t => getCategoryById(t.categoryId)?.type === 'EXPENSE')
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const incomeCategories = categories.filter(c => c.type === 'INCOME');
    const expenseCategories = categories.filter(c => c.type === 'EXPENSE');

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
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Quản lý Thu Chi</h1>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">Theo dõi các giao dịch tài chính của bạn</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={exportToCSV} disabled={filteredTransactions.length === 0}>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Xuất CSV
                    </Button>
                    <Button onClick={() => openModal()}>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Thêm giao dịch
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tổng thu nhập</p>
                        <p className="text-2xl font-bold text-green-600 mt-2">+{formatCurrency(totalIncome)}</p>
                    </div>
                </Card>
                <Card className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/20 to-rose-500/20 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tổng chi tiêu</p>
                        <p className="text-2xl font-bold text-red-600 mt-2">-{formatCurrency(totalExpense)}</p>
                    </div>
                </Card>
                <Card className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Số dư</p>
                        <p className={`text-2xl font-bold mt-2 ${totalIncome - totalExpense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {totalIncome - totalExpense >= 0 ? '+' : ''}{formatCurrency(totalIncome - totalExpense)}
                        </p>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tìm kiếm:</span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tên, mô tả..."
                            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm w-40 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Loại:</span>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                        >
                            <option value="ALL">Tất cả</option>
                            <option value="INCOME">Thu nhập</option>
                            <option value="EXPENSE">Chi tiêu</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Danh mục:</span>
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                        >
                            <option value="ALL">Tất cả</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tài khoản:</span>
                        <select
                            value={filterAccount}
                            onChange={(e) => setFilterAccount(e.target.value)}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                        >
                            <option value="ALL">Tất cả</option>
                            {accounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Từ:</span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Đến:</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                        />
                    </div>
                    <button
                        onClick={() => {
                            setSearchQuery('');
                            setFilterType('ALL');
                            setFilterCategory('ALL');
                            setFilterAccount('ALL');
                            setStartDate('');
                            setEndDate('');
                        }}
                        className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                    >
                        Xóa bộ lọc
                    </button>
                </div>
            </Card>

            {/* Transactions List */}
            <Card>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Danh sách giao dịch ({filteredTransactions.length})
                    </h2>
                </div>

                {/* Hiển thị lỗi xóa giao dịch */}
                {deleteError && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 flex items-center justify-between">
                        <p className="text-sm text-red-600 dark:text-red-400">{deleteError}</p>
                        <button
                            onClick={() => setDeleteError(null)}
                            className="text-red-500 hover:text-red-700"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {filteredTransactions.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">Chưa có giao dịch nào</p>
                        <Button onClick={() => openModal()}>Thêm giao dịch đầu tiên</Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredTransactions.map((transaction) => {
                            const category = getCategoryById(transaction.categoryId);
                            const account = getAccountById(transaction.accountId);
                            const isIncome = category?.type === 'INCOME';

                            return (
                                <div
                                    key={transaction.id}
                                    className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isIncome
                                            ? 'bg-green-100 dark:bg-green-900/50 text-green-600'
                                            : 'bg-red-100 dark:bg-red-900/50 text-red-600'
                                            }`}>
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
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-gray-100">
                                                {category?.name || 'N/A'}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {transaction.description || 'Không có mô tả'} • {account?.name} • {formatDate(transaction.executionDate)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <p className={`font-semibold text-lg ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                                            {isIncome ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                                        </p>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openModal(transaction)}
                                                className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(transaction.id)}
                                                className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingTransaction ? 'Sửa giao dịch' : 'Thêm giao dịch mới'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Tài khoản và Loại giao dịch trên 1 hàng */}
                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Tài khoản"
                            options={accounts.map(a => ({ value: String(a.id), label: a.name }))}
                            value={formData.accountId}
                            onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                            error={errors.accountId}
                            placeholder="Chọn tài khoản"
                        />

                        <Select
                            label="Loại giao dịch"
                            options={[
                                { value: 'INCOME', label: 'Thu nhập' },
                                { value: 'EXPENSE', label: 'Chi tiêu' },
                            ]}
                            value={formData.transactionType}
                            onChange={(e) => setFormData({
                                ...formData,
                                transactionType: e.target.value as 'INCOME' | 'EXPENSE' | '',
                                categoryId: '' // Reset category khi đổi loại
                            })}
                            error={errors.transactionType}
                            placeholder="Chọn loại giao dịch"
                        />
                    </div>

                    {/* Dropdown 2: Danh mục (phụ thuộc vào loại giao dịch) */}
                    {formData.transactionType && (
                        <Select
                            label="Danh mục"
                            options={(formData.transactionType === 'INCOME' ? incomeCategories : expenseCategories)
                                .map(c => ({ value: String(c.id), label: c.name }))}
                            value={formData.categoryId}
                            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                            error={errors.categoryId}
                            placeholder="Chọn danh mục"
                        />
                    )}

                    {!formData.transactionType && errors.categoryId && (
                        <p className="text-sm text-red-500">{errors.categoryId}</p>
                    )}

                    <CurrencyInput
                        label="Số tiền"
                        placeholder="0"
                        value={formData.amount}
                        onChange={(value) => setFormData({ ...formData, amount: value })}
                        error={errors.amount}
                    />

                    <Input
                        label="Mô tả"
                        placeholder="Nhập mô tả giao dịch..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />

                    <Input
                        label="Ngày thực hiện"
                        type="date"
                        value={formData.executionDate}
                        onChange={(e) => setFormData({ ...formData, executionDate: e.target.value })}
                        error={errors.executionDate}
                    />

                    {errors.submit && (
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
                            <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={closeModal} className="flex-1">
                            Hủy
                        </Button>
                        <Button type="submit" className="flex-1" isLoading={isSubmitting}>
                            {editingTransaction ? 'Cập nhật' : 'Thêm mới'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
