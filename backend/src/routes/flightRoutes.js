/**
 * Rutas de Vuelos
 */

import express from 'express';

export const createFlightRoutes = (controller) => {
  const router = express.Router();

  /**
   * POST /flights - Crear nuevo vuelo
   */
  router.post('/', (req, res) => controller.createFlight(req, res));

  /**
   * GET /flights - Obtener todos los vuelos
   */
  router.get('/', (req, res) => controller.getAllFlights(req, res));

  /**
   * GET /flights/:flightId - Obtener vuelo específico
   */
  router.get('/:flightId', (req, res) => controller.getFlightById(req, res));

  /**
   * GET /flights/:flightId/availability - Obtener disponibilidad
   */
  router.get('/:flightId/availability', (req, res) => controller.getAvailability(req, res));

  /**
   * GET /flights/:flightId/seats - Obtener asientos disponibles
   */
  router.get('/:flightId/seats', (req, res) => controller.getAvailableSeats(req, res));

  /**
   * POST /flights/:flightId/seats/reserve - Reservar asiento
   */
  router.post('/:flightId/seats/reserve', (req, res) => controller.reserveSeat(req, res));

  /**
   * POST /flights/:flightId/seats/book - Comprar asiento
   */
  router.post('/:flightId/seats/book', (req, res) => controller.bookSeat(req, res));

  /**
   * GET /flights/:flightId/status - Actualizar estado del vuelo
   */
  router.put('/:flightId/status', (req, res) => controller.updateFlightStatus(req, res));

  // Rutas de Bookings
  /**
   * GET /bookings/:bookingId - Obtener booking específico
   */
  router.get('/bookings/:bookingId', (req, res) => controller.getBooking(req, res));

  /**
   * GET /passengers/:passengerId/bookings - Obtener bookings de un pasajero
   */
  router.get('/passengers/:passengerId/bookings', (req, res) => controller.getPassengerBookings(req, res));

  /**
   * DELETE /bookings/:bookingId - Cancelar booking
   */
  router.delete('/bookings/:bookingId', (req, res) => controller.cancelBooking(req, res));

  return router;
};

export default createFlightRoutes;
