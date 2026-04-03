/**
 * FlightCard Component
 * Reusable card for displaying flight information
 */

import { useTranslation } from 'react-i18next';
import { Clock, Users, TrendingUp } from 'lucide-react';

export const FlightCard = ({ 
    flight, 
    onSelect, 
    isSelected = false,
    showPrice = true 
}) => {
    const { t } = useTranslation();

    const departureTime = new Date(flight.departureTime).toLocaleTimeString();
    const departureDate = new Date(flight.departureTime).toLocaleDateString();

    return (
        <div
            onClick={() => onSelect && onSelect(flight)}
            className={`p-4 border rounded-lg cursor-pointer transition hover:shadow-lg ${
                isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
            }`}
        >
            {/* Flight Header */}
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">
                        {flight.flightNumber || flight.id}
                    </h3>
                    <p className="text-sm text-gray-500">{departureDate}</p>
                </div>
                {showPrice && (
                    <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                            ${flight.baseCost || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">{t('common.per_seat')}</p>
                    </div>
                )}
            </div>

            {/* Route */}
            <div className="flex items-center justify-between mb-3">
                <div className="text-center">
                    <p className="text-lg font-bold">{flight.origin}</p>
                    <p className="text-xs text-gray-500">Salida</p>
                </div>
                <div className="flex-1 mx-3">
                    <div className="border-t-2 border-gray-300"></div>
                </div>
                <div className="text-center">
                    <p className="text-lg font-bold">{flight.destination}</p>
                    <p className="text-xs text-gray-500">Llegada</p>
                </div>
            </div>

            {/* Details */}
            <div className="flex gap-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                    <Clock size={16} />
                    <span>{departureTime}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Users size={16} />
                    <span>{flight.availableSeats || 0} {t('common.seats')}</span>
                </div>
                {flight.status && (
                    <div className="flex items-center gap-1">
                        <TrendingUp size={16} />
                        <span className="capitalize">{flight.status}</span>
                    </div>
                )}
            </div>

            {/* Aircraft Model */}
            {flight.aircraftModel && (
                <p className="text-xs text-gray-500 italic">
                    {flight.aircraftModel}
                </p>
            )}
        </div>
    );
};

export default FlightCard;
