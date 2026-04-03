/**
 * EmptyState Component
 * Component for displaying empty state or no results
 */

import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';

export const EmptyState = ({ 
    title = 'No results found',
    message = 'Try adjusting your search filters',
    icon: Icon = AlertCircle,
    action
}) => {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="bg-gray-100 rounded-full p-4 mb-4">
                {Icon && <Icon size={32} className="text-gray-600" />}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 text-center mb-4 max-w-sm">{message}</p>
            {action && (
                <button
                    onClick={action.onClick}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
