import { cn } from '@/lib/utils';
import { SelectHTMLAttributes, forwardRef, useId } from 'react';

interface SelectOption {
    readonly value: string;
    readonly label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    readonly label?: string;
    readonly error?: string;
    readonly options: readonly SelectOption[];
    readonly placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, label, error, options, placeholder, id: providedId, ...props }, ref) => {
        const reactId = useId();
        const id = providedId ?? reactId;
        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={id}
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                    >
                        {label}
                    </label>
                )}
                <select
                    ref={ref}
                    id={id}
                    className={cn(
                        'w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-gray-800 transition-all duration-200',
                        'text-gray-900 dark:text-gray-100',
                        'focus:outline-none focus:ring-2 focus:ring-offset-0',
                        error
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                            : 'border-gray-200 dark:border-gray-700 focus:border-indigo-500 focus:ring-indigo-500/20',
                        className
                    )}
                    {...props}
                >
                    {placeholder && (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    )}
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
            </div>
        );
    }
);

Select.displayName = 'Select';

export default Select;
