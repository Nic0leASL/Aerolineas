/**
 * Controlador de Búsqueda de Vuelos
 */

import Logger from '../utils/logger.js';

const logger = new Logger(process.env.LOG_LEVEL || 'info');

export class FlightSearchController {
  constructor(searchService) {
    this.service = searchService;
  }

  /**
   * Buscar vuelos con filtros
   */
  async searchFlights(req, res) {
    try {
      const flights = this.service.searchFlights(req.query);

      res.status(200).json({
        count: flights.length,
        filters: req.query,
        flights: flights.map(f => f.toJSON())
      });
    } catch (error) {
      logger.error('Error buscando vuelos', { error: error.message });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Obtener todos los vuelos (sin filtros)
   */
  async getAllFlights(req, res) {
    try {
      const flights = this.service.searchFlights(req.query);

      res.status(200).json({
        count: flights.length,
        flights: flights.map(f => f.toJSON())
      });
    } catch (error) {
      logger.error('Error obteniendo vuelos', { error: error.message });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Obtener vuelo específico
   */
  async getFlightById(req, res) {
    try {
      const { flightId } = req.params;

      // Soporte dinámico para compras múltiples (Dijkstra) vía Endpoint de Búsqueda
      if (flightId.includes('_MULTIHOP')) {
          const parts = flightId.replace('_MULTIHOP', '').split('-');
          const origin = parts[0];
          const dest = parts[parts.length - 1];

          // Fetch booked seats from local SQL Server instance to sync views
          const { getConnection } = await import('../config/db.js');
          const pool = await getConnection();
          const boughtSeats = await pool.request().query(`SELECT SeatNumber FROM Tickets WHERE FlightId = '${flightId}'`);
          const boughtSet = new Set(boughtSeats.recordset.map(r => r.SeatNumber));

          return res.status(200).json({
              id: flightId,
              flightNumber: `MULTI-${origin}-${dest}`,
              origin: origin,
              destination: dest,
              departureTime: "2026-04-14T08:00:00Z",
              arrivalTime: "2026-04-14T18:00:00Z",
              aircraft: "Aeronave Escalas Optimizada",
              status: "SCHEDULED",
              price: 1200,
              duration: 600,
              seats: Array.from({length: 228}, (_, i) => { // 8 First Class + 220 Economy (Boeing 787-9 Dreamliner)
                 const isFirst = i < 8;
                 const seatNumber = `${Math.floor(i / 6) + 1}${String.fromCharCode(65 + (i % 6))}`;
                 
                 // Hash determinista asegurado por el nombre del asiento y vuelo
                 const strSeed = `${flightId}_${seatNumber}`;
                 let hash = 0;
                 for (let k = 0; k < strSeed.length; k++) hash = Math.imul(31, hash) + strSeed.charCodeAt(k) | 0;
                 const deterRandom = Math.abs(Math.sin(hash)) || 0;

                 return {
                     seatNumber: seatNumber,
                     seatType: isFirst ? 'FIRST_CLASS' : 'ECONOMY_CLASS',
                     status: boughtSet.has(seatNumber) ? 'BOOKED' : (deterRandom < 0.73 ? 'BOOKED' : 'AVAILABLE'),
                     price: isFirst ? 2500 : 1200
                 };
             })
          });
      }

      const flight = this.service.getFlightDetails(flightId);

      if (!flight) {
        return res.status(404).json({
          error: 'Vuelo no encontrado',
          flightId
        });
      }

      // IMPORTANTE: Asegurar que se incluyen los asientos en la vista de detalle
      const responseData = flight.toJSONWithSeats ? flight.toJSONWithSeats() : flight;
      res.status(200).json(responseData);
    } catch (error) {
      logger.error('Error obteniendo vuelo', { error: error.message });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Obtener vuelos por ruta
   */
  async getFlightsByRoute(req, res) {
    try {
      const { origin, destination } = req.params;

      if (!origin || !destination) {
        return res.status(400).json({
          error: 'Se requieren parámetros: origin, destination'
        });
      }

      const flights = this.service.getFlightsByRoute(origin, destination);

      res.status(200).json({
        route: `${origin}-${destination}`,
        count: flights.length,
        flights: flights.map(f => f.toJSON())
      });
    } catch (error) {
      logger.error('Error buscando por ruta', { error: error.message });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Obtener vuelos disponibles (sin cancelados)
   */
  async getAvailableFlights(req, res) {
    try {
      const flights = this.service.getAvailableFlights(req.query);

      res.status(200).json({
        count: flights.length,
        flights: flights.map(f => f.toJSON())
      });
    } catch (error) {
      logger.error('Error obteniendo vuelos disponibles', { error: error.message });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Obtener vuelos próximos
   */
  async getUpcomingFlights(req, res) {
    try {
      const days = parseInt(req.query.days) || 7;
      const flights = this.service.getUpcomingFlights(days, req.query);

      res.status(200).json({
        days,
        count: flights.length,
        flights: flights.map(f => f.toJSON())
      });
    } catch (error) {
      logger.error('Error obteniendo vuelos próximos', { error: error.message });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Obtener estadísticas de vuelos
   */
  async getStatistics(req, res) {
    try {
      const stats = this.service.getFlightsStatistics();

      res.status(200).json(stats);
    } catch (error) {
      logger.error('Error obteniendo estadísticas', { error: error.message });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Obtener rutas disponibles
   */
  async getRoutes(req, res) {
    try {
      const routes = this.service.getAvailableRoutes();

      res.status(200).json({
        count: routes.length,
        routes
      });
    } catch (error) {
      logger.error('Error obteniendo rutas', { error: error.message });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

export default FlightSearchController;
