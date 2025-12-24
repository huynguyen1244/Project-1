// Format currency
export function formatCurrency(amount: number, currency: string = 'VND'): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: currency,
    }).format(amount);
}

// Format date
export function formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date(date));
}

// Format datetime
export function formatDateTime(date: string | Date): string {
    return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
}

// Get account type label in Vietnamese
export function getAccountTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        CASH: 'Tiền mặt',
        BANK: 'Ngân hàng',
        E_WALLET: 'Ví điện tử',
        INVESTMENT: 'Đầu tư',
        CREDIT_CARD: 'Thẻ tín dụng',
        CRYPTO_WALLET: 'Tiền điện tử',
        OTHER: 'Khác',
    };
    return labels[type] || type;
}

// Get category type label
export function getCategoryTypeLabel(type: string): string {
    return type === 'INCOME' ? 'Thu nhập' : 'Chi tiêu';
}

// Get loan status label
export function getLoanStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        ACTIVE: 'Đang vay',
        PAID_OFF: 'Đã trả',
        DEFAULTED: 'Quá hạn',
    };
    return labels[status] || status;
}

// Class names utility
export function cn(...classes: (string | undefined | null | false)[]): string {
    return classes.filter(Boolean).join(' ');
}
