/**
 * SeatOccupancyService.js
 * Ticket #17: Simulación inicial de ocupación de asientos
 * 
 * Genera distribución de asientos vendidos, reservados y disponibles
 * según porcentajes configurables para cada tipo de asiento.
 */

import { SEAT_TYPES, SEAT_STATUS, SEATS_PER_TYPE } from '../constants/seatTypes.js';

class SeatOccupancyService {
    /**
     * @param {Object} config - Porcentajes configurables
     * @param {Object} config.vendido  - % vendido por tipo {FIRST_CLASS, BUSINESS_CLASS, ECONOMY_CLASS}
     * @param {Object} config.reservado - % reservado por tipo
     */
    constructor(config = {}) {
        // Porcentajes por defecto según PDF: 73% vendidos, 3% reservados (configurable)
        this.config = {
            vendido: {
                FIRST_CLASS: config?.vendido?.FIRST_CLASS ?? 73,
                ECONOMY_CLASS: config?.vendido?.ECONOMY_CLASS ?? 73
            },
            reservado: {
                FIRST_CLASS: config?.reservado?.FIRST_CLASS ?? 3,
                ECONOMY_CLASS: config?.reservado?.ECONOMY_CLASS ?? 3
            }
        };
    }

    /**
     * Simular ocupación inicial para un vuelo
     * 
     * @param {Object} flight - Objeto vuelo con propiedad seats
     * @returns {Object} Resultado con estadísticas de distribución
     */
    simularOcupacion(flight) {
        if (!flight || !flight.seats) {
            return { success: false, error: 'Vuelo sin asientos' };
        }

        const stats = {
            FIRST_CLASS: { total: 0, vendidos: 0, reservados: 0, disponibles: 0 },
            ECONOMY_CLASS: { total: 0, vendidos: 0, reservados: 0, disponibles: 0 }
        };

        // Agrupar asientos por tipo
        const seatsByType = {
            FIRST_CLASS: [],
            ECONOMY_CLASS: []
        };

        for (const seat of Object.values(flight.seats)) {
            if (seatsByType[seat.seatType]) {
                seatsByType[seat.seatType].push(seat);
            }
        }

        // Para cada tipo, asignar ocupación
        for (const type of Object.keys(seatsByType)) {
            const seats = seatsByType[type];
            const total = seats.length;
            stats[type].total = total;

            const pctVendido = this.config.vendido[type] / 100;
            const pctReservado = this.config.reservado[type] / 100;

            const cantVendidos = Math.floor(total * pctVendido);
            const cantReservados = Math.floor(total * pctReservado);

            // Mezclar aleatoriamente para distribución realista
            const shuffled = this._shuffle([...seats]);

            // Asignar vendidos
            for (let i = 0; i < cantVendidos && i < shuffled.length; i++) {
                const seat = shuffled[i];
                seat.status = SEAT_STATUS.BOOKED;
                seat.bookedBy = this._generatePassengerId();
                seat.updatedAt = new Date();
                stats[type].vendidos++;
            }

            // Asignar reservados
            for (let i = cantVendidos; i < cantVendidos + cantReservados && i < shuffled.length; i++) {
                const seat = shuffled[i];
                seat.status = SEAT_STATUS.RESERVED;
                seat.reservedBy = this._generatePassengerId();
                seat.updatedAt = new Date();
                stats[type].reservados++;
            }

            // El resto queda disponible
            stats[type].disponibles = total - stats[type].vendidos - stats[type].reservados;
        }

        const totalSeats = Object.values(stats).reduce((s, t) => s + t.total, 0);
        const totalVendidos = Object.values(stats).reduce((s, t) => s + t.vendidos, 0);
        const totalReservados = Object.values(stats).reduce((s, t) => s + t.reservados, 0);
        const totalDisponibles = Object.values(stats).reduce((s, t) => s + t.disponibles, 0);

        return {
            success: true,
            flightId: flight.id,
            distribucion: stats,
            resumen: {
                total: totalSeats,
                vendidos: totalVendidos,
                reservados: totalReservados,
                disponibles: totalDisponibles,
                pctOcupacion: ((totalVendidos + totalReservados) / totalSeats * 100).toFixed(1)
            },
            configuracion: this.config
        };
    }

    /**
     * Simular ocupación para múltiples vuelos
     * 
     * @param {Array<Object>} flights - Array de vuelos
     * @returns {Object} Resultado global
     */
    simularOcupacionMasiva(flights) {
        if (!Array.isArray(flights) || flights.length === 0) {
            return { success: false, error: 'No hay vuelos para simular' };
        }

        const resultados = [];
        let totalGlobal = { total: 0, vendidos: 0, reservados: 0, disponibles: 0 };

        for (const flight of flights) {
            const result = this.simularOcupacion(flight);
            if (result.success) {
                resultados.push({
                    flightId: flight.id,
                    ...result.resumen
                });
                totalGlobal.total += result.resumen.total;
                totalGlobal.vendidos += result.resumen.vendidos;
                totalGlobal.reservados += result.resumen.reservados;
                totalGlobal.disponibles += result.resumen.disponibles;
            }
        }

        return {
            success: true,
            vuelosSimulados: resultados.length,
            resumenGlobal: {
                ...totalGlobal,
                pctOcupacion: totalGlobal.total > 0
                    ? ((totalGlobal.vendidos + totalGlobal.reservados) / totalGlobal.total * 100).toFixed(1)
                    : '0.0'
            },
            detallePorVuelo: resultados,
            configuracion: this.config,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Exportar distribución a JSON
     * 
     * @param {Object} flight - Vuelo con asientos ya simulados
     * @returns {Object} Datos exportables
     */
    exportarDistribucion(flight) {
        if (!flight || !flight.seats) {
            return { success: false, error: 'Vuelo sin asientos' };
        }

        const asientos = Object.values(flight.seats).map(seat => ({
            seatNumber: seat.seatNumber,
            seatType: seat.seatType,
            status: seat.status,
            bookedBy: seat.bookedBy || null,
            reservedBy: seat.reservedBy || null
        }));

        return {
            success: true,
            flightId: flight.id,
            totalAsientos: asientos.length,
            asientos,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Actualizar configuración de porcentajes
     * 
     * @param {Object} newConfig - Nueva configuración
     * @returns {Object} Configuración actualizada
     */
    actualizarConfiguracion(newConfig) {
        if (newConfig.vendido) {
            Object.assign(this.config.vendido, newConfig.vendido);
        }
        if (newConfig.reservado) {
            Object.assign(this.config.reservado, newConfig.reservado);
        }

        // Validar que vendido + reservado <= 100 para cada tipo
        for (const type of Object.keys(SEATS_PER_TYPE)) {
            const total = (this.config.vendido[type] || 0) + (this.config.reservado[type] || 0);
            if (total > 100) {
                return {
                    success: false,
                    error: `${type}: vendido(${this.config.vendido[type]}%) + reservado(${this.config.reservado[type]}%) = ${total}% > 100%`
                };
            }
        }

        return {
            success: true,
            configuracion: this.config
        };
    }

    /**
     * Obtener configuración actual
     */
    getConfiguracion() {
        return {
            success: true,
            configuracion: this.config,
            capacidadPorTipo: SEATS_PER_TYPE
        };
    }

    // ── Utilidades privadas ──

    _shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    _generatePassengerId() {
        return 1000 + Math.floor(Math.random() * 9000);
    }
}

export default SeatOccupancyService;
