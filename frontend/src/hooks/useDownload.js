/**
 * useDownload Hook
 * Custom hook for downloading files
 */

import { useState } from 'react';

export const useDownload = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const download = async (fetchFunction, filename) => {
        setIsLoading(true);
        setError(null);

        try {
            const { blob, filename: actualFilename } = await fetchFunction();
            
            // Create a temporary URL for the blob
            const url = window.URL.createObjectURL(blob);
            
            // Create a temporary anchor element and click it
            const link = document.createElement('a');
            link.href = url;
            link.download = actualFilename || filename || 'download';
            
            document.body.appendChild(link);
            link.click();
            
            // Clean up
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            return true;
        } catch (err) {
            setError(err.message || 'Failed to download file');
            console.error('Download error:', err);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        download,
        isLoading,
        error
    };
};

export default useDownload;
