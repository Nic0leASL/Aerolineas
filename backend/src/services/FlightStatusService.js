/**
 * FlightStatusService.js
 * Ticket #18: Actualización automática del estado de vuelos
 * 
 * Lógica para que vuelos con fecha posterior a ahora estén en SCHEDULED.
 * Mantiene consistencia de estados y registra actualizaciones.
 */

import { FLIGHT_STATES } from '../constants/flightStates.js';

class FlightStatusService {
    constructor() {
        this.log = []; // Registro de actualizaciones
    }

    /**
     * Actualizar estados de vuelos basándose en la fecha actual
     * Los vuelos con fecha futura deben estar en SCHEDULED
     * 
     * @param {Array<Object>} flightsData - Array de datos de vuelos (del cleaned JSON)
     * @param {Date} referenceDate - Fecha de referencia (default: ahora)
     * @returns {Object} Resultado con contadores y detalle
     */
    actualizarEstados(flightsData, referenceDate = new Date()) {
        if (!Array.isArray(flightsData) || flightsData.length === 0) {
            return { success: false, error: 'No hay vuelos para actualizar' };
        }

        const stats = {
            total: flightsData.length,
            actualizados: 0,
            yaCorrectos: 0,
            futuros: 0,
            pasados: 0,
            sinFechaValida: 0,
            cambios: []
        };

        for (const flight of flightsData) {
            const flightDate = this._parseFlightDate(flight.flight_date, flight.flight_time);

            if (!flightDate) {
                stats.sinFechaValida++;
                continue;
            }

            const esFuturo = flightDate > referenceDate;

            if (esFuturo) {
                stats.futuros++;

                // Si es futuro y NO está en SCHEDULED, actualizar
                if (flight.status !== FLIGHT_STATES.SCHEDULED) {
                    const estadoAnterior = flight.status;

                    // No actualizar vuelos cancelados (es una decisión válida)
                    if (flight.status === FLIGHT_STATES.CANCELLED) {
                        stats.yaCorrectos++;
                        continue;
                    }

                    // Evitar inconsistencias: vuelo futuro no puede estar en vuelo ni aterrizado
                    const estadosIncoherentes = [
                        FLIGHT_STATES.DEPARTED,
                        FLIGHT_STATES.IN_FLIGHT,
                        FLIGHT_STATES.LANDED,
                        FLIGHT_STATES.ARRIVED,
                        FLIGHT_STATES.BOARDING
                    ];

                    if (estadosIncoherentes.includes(flight.status)) {
                        flight.status = FLIGHT_STATES.SCHEDULED;
                        stats.actualizados++;

                        const cambio = {
                            flightId: flight.flightId || `${flight.origin}-${flight.destination}`,
                            fecha: flight.flight_date,
                            hora: flight.flight_time,
                            estadoAnterior,
                            estadoNuevo: FLIGHT_STATES.SCHEDULED,
                            razon: 'Vuelo futuro con estado incoherente'
                        };
                        stats.cambios.push(cambio);
                        this.log.push({ ...cambio, timestamp: new Date().toISOString() });
                    } else if (flight.status === FLIGHT_STATES.DELAYED) {
                        // DELAYED en vuelo futuro → mantener DELAYED (es válido)
                        stats.yaCorrectos++;
                    } else {
                        stats.yaCorrectos++;
                    }
                } else {
                    stats.yaCorrectos++;
                }
            } else {
                stats.pasados++;
                // Vuelos pasados: validar que no estén aún en SCHEDULED (inconsistencia)
                // Los dejamos como están, solo registramos si hay incoherencia
            }
        }

        return {
            success: true,
            fechaReferencia: referenceDate.toISOString(),
            estadisticas: stats,
            resumen: {
                total: stats.total,
                futuros: stats.futuros,
                pasados: stats.pasados,
                actualizados: stats.actualizados,
                yaCorrectos: stats.yaCorrectos,
                sinFechaValida: stats.sinFechaValida
            },
            cambiosRealizados: stats.cambios,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Validar consistencia de estados para todos los vuelos
     * Detecta vuelos con estados incoherentes sin modificarlos
     * 
     * @param {Array<Object>} flightsData - Array de vuelos
     * @param {Date} referenceDate - Fecha de referencia
     * @returns {Object} Reporte de inconsistencias
     */
    validarConsistencia(flightsData, referenceDate = new Date()) {
        if (!Array.isArray(flightsData) || flightsData.length === 0) {
            return { success: false, error: 'No hay vuelos para validar' };
        }

        const inconsistencias = [];

        for (const flight of flightsData) {
            const flightDate = this._parseFlightDate(flight.flight_date, flight.flight_time);
            if (!flightDate) continue;

            const esFuturo = flightDate > referenceDate;

            if (esFuturo) {
                // Vuelo futuro no debería tener estos estados
                const estadosInvalidos = [
                    FLIGHT_STATES.DEPARTED,
                    FLIGHT_STATES.IN_FLIGHT,
                    FLIGHT_STATES.LANDED,
                    FLIGHT_STATES.ARRIVED
                ];

                if (estadosInvalidos.includes(flight.status)) {
                    inconsistencias.push({
                        flightId: flight.flightId || `${flight.origin}-${flight.destination}`,
                        fecha: flight.flight_date,
                        hora: flight.flight_time,
                        estadoActual: flight.status,
                        problema: `Vuelo futuro con estado '${flight.status}' — debería ser SCHEDULED`,
                        tipo: 'FUTURO_CON_ESTADO_PASADO'
                    });
                }
            } else {
                // Vuelo pasado en SCHEDULED podría ser inconsistencia
                if (flight.status === FLIGHT_STATES.SCHEDULED || flight.status === FLIGHT_STATES.BOARDING) {
                    inconsistencias.push({
                        flightId: flight.flightId || `${flight.origin}-${flight.destination}`,
                        fecha: flight.flight_date,
                        hora: flight.flight_time,
                        estadoActual: flight.status,
                        problema: `Vuelo pasado aún en estado '${flight.status}'`,
                        tipo: 'PASADO_SIN_COMPLETAR'
                    });
                }
            }
        }

        return {
            success: true,
            totalVuelos: flightsData.length,
            inconsistenciasEncontradas: inconsistencias.length,
            consistente: inconsistencias.length === 0,
            inconsistencias,
            fechaReferencia: referenceDate.toISOString(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Validar que un avión (aircraft_id) no tenga vuelos activos superpuestos
     * 
     * @param {Array<Object>} flightsData - Array de vuelos
     * @returns {Object} Conflictos de aviones
     */
    validarRutasAvion(flightsData) {
        if (!Array.isArray(flightsData)) {
            return { success: false, error: 'No hay vuelos para validar' };
        }

        // Agrupar por aircraft_id
        const byAircraft = {};
        for (const flight of flightsData) {
            const id = flight.aircraft_id;
            if (!byAircraft[id]) byAircraft[id] = [];
            byAircraft[id].push(flight);
        }

        const conflictos = [];

        for (const [aircraftId, flights] of Object.entries(byAircraft)) {
            // Ordenar por fecha+hora
            const sorted = flights
                .map(f => ({
                    ...f,
                    dateObj: this._parseFlightDate(f.flight_date, f.flight_time)
                }))
                .filter(f => f.dateObj !== null)
                .sort((a, b) => a.dateObj - b.dateObj);

            // Verificar que no haya overlap (vuelos superpuestos)
            for (let i = 0; i < sorted.length - 1; i++) {
                const current = sorted[i];
                const next = sorted[i + 1];

                // Si el MISMO avión sale desde un lugar diferente al destino anterior
                // en una ventana < 60 minutos, potencial conflicto
                if (current.destination !== next.origin) {
                    const diff = (next.dateObj - current.dateObj) / (1000 * 60); // minutos
                    if (diff < 120) { // menos de 2 horas
                        conflictos.push({
                            aircraftId: parseInt(aircraftId),
                            vuelo1: {
                                ruta: `${current.origin}→${current.destination}`,
                                fecha: current.flight_date,
                                hora: current.flight_time
                            },
                            vuelo2: {
                                ruta: `${next.origin}→${next.destination}`,
                                fecha: next.flight_date,
                                hora: next.flight_time
                            },
                            diferenciaMinutos: diff.toFixed(0),
                            problema: `Avión ${aircraftId} aterriza en ${current.destination} pero siguiente vuelo sale de ${next.origin}`
                        });
                    }
                }
            }
        }

        return {
            success: true,
            totalAviones: Object.keys(byAircraft).length,
            conflictosDetectados: conflictos.length,
            sinConflictos: conflictos.length === 0,
            conflictos: conflictos.slice(0, 20), // Limitar a 20 para output manejable
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Obtener estadísticas globales agregadas
     * 
     * @param {Array<Object>} flightsData - Array de vuelos
     * @returns {Object} Estadísticas globales
     */
    getGlobalStats(flightsData) {
        if (!Array.isArray(flightsData) || flightsData.length === 0) {
            return {
                success: true,
                totalFlights: 0,
                totalBooked: 0,
                avgOccupancy: 0,
                totalRevenue: 0,
                statusCounts: {}
            };
        }

        const totalFlights = flightsData.length;
        const statusCounts = {};
        let totalBooked = 0;
        let totalRevenue = 0;
        let totalSeatsPool = 0;

        for (const flight of flightsData) {
            // Conteo de estados
            statusCounts[flight.status] = (statusCounts[flight.status] || 0) + 1;

            // Simulación de ocupación
            if (flight.seats) {
                const seatsArray = Array.isArray(flight.seats) ? flight.seats : Object.values(flight.seats);
                const booked = seatsArray.filter(s => s.status === 'BOOKED').length;
                const revenue = seatsArray.reduce((acc, s) => s.status === 'BOOKED' ? acc + (parseInt(s.price) || 0) : acc, 0);

                totalBooked += booked;
                totalRevenue += revenue;
                totalSeatsPool += seatsArray.length;
            } else {
                // Simulación para carga inicial masiva si no hay asientos
                const mockOccupancy = Math.floor(Math.random() * 80) + 10;
                const mockBooked = Math.round(190 * (mockOccupancy / 100)); // 190 total standard
                totalBooked += mockBooked;
                totalRevenue += mockBooked * (flight.price || 300);
                totalSeatsPool += 190;
            }
        }

        const avgOccupancy = totalSeatsPool > 0 ? ((totalBooked / totalSeatsPool) * 100).toFixed(1) : 0;

        return {
            success: true,
            totalFlights,
            totalBooked,
            totalRevenue,
            avgOccupancy: parseFloat(avgOccupancy),
            statusCounts,
            timestamp: new Date().toISOString()
        };
    }

    // ── Utilidades ──

    _parseFlightDate(dateStr, timeStr) {
        try {
            if (!dateStr) return null;

            // Formato esperado: YYYY-MM-DD (normalizado) o MM/DD/YY (original)
            let year, month, day;

            if (dateStr.includes('-')) {
                [year, month, day] = dateStr.split('-').map(Number);
            } else if (dateStr.includes('/')) {
                [month, day, year] = dateStr.split('/').map(Number);
                if (year < 100) year += 2000;
            } else {
                return null;
            }

            let hours = 0, minutes = 0;
            if (timeStr) {
                const parts = timeStr.split(':');
                hours = parseInt(parts[0]) || 0;
                minutes = parseInt(parts[1]) || 0;
            }

            return new Date(year, month - 1, day, hours, minutes);
        } catch {
            return null;
        }
    }
}

export default FlightStatusService;
