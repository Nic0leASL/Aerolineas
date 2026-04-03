/**
 * Validation Schemas for React Hook Form
 * Reusable validation patterns
 */

export const validationRules = {
    // Flight Search
    flightSearch: {
        origin: {
            required: 'Origin airport is required',
            minLength: { value: 3, message: 'Origin must be at least 3 characters' },
            maxLength: { value: 5, message: 'Origin must not exceed 5 characters' }
        },
        destination: {
            required: 'Destination airport is required',
            minLength: { value: 3, message: 'Destination must be at least 3 characters' },
            maxLength: { value: 5, message: 'Destination must not exceed 5 characters' }
        },
        departureDate: {
            required: 'Departure date is required'
        }
    },

    // Booking/Reservation
    booking: {
        passengerName: {
            required: 'Passenger name is required',
            minLength: { value: 3, message: 'Name must be at least 3 characters' },
            maxLength: { value: 100, message: 'Name must not exceed 100 characters' },
            pattern: { value: /^[a-zA-Z\s]+$/, message: 'Name must contain only letters' }
        },
        passengerId: {
            required: 'Passenger ID is required',
            minLength: { value: 1, message: 'ID must not be empty' }
        },
        seatNumber: {
            required: 'Seat number is required'
        },
        email: {
            required: 'Email is required',
            pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
            }
        }
    },

    // Route Optimization
    routeSearch: {
        destinations: {
            required: 'At least one destination is required',
            minLength: { value: 1, message: 'Select at least one destination' }
        },
        criterion: {
            required: 'Please select optimization criterion'
        }
    }
};

/**
 * Custom validators
 */
export const customValidators = {
    /**
     * Validate airport code format
     */
    airportCode: (value) => {
        if (!value) return true;
        return /^[A-Z]{3}$/.test(value) || 'Airport code must be 3 uppercase letters';
    },

    /**
     * Validate passenger age
     */
    passengerAge: (value) => {
        const age = parseInt(value);
        return (age >= 0 && age <= 150) || 'Age must be between 0 and 150';
    },

    /**
     * Validate seat number format
     */
    seatNumber: (value) => {
        if (!value) return true;
        return /^[A-Z]\d{1,3}$/.test(value) || 'Seat must be in format A1, A12, etc.';
    },

    /**
     * Validate price
     */
    price: (value) => {
        const price = parseFloat(value);
        return price > 0 || 'Price must be greater than 0';
    }
};

export default validationRules;
