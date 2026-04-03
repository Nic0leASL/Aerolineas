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
