import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef, useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    readonly label?: string;
    readonly error?: string;
    readonly helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, helperText, type = 'text', id: providedId, ...props }, ref) => {
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
                <input
                    ref={ref}
                    id={id}
                    type={type}
                    className={cn(
                        'w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-gray-800 transition-all duration-200',
                        'text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500',
                        'focus:outline-none focus:ring-2 focus:ring-offset-0',
                        error
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                            : 'border-gray-200 dark:border-gray-700 focus:border-indigo-500 focus:ring-indigo-500/20',
                        className
                    )}
                    {...props}
                />
                {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
                {helperText && !error && (
                    <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
