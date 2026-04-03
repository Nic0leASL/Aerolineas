/**
 * Rutas de Búsqueda y Consulta de Vuelos
 * Endpoints para consultar vuelos sin lógica de reservas
 */

import express from 'express';

export const createFlightSearchRoutes = (controller) => {
  const router = express.Router();

  /**
   * GET /vuelos - Buscar vuelos con filtros
   * Query params: origin, destination, status, departureDate, minAvailable, seatType, minPrice, maxPrice
   */
  router.get('/', (req, res) => controller.searchFlights(req, res));

  /**
   * GET /vuelos/:flightId - Obtener vuelo específico
   */
  router.get('/:flightId', (req, res) => controller.getFlightById(req, res));

  /**
   * GET /vuelos/ruta/:origin/:destination - Obtener vuelos por ruta
   */
  router.get('/ruta/:origin/:destination', (req, res) => controller.getFlightsByRoute(req, res));

  /**
   * GET /vuelos/disponibles - Obtener vuelos disponibles (SCHEDULED solamente)
   */
  router.get('/disponibles/todos', (req, res) => controller.getAvailableFlights(req, res));

  /**
   * GET /vuelos/proximos - Obtener vuelos próximos (N días)
   */
  router.get('/proximos/listar', (req, res) => controller.getUpcomingFlights(req, res));

  /**
   * GET /vuelos/estadisticas - Obtener estadísticas de vuelos
   */
  router.get('/estadisticas/resumen', (req, res) => controller.getStatistics(req, res));

  /**
   * GET /vuelos/rutas - Obtener todas las rutas disponibles
   */
  router.get('/rutas/lista', (req, res) => controller.getRoutes(req, res));

  return router;
};

export default createFlightSearchRoutes;
