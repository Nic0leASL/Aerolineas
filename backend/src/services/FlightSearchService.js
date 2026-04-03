/**
 * Servicio de Búsqueda y Consulta de Vuelos
 * Implementa lógica de filtrado y búsqueda de vuelos
 */

import Logger from '../utils/logger.js';
import { FLIGHT_STATES } from '../constants/flightStates.js';

const logger = new Logger(process.env.LOG_LEVEL || 'info');

class FlightSearchService {
  constructor(flightService) {
    this.flightService = flightService;
  }

  /**
   * Busca vuelos con múltiples filtros
   * @param {Object} filters - Objeto con filtros
   * @returns {Array} Array de vuelos que cumplen los criterios
   */
  searchFlights(filters = {}) {
    let flights = this.flightService.getAllFlights();

    // Filtrar por origen
    if (filters.origin) {
      flights = flights.filter(f =>
        f.origin.toUpperCase() === filters.origin.toUpperCase()
      );
    }

    // Filtrar por destino
    if (filters.destination) {
      flights = flights.filter(f =>
        f.destination.toUpperCase() === filters.destination.toUpperCase()
      );
    }

    // Filtrar por ruta completa (origen + destino)
    if (filters.route) {
      const [origin, destination] = filters.route.toUpperCase().split('-');
      if (origin && destination) {
        flights = flights.filter(f =>
          f.origin.toUpperCase() === origin &&
          f.destination.toUpperCase() === destination
        );
      }
    }

    // Filtrar por estado del vuelo
    if (filters.status) {
      const statusUpper = filters.status.toUpperCase();
      if (Object.values(FLIGHT_STATES).includes(statusUpper)) {
        flights = flights.filter(f => f.status === statusUpper);
      }
    }

    // Filtrar por fecha de despegue
    if (filters.departureDate) {
      const targetDate = new Date(filters.departureDate);
      const targetDateStr = targetDate.toISOString().split('T')[0];

      flights = flights.filter(f => {
        const flightDate = new Date(f.departureTime).toISOString().split('T')[0];
        return flightDate === targetDateStr;
      });
    }

    // Filtrar por rango de fechas
    if (filters.startDate && filters.endDate) {
      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);

      flights = flights.filter(f => {
        const flightDate = new Date(f.departureTime);
        return flightDate >= startDate && flightDate <= endDate;
      });
    }

    // Filtrar por número de vuelo
    if (filters.flightNumber) {
      flights = flights.filter(f =>
        f.flightNumber.toUpperCase().includes(filters.flightNumber.toUpperCase())
      );
    }

    // Filtrar por tipo de aeronave
    if (filters.aircraft) {
      flights = flights.filter(f =>
        f.aircraft.toUpperCase().includes(filters.aircraft.toUpperCase())
      );
    }

    // Filtrar por disponibilidad mínima
    if (filters.minAvailable) {
      const minSeats = parseInt(filters.minAvailable);
      flights = flights.filter(f => {
        const availability = f.getAvailability();
        return availability.available >= minSeats;
      });
    }

    // Filtrar por tipo de asiento disponible
    if (filters.seatType) {
      const seatType = filters.seatType.toUpperCase();
      flights = flights.filter(f => {
        const availability = f.getAvailability();
        return availability.byType[seatType] &&
          availability.byType[seatType].available > 0;
      });
    }

    // Filtrar por rango de precio
    if (filters.minPrice || filters.maxPrice) {
      flights = flights.filter(f => {
        if (filters.minPrice && f.price < parseInt(filters.minPrice)) {
          return false;
        }
        if (filters.maxPrice && f.price > parseInt(filters.maxPrice)) {
          return false;
        }
        return true;
      });
    }

    logger.info(`Búsqueda de vuelos realizada`, {
      filters,
      resultCount: flights.length
    });

    return flights;
  }

  /**
   * Obtiene un vuelo con detalles completos
   * @param {string} flightId - ID del vuelo
   * @returns {Object|null} Vuelo con detalles o null
   */
  getFlightDetails(flightId) {
    // Retornar la instancia del modelo para que el controlador decida la serialización
    return this.flightService.getFlight(flightId);
  }

  /**
   * Obtiene vuelos por ruta específica (muy usado)
   * @param {string} origin - Código origen
   * @param {string} destination - Código destino
   * @returns {Array} Vuelos en esa ruta
   */
  getFlightsByRoute(origin, destination) {
    return this.searchFlights({
      origin,
      destination
    });
  }

  /**
   * Obtiene vuelos disponibles (sin cancelados)
   * @param {Object} filters - Filtros adicionales
   * @returns {Array} Vuelos disponibles
   */
  getAvailableFlights(filters = {}) {
    return this.searchFlights({
      ...filters,
      status: 'SCHEDULED'
    });
  }

  /**
   * Obtiene vuelos proximos en los próximos N días
   * @param {number} days - Días a buscar
   * @param {Object} filters - Filtros adicionales
   * @returns {Array} Vuelos próximos
   */
  getUpcomingFlights(days = 7, filters = {}) {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + days);

    return this.searchFlights({
      ...filters,
      startDate: today.toISOString(),
      endDate: futureDate.toISOString()
    });
  }

  /**
   * Obtiene estadísticas de vuelos
   * @returns {Object} Estadísticas
   */
  getFlightsStatistics() {
    const flights = this.flightService.getAllFlights();

    const stats = {
      total: flights.length,
      byStatus: {},
      totalSeatsAvailable: 0,
      totalSeatsBooked: 0,
      averageOccupancy: 0
    };

    // Inicializar contadores de estado
    Object.values(FLIGHT_STATES).forEach(status => {
      stats.byStatus[status] = 0;
    });

    // Calcular estadísticas
    flights.forEach(flight => {
      stats.byStatus[flight.status]++;

      const availability = flight.getAvailability();
      stats.totalSeatsAvailable += availability.available;
      stats.totalSeatsBooked += availability.booked;
    });

    // Calcular ocupancia promedio
    if (flights.length > 0) {
      const totalSeats = flights.length * 190; // 190 asientos por vuelo
      stats.averageOccupancy = (stats.totalSeatsBooked / totalSeats * 100).toFixed(2) + '%';
    }

    return stats;
  }

  /**
   * Obtiene rutas disponibles (origen-destino único)
   * @returns {Array} Array de rutas únicas
   */
  getAvailableRoutes() {
    const flights = this.flightService.getAllFlights();
    const routes = new Set();

    flights.forEach(flight => {
      routes.add(`${flight.origin}-${flight.destination}`);
    });

    return Array.from(routes).map(route => {
      const [origin, destination] = route.split('-');
      const flights = this.getFlightsByRoute(origin, destination);
      const availability = flights.reduce((total, f) => {
        return total + f.getAvailability().available;
      }, 0);

      return {
        route,
        origin,
        destination,
        flightCount: flights.length,
        seatsAvailable: availability
      };
    });
  }
}

export default FlightSearchService;
