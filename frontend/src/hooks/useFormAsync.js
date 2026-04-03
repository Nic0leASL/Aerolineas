/**
 * useFormAsync Hook
 * Custom hook for handling async form submissions
 */

import { useState } from 'react';

export const useFormAsync = (onSubmit) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (data) => {
        setIsLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const result = await onSubmit(data);
            setSuccess(true);
            return result;
        } catch (err) {
            setError(err.message || 'An error occurred');
            console.error('Form submission error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isLoading,
        error,
        success,
        handleSubmit
    };
};

/**
 * useFormValidation Hook
 * Custom hook for form validation
 */
export const useFormValidation = (initialValues = {}, onSubmit) => {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues(prev => ({ ...prev, [name]: value }));
        // Clear error when field is changed
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleBlur = (e) => {
        const { name } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await onSubmit(values);
        } catch (error) {
            setErrors(prev => ({
                ...prev,
                submit: error.message || 'An error occurred'
            }));
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        values,
        errors,
        touched,
        isSubmitting,
        setErrors,
        handleChange,
        handleBlur,
        handleSubmit
    };
};

export default useFormAsync;
