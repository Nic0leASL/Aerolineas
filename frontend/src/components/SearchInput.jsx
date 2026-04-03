/**
 * SearchInput Component
 * Reusable search/filter input with icon
 */

import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';

export const SearchInput = ({ 
    placeholder, 
    value, 
    onChange, 
    onSearch 
}) => {
    const { t } = useTranslation();

    return (
        <div className="relative">
            <input
                type="text"
                placeholder={placeholder || t('common.search')}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyPress={(e) => {
                    if (e.key === 'Enter' && onSearch) onSearch();
                }}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
        </div>
    );
};

export default SearchInput;
