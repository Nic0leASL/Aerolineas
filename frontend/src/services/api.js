/**
 * api.js
 * Frontend API Service for Tickets #20-25
 */

// Leer el nodo actual basado en la geolocalización del usuario
const region = localStorage.getItem('regionKey') || 'AMERICA';
const puertosNodos = {
    'AMERICA': '3001',   // La Paz (SQL)
    'EUROPE': '3002',    // Ucrania (SQL)
    'ASIA': '3003'       // Beijing (Mongo)
};
const currentPort = puertosNodos[region] || '3001';
const API_BASE_URL = `http://localhost:${currentPort}`;

/**
 * Common fetch wrapper with error handling
 */
async function apiFetch(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || data.error || 'Error en la petición');
    }
    return data;
}

export const api = {
    // Flights
    getFlights: (params) => {
        const query = new URLSearchParams(params).toString();
        return apiFetch(`/vuelos?${query}`);
    },
    getFlight: (id) => apiFetch(`/vuelos/${id}`),

    // Booking
    reserveSeat: (flightId, seatNumber, userId, passengerName, email) =>
        apiFetch('/reservar', {
            method: 'POST',
            body: JSON.stringify({ flightId, seatNumber, userId })
        }),

    bookSeat: (flightId, seatNumber, userId, passengerName, email) =>
        apiFetch('/comprar', {
            method: 'POST',
            body: JSON.stringify({ flightId, seatNumber, passengerId: userId, passengerName, email })
        }),

    cancelBooking: (bookingId) =>
        apiFetch('/cancelar', {
            method: 'POST',
            body: JSON.stringify({ bookingId })
        }),

    // Stats (Ticket #23)
    getStats: () => apiFetch('/estado-vuelos/estadisticas'),

    // Routing (Ticket #24)
    // Note: Backend uses Spanish keys 'origen' and 'destino' for these endpoints
    getCheapestRoute: (origen, destino) =>
        apiFetch('/rutas/mas-barata', {
            method: 'POST',
            body: JSON.stringify({ origen, destino })
        }),

    getFastestRoute: (origen, destino) =>
        apiFetch('/rutas/mas-rapida', {
            method: 'POST',
            body: JSON.stringify({ origen, destino })
        }),

    getKCheapestRoutes: (origen, destino, k = 2) =>
        apiFetch('/dijkstra/k-cheapest', {
            method: 'POST',
            body: JSON.stringify({ origin: origen, destination: destino, k })
        }),

    getKFastestRoutes: (origen, destino, k = 2) =>
        apiFetch('/time-optimized/k-fastest', {
            method: 'POST',
            body: JSON.stringify({ origin: origen, destination: destino, k })
        }),

    getTSP: (body) =>
        apiFetch('/tsp/solve', {
            method: 'POST',
            body: JSON.stringify(body)
        }),

    // Wallet Passes (Ticket #25)
    generateWalletPasses: (bookingData) =>
        apiFetch('/wallet-pass/generate', {
            method: 'POST',
            body: JSON.stringify(bookingData)
        }),

    getPassInfo: (bookingData) =>
        apiFetch('/wallet-pass/info', {
            method: 'POST',
            body: JSON.stringify(bookingData)
        }),

    downloadAppleWalletPass: async (bookingData) => {
        const response = await fetch(`${API_BASE_URL}/wallet-pass/download/apple`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        });
        if (!response.ok) throw new Error('Failed to download Apple Wallet pass');
        const blob = await response.blob();
        const filename = `Boarding_Pass_${bookingData.flight.id}_${bookingData.seat.seatNumber}.pkpass`;
        return { blob, filename };
    },

    downloadGooglePayPass: async (bookingData) => {
        const response = await fetch(`${API_BASE_URL}/wallet-pass/download/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        });
        if (!response.ok) throw new Error('Failed to download Google Pay pass');
        const blob = await response.blob();
        const filename = `Boarding_Pass_${bookingData.flight.id}_${bookingData.seat.seatNumber}.json`;
        return { blob, filename };
    },
};
