/**
 * LoadingButton Component
 * Button that shows loading state
 */

export const LoadingButton = ({ 
    children, 
    isLoading = false, 
    onClick,
    disabled = false,
    variant = 'primary',
    size = 'md',
    className = ''
}) => {
    const baseStyles = 'font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variantStyles = {
        primary: 'bg-blue-500 text-white hover:bg-blue-600',
        success: 'bg-green-500 text-white hover:bg-green-600',
        danger: 'bg-red-500 text-white hover:bg-red-600',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300'
    };

    const sizeStyles = {
        sm: 'px-3 py-1 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg'
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled || isLoading}
            className={`
                ${baseStyles} 
                ${variantStyles[variant]} 
                ${sizeStyles[size]}
                flex items-center gap-2
                ${className}
            `}
        >
            {isLoading && (
                <div className="animate-spin">
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                </div>
            )}
            <span>{children}</span>
        </button>
    );
};

export default LoadingButton;
