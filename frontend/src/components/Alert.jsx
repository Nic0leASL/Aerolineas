/**
 * Alert Component
 * Reusable alert/notification component
 */

import { X, AlertCircle, CheckCircle, InfoIcon } from 'lucide-react';

export const Alert = ({ 
    type = 'info', 
    title, 
    message, 
    onClose,
    autoClose = 5000
}) => {
    const typeStyles = {
        error: 'bg-red-50 border-red-200 text-red-800',
        success: 'bg-green-50 border-green-200 text-green-800',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800'
    };

    const iconStyles = {
        error: 'text-red-500',
        success: 'text-green-500',
        warning: 'text-yellow-500',
        info: 'text-blue-500'
    };

    const icons = {
        error: AlertCircle,
        success: CheckCircle,
        warning: AlertCircle,
        info: InfoIcon
    };

    const Icon = icons[type];

    // Auto close after timeout
    React.useEffect(() => {
        if (autoClose && onClose) {
            const timer = setTimeout(onClose, autoClose);
            return () => clearTimeout(timer);
        }
    }, [autoClose, onClose]);

    return (
        <div className={`border-l-4 p-4 rounded-r-lg flex items-start gap-3 ${typeStyles[type]}`}>
            <Icon size={20} className={`flex-shrink-0 mt-0.5 ${iconStyles[type]}`} />
            <div className="flex-1">
                {title && <h4 className="font-semibold">{title}</h4>}
                {message && <p className="text-sm">{message}</p>}
            </div>
            {onClose && (
                <button
                    onClick={onClose}
                    className="flex-shrink-0 hover:opacity-70"
                >
                    <X size={18} />
                </button>
            )}
        </div>
    );
};

export default Alert;
