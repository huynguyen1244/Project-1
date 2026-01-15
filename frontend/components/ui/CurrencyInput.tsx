'use client';

import { forwardRef, useState, useEffect, useId } from 'react';
import { cn } from '@/lib/utils';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    readonly label?: string;
    readonly error?: string;
    readonly value: string;
    readonly onChange: (value: string) => void;
}

// Format số với khoảng cách mỗi 3 chữ số
const formatNumber = (value: string): string => {
    // Loại bỏ tất cả ký tự không phải số
    const numericValue = value.replace(/\D/g, '');
    // Thêm khoảng cách mỗi 3 chữ số từ phải sang trái
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

// Loại bỏ format để lấy số thuần
const parseNumber = (value: string): string => {
    return value.replace(/\s/g, '');
};

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
    ({ className, label, error, value, onChange, id: providedId, ...props }, ref) => {
        const reactId = useId();
        const id = providedId ?? reactId;
        const [displayValue, setDisplayValue] = useState(formatNumber(value));

        useEffect(() => {
            setDisplayValue(formatNumber(value));
        }, [value]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const inputValue = e.target.value;
            const numericValue = parseNumber(inputValue);

            // Chỉ cho phép số
            if (/^\d*$/.test(numericValue)) {
                setDisplayValue(formatNumber(numericValue));
                onChange(numericValue);
            }
        };

        return (
            <div className="space-y-1.5">
                {label && (
                    <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <input
                        ref={ref}
                        id={id}
                        type="text"
                        inputMode="numeric"
                        value={displayValue}
                        onChange={handleChange}
                        className={cn(
                            'w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-gray-800',
                            'text-gray-900 dark:text-gray-100 placeholder-gray-400',
                            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
                            'transition-all duration-200',
                            'text-left font-medium tracking-wide',
                            error
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-gray-200 dark:border-gray-700',
                            className
                        )}
                        {...props}
                    />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
        );
    }
);

CurrencyInput.displayName = 'CurrencyInput';

export default CurrencyInput;
