/**
 * Rutas de Reserva de Asientos
 * Maneja las operaciones de reserva temporal de asientos en vuelos
 */

import express from 'express';

export const createSeatReservationRoutes = (controller) => {
  const router = express.Router();

  /**
   * POST /reservar
   * Crear una nueva reserva temporal de asiento
   * Body: { flightId, seatNumber, userId, holdDuration (opcional) }
   */
  router.post('/', (req, res) => controller.reserveSeat(req, res));

  /**
   * GET /reservar/eventos
   * Obtener historial de eventos de reservas del nodo
   * Query: flightId (opcional), userId (opcional), limit (opcional, default 100)
   */
  router.get('/eventos', (req, res) => controller.getReservationEvents(req, res));

  /**
   * GET /reservar/activas
   * Obtener todas las reservas activas (asientos en estado RESERVED)
   * Query: flightId (opcional)
   */
  router.get('/activas', (req, res) => controller.getActiveReservations(req, res));

  /**
   * GET /reservar/stats
   * Obtener estadísticas de reservas del nodo
   */
  router.get('/stats', (req, res) => controller.getStats(req, res));

  /**
   * DELETE /reservar/:flightId/:seatNumber
   * Liberar una reserva (cancelar hold temporal)
   * Body: { userId (opcional para validación) }
   */
  router.delete('/:flightId/:seatNumber', (req, res) => controller.releaseReservation(req, res));

  return router;
};

export default createSeatReservationRoutes;
