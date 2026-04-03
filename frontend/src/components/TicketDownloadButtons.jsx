/**
 * TicketDownloadButtons Component
 * Buttons for downloading ticket in different formats (PDF, Apple Wallet, Google Pay)
 */

import { useTranslation } from 'react-i18next';
import { Download, Apple, CreditCard } from 'lucide-react';

export const TicketDownloadButtons = ({ 
    bookingData, 
    onPDF,
    onAppleWallet,
    onGooglePay,
    isLoading = false 
}) => {
    const { t } = useTranslation();

    return (
        <div className="flex flex-wrap gap-3 mt-4">
            {/* PDF Button */}
            <button
                onClick={onPDF}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                title="Descargar PDF"
            >
                <Download size={18} />
                PDF
            </button>

            {/* Apple Wallet Button */}
            <button
                onClick={onAppleWallet}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                title="Agregar a Apple Wallet"
            >
                <Apple size={18} />
                Apple Wallet
            </button>

            {/* Google Pay Button */}
            <button
                onClick={onGooglePay}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                title="Agregar a Google Pay"
            >
                <CreditCard size={18} />
                Google Pay
            </button>
        </div>
    );
};

export default TicketDownloadButtons;
