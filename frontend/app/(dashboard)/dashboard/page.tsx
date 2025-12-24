'use client';

import { useState, useEffect, useMemo } from 'react';
import Card from '@/components/ui/Card';
import { formatCurrency, formatDate, getAccountTypeLabel } from '@/lib/utils';
import api from '@/lib/api';
import { Account, Transaction, Category } from '@/types';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';

interface DashboardStats {
    totalBalance: number;
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats>({
        totalBalance: 0,
        totalIncome: 0,
        totalExpense: 0,
        netBalance: 0,
    });
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [accountsData, transactionsData, categoriesData] = await Promise.all([
                api.get<Account[]>('/account'),
                api.get<Transaction[]>('/transaction'),
                api.get<Category[]>('/category'),
            ]);

            setAccounts(accountsData);
            setCategories(categoriesData);
            setTransactions(transactionsData);
            setRecentTransactions(transactionsData.slice(0, 5));

            // Calculate stats
            const totalBalance = accountsData.reduce((sum, acc) => sum + Number(acc.balance), 0);

            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const thisMonthTransactions = transactionsData.filter(
                (t) => new Date(t.executionDate) >= startOfMonth
            );

            const totalIncome = thisMonthTransactions
                .filter((t) => {
                    const cat = categoriesData.find((c) => c.id === t.categoryId);
                    return cat?.type === 'INCOME';
                })
                .reduce((sum, t) => sum + Number(t.amount), 0);

            const totalExpense = thisMonthTransactions
                .filter((t) => {
                    const cat = categoriesData.find((c) => c.id === t.categoryId);
                    return cat?.type === 'EXPENSE';
                })
                .reduce((sum, t) => sum + Number(t.amount), 0);

            setStats({
                totalBalance,
                totalIncome,
                totalExpense,
                netBalance: totalIncome - totalExpense,
            });
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getCategoryName = (categoryId: number) => {
        return categories.find((c) => c.id === categoryId)?.name || 'N/A';
    };

    const getCategoryType = (categoryId: number) => {
        return categories.find((c) => c.id === categoryId)?.type || 'EXPENSE';
    };

    // Tính toán dữ liệu chart theo tài khoản được chọn
    const chartData = useMemo(() => {
        const now = new Date();
        const months: { month: string; income: number; expense: number }[] = [];

        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = date.toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' });

            const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
            const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

            // Filter transactions theo tài khoản nếu được chọn
            const filteredTransactions = transactions.filter((t) => {
                const transDate = new Date(t.executionDate);
                const inDateRange = transDate >= startOfMonth && transDate <= endOfMonth;
                const inAccount = selectedAccountId === 'ALL' || t.accountId === Number(selectedAccountId);
                return inDateRange && inAccount;
            });

            const income = filteredTransactions
                .filter((t) => getCategoryType(t.categoryId) === 'INCOME')
                .reduce((sum, t) => sum + Number(t.amount), 0);

            const expense = filteredTransactions
                .filter((t) => getCategoryType(t.categoryId) === 'EXPENSE')
                .reduce((sum, t) => sum + Number(t.amount), 0);

            months.push({ month: monthName, income, expense });
        }

        return months;
    }, [transactions, categories, selectedAccountId]);

    // Pie chart colors
    const EXPENSE_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4'];
    const INCOME_COLORS = ['#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'];

    // Tính toán dữ liệu pie chart theo danh mục (1 tháng gần đây)
    const { expensePieData, incomePieData } = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Filter transactions trong 1 tháng gần đây theo tài khoản
        const monthlyTransactions = transactions.filter((t) => {
            const transDate = new Date(t.executionDate);
            const inDateRange = transDate >= startOfMonth;
            const inAccount = selectedAccountId === 'ALL' || t.accountId === Number(selectedAccountId);
            return inDateRange && inAccount;
        });

        // Group by category cho expense
        const expenseByCategory: Record<number, number> = {};
        monthlyTransactions
            .filter((t) => getCategoryType(t.categoryId) === 'EXPENSE')
            .forEach((t) => {
                expenseByCategory[t.categoryId] = (expenseByCategory[t.categoryId] || 0) + Number(t.amount);
            });

        // Group by category cho income
        const incomeByCategory: Record<number, number> = {};
        monthlyTransactions
            .filter((t) => getCategoryType(t.categoryId) === 'INCOME')
            .forEach((t) => {
                incomeByCategory[t.categoryId] = (incomeByCategory[t.categoryId] || 0) + Number(t.amount);
            });

        // Convert to pie data
        const expensePieData = Object.entries(expenseByCategory)
            .map(([catId, amount]) => ({
                name: getCategoryName(Number(catId)),
                value: amount,
            }))
            .sort((a, b) => b.value - a.value);

        const incomePieData = Object.entries(incomeByCategory)
            .map(([catId, amount]) => ({
                name: getCategoryName(Number(catId)),
                value: amount,
            }))
            .sort((a, b) => b.value - a.value);

        return { expensePieData, incomePieData };
    }, [transactions, categories, selectedAccountId]);

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
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
                <p className="mt-1 text-gray-500 dark:text-gray-400">Tổng quan tài chính của bạn</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tổng số dư</p>
                        <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
                            {formatCurrency(stats.totalBalance)}
                        </p>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                            <span>Từ {accounts.length} tài khoản</span>
                        </div>
                    </div>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Thu nhập tháng này</p>
                        <p className="mt-2 text-3xl font-bold text-green-600">
                            +{formatCurrency(stats.totalIncome)}
                        </p>
                        <div className="mt-2 flex items-center text-sm text-green-600">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                            </svg>
                            <span>Thu nhập</span>
                        </div>
                    </div>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/20 to-rose-500/20 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Chi tiêu tháng này</p>
                        <p className="mt-2 text-3xl font-bold text-red-600">
                            -{formatCurrency(stats.totalExpense)}
                        </p>
                        <div className="mt-2 flex items-center text-sm text-red-600">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                            </svg>
                            <span>Chi tiêu</span>
                        </div>
                    </div>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Số dư tháng</p>
                        <p className={`mt-2 text-3xl font-bold ${stats.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {stats.netBalance >= 0 ? '+' : ''}{formatCurrency(stats.netBalance)}
                        </p>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                            <span>Thu nhập - Chi tiêu</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Main Content - 2/3 + 1/3 columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Column 1: Chart (2/3) */}
                <div className="lg:col-span-2">
                    <Card>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                Biểu đồ Thu nhập & Chi tiêu
                            </h2>
                            <select
                                value={selectedAccountId}
                                onChange={(e) => setSelectedAccountId(e.target.value)}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                <option value="ALL">Tất cả tài khoản</option>
                                {accounts.map((acc) => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                                    <YAxis
                                        stroke="#6b7280"
                                        fontSize={12}
                                        tickFormatter={(value) => {
                                            if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
                                            if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                                            return value;
                                        }}
                                    />
                                    <Tooltip
                                        formatter={(value: number) => formatCurrency(value)}
                                        labelStyle={{ color: '#111827' }}
                                        contentStyle={{
                                            backgroundColor: '#ffffff',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '0.75rem',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                        }}
                                    />
                                    <Legend />
                                    <Bar dataKey="income" name="Thu nhập" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="expense" name="Chi tiêu" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* Pie Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        {/* Expense Pie Chart */}
                        <Card>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                Chi tiêu theo danh mục
                            </h3>
                            <div style={{ width: '100%', height: 200 }}>
                                {expensePieData.length === 0 ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                            <span className="text-gray-400 text-sm">Không có dữ liệu</span>
                                        </div>
                                    </div>
                                ) : (
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie
                                                data={expensePieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={40}
                                                outerRadius={70}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {expensePieData.map((_, index) => (
                                                    <Cell key={`expense-cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                            {expensePieData.length > 0 && (
                                <div className="mt-3 space-y-1">
                                    {expensePieData.slice(0, 4).map((item, index) => (
                                        <div key={item.name} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: EXPENSE_COLORS[index % EXPENSE_COLORS.length] }}
                                                />
                                                <span className="text-gray-600 dark:text-gray-400 truncate max-w-[100px]">{item.name}</span>
                                            </div>
                                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                                {formatCurrency(item.value)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>

                        {/* Income Pie Chart */}
                        <Card>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                Thu nhập theo danh mục
                            </h3>
                            <div style={{ width: '100%', height: 200 }}>
                                {incomePieData.length === 0 ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                            <span className="text-gray-400 text-sm">Không có dữ liệu</span>
                                        </div>
                                    </div>
                                ) : (
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie
                                                data={incomePieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={40}
                                                outerRadius={70}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {incomePieData.map((_, index) => (
                                                    <Cell key={`income-cell-${index}`} fill={INCOME_COLORS[index % INCOME_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                            {incomePieData.length > 0 && (
                                <div className="mt-3 space-y-1">
                                    {incomePieData.slice(0, 4).map((item, index) => (
                                        <div key={item.name} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: INCOME_COLORS[index % INCOME_COLORS.length] }}
                                                />
                                                <span className="text-gray-600 dark:text-gray-400 truncate max-w-[100px]">{item.name}</span>
                                            </div>
                                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                                {formatCurrency(item.value)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>
                </div>

                {/* Column 2: Recent Transactions + Accounts (1/3) */}
                <div className="space-y-6">
                    {/* Recent Transactions */}
                    <Card>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Giao dịch gần đây</h2>
                            <a href="/transactions" className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">
                                Xem tất cả →
                            </a>
                        </div>

                        {recentTransactions.length === 0 ? (
                            <div className="text-center py-6 text-gray-500">
                                Chưa có giao dịch nào
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentTransactions.slice(0, 5).map((transaction) => {
                                    const isIncome = getCategoryType(transaction.categoryId) === 'INCOME';
                                    return (
                                        <div
                                            key={transaction.id}
                                            className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isIncome
                                                    ? 'bg-green-100 dark:bg-green-900/50 text-green-600'
                                                    : 'bg-red-100 dark:bg-red-900/50 text-red-600'
                                                    }`}>
                                                    {isIncome ? (
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                                        {getCategoryName(transaction.categoryId)}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {formatDate(transaction.executionDate)}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className={`font-semibold text-sm ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                                                {isIncome ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>

                    {/* Accounts */}
                    <Card>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tài khoản</h2>
                            <a href="/accounts" className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">
                                Quản lý →
                            </a>
                        </div>

                        {accounts.length === 0 ? (
                            <div className="text-center py-6 text-gray-500">
                                Chưa có tài khoản nào
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {accounts.map((account) => (
                                    <div
                                        key={account.id}
                                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                                                {account.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{account.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {getAccountTypeLabel(account.type)}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                            {formatCurrency(Number(account.balance))}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
