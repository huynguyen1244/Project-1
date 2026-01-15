'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import CurrencyInput from '@/components/ui/CurrencyInput';
import { formatCurrency, formatDate, getLoanStatusLabel } from '@/lib/utils';
import api from '@/lib/api';
import { Loan, LoanStatus } from '@/types';

const loanStatusOptions = [
    { value: 'ACTIVE', label: 'Đang vay' },
    { value: 'PAID_OFF', label: 'Đã trả' },
    { value: 'DEFAULTED', label: 'Quá hạn' },
];

export default function LoansPage() {
    const [loans, setLoans] = useState<Loan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLoan, setEditingLoan] = useState<Loan | null>(null);

    const [formData, setFormData] = useState({
        lender: '',
        principal: '',
        interestRate: '',
        startDate: '',
        endDate: '',
        status: 'ACTIVE' as LoanStatus,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('ALL');

    useEffect(() => {
        loadLoans();
    }, []);

    const loadLoans = async () => {
        try {
            const data = await api.get<Loan[]>('/loan');
            setLoans(data);
        } catch (error) {
            console.error('Failed to load loans:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const openModal = (loan?: Loan) => {
        if (loan) {
            setEditingLoan(loan);
            setFormData({
                lender: loan.lender || '',
                principal: String(loan.principal),
                interestRate: loan.interestRate ? String(loan.interestRate) : '',
                startDate: loan.startDate ? new Date(loan.startDate).toISOString().split('T')[0] : '',
                endDate: loan.endDate ? new Date(loan.endDate).toISOString().split('T')[0] : '',
                status: loan.status,
            });
        } else {
            setEditingLoan(null);
            setFormData({
                lender: '',
                principal: '',
                interestRate: '',
                startDate: new Date().toISOString().split('T')[0],
                endDate: '',
                status: 'ACTIVE',
            });
        }
        setErrors({});
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingLoan(null);
        setErrors({});
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.principal || Number.isNaN(Number(formData.principal)) || Number(formData.principal) <= 0) {
            newErrors.principal = 'Vui lòng nhập số tiền vay hợp lệ';
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
                lender: formData.lender || null,
                principal: Number(formData.principal),
                interestRate: formData.interestRate ? Number(formData.interestRate) : null,
                startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
                endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
                status: formData.status,
            };

            if (editingLoan) {
                await api.patch(`/loan/${editingLoan.id}`, payload);
            } else {
                await api.post('/loan', payload);
            }

            await loadLoans();
            closeModal();
        } catch (error) {
            console.error('Failed to save loan:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Bạn có chắc chắn muốn xóa khoản vay này?')) return;

        try {
            await api.delete(`/loan/${id}`);
            await loadLoans();
        } catch (error) {
            console.error('Failed to delete loan:', error);
        }
    };

    const filteredLoans = filterStatus === 'ALL'
        ? loans
        : loans.filter(l => l.status === filterStatus);

    const totalActive = loans.filter(l => l.status === 'ACTIVE').reduce((sum, l) => sum + Number(l.principal), 0);
    const totalPaidOff = loans.filter(l => l.status === 'PAID_OFF').reduce((sum, l) => sum + Number(l.principal), 0);

    const getStatusColor = (status: LoanStatus) => {
        switch (status) {
            case 'ACTIVE': return 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300';
            case 'PAID_OFF': return 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300';
            case 'DEFAULTED': return 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300';
        }
    };

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
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Quản lý Khoản vay</h1>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">Theo dõi các khoản vay và nợ</p>
                </div>
                <Button onClick={() => openModal()}>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Thêm khoản vay
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Đang nợ</p>
                        <p className="text-2xl font-bold text-blue-600 mt-2">{formatCurrency(totalActive)}</p>
                        <p className="text-sm text-gray-500 mt-1">{loans.filter(l => l.status === 'ACTIVE').length} khoản vay</p>
                    </div>
                </Card>
                <Card className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Đã trả</p>
                        <p className="text-2xl font-bold text-green-600 mt-2">{formatCurrency(totalPaidOff)}</p>
                        <p className="text-sm text-gray-500 mt-1">{loans.filter(l => l.status === 'PAID_OFF').length} khoản vay</p>
                    </div>
                </Card>
                <Card className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tổng khoản vay</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">{loans.length}</p>
                        <p className="text-sm text-gray-500 mt-1">Tất cả trạng thái</p>
                    </div>
                </Card>
            </div>

            {/* Filter */}
            <Card>
                <div className="flex flex-wrap items-center gap-4">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Trạng thái:</span>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setFilterStatus('ALL')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterStatus === 'ALL'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            Tất cả ({loans.length})
                        </button>
                        {loanStatusOptions.map((status) => {
                            const count = loans.filter(l => l.status === status.value).length;
                            return (
                                <button
                                    key={status.value}
                                    onClick={() => setFilterStatus(status.value)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterStatus === status.value
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {status.label} ({count})
                                </button>
                            );
                        })}
                    </div>
                </div>
            </Card>

            {/* Loans List */}
            {filteredLoans.length === 0 ? (
                <Card>
                    <div className="text-center py-12">
                        <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">Chưa có khoản vay nào</p>
                        <Button onClick={() => openModal()}>Thêm khoản vay đầu tiên</Button>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredLoans.map((loan) => (
                        <Card key={loan.id} className="relative group hover:shadow-lg transition-shadow">
                            {/* Status badge */}
                            <div className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
                                {getLoanStatusLabel(loan.status)}
                            </div>

                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                        {loan.lender || 'Khoản vay'}
                                    </h3>
                                    {loan.startDate && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Từ {formatDate(loan.startDate)}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Số tiền vay</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                        {formatCurrency(Number(loan.principal))}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    {loan.interestRate && (
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-400">Lãi suất</p>
                                            <p className="font-medium text-gray-900 dark:text-gray-100">{loan.interestRate}%</p>
                                        </div>
                                    )}
                                    {loan.endDate && (
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-400">Đến hạn</p>
                                            <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(loan.endDate)}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openModal(loan)}
                                    className="flex-1"
                                >
                                    Sửa
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(loan.id)}
                                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/50"
                                >
                                    Xóa
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingLoan ? 'Sửa khoản vay' : 'Thêm khoản vay mới'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    <Input
                        label="Người cho vay"
                        placeholder="VD: Ngân hàng, Bạn bè..."
                        value={formData.lender}
                        onChange={(e) => setFormData({ ...formData, lender: e.target.value })}
                    />

                    <CurrencyInput
                        label="Số tiền vay"
                        placeholder="0"
                        value={formData.principal}
                        onChange={(value) => setFormData({ ...formData, principal: value })}
                        error={errors.principal}
                    />

                    <Input
                        label="Lãi suất (%/năm)"
                        type="number"
                        placeholder="0"
                        value={formData.interestRate}
                        onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Ngày vay"
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        />

                        <Input
                            label="Ngày đến hạn"
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        />
                    </div>

                    <Select
                        label="Trạng thái"
                        options={loanStatusOptions}
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as LoanStatus })}
                    />

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={closeModal} className="flex-1">
                            Hủy
                        </Button>
                        <Button type="submit" className="flex-1" isLoading={isSubmitting}>
                            {editingLoan ? 'Cập nhật' : 'Thêm mới'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
