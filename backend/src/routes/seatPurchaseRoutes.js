/**
 * Rutas de Compra de Boletos
 * Maneja las operaciones de compra definitiva de asientos en vuelos
 */

import express from 'express';

export const createSeatPurchaseRoutes = (controller) => {
  const router = express.Router();

  /**
   * POST /comprar
   * Crear una nueva compra de boleto (transacción definitiva)
   * Body: { flightId, seatNumber, passengerId, passengerName, email, phoneNumber (opcional) }
   */
  router.post('/', (req, res) => controller.purchaseSeat(req, res));

  /**
   * GET /comprar/boleto/:bookingId
   * Obtener información de un boleto específico
   */
  router.get('/boleto/:bookingId', (req, res) => controller.getBooking(req, res));

  /**
   * GET /comprar/pasajero/:passengerId
   * Obtener todos los boletos de un pasajero
   * Query: status (opcional): CONFIRMED, CANCELLED
   */
  router.get('/pasajero/:passengerId', (req, res) => controller.getPassengerBookings(req, res));

  /**
   * GET /comprar/eventos
   * Obtener historial de eventos de compras del nodo
   * Query: flightId (opcional), passengerId (opcional), limit (opcional, default 100)
   */
  router.get('/eventos', (req, res) => controller.getPurchaseEvents(req, res));

  /**
   * GET /comprar/ingresos
   * Obtener ingresos por tipo de asiento
   */
  router.get('/ingresos', (req, res) => controller.getRevenue(req, res));

  /**
   * GET /comprar/stats
   * Obtener estadísticas de compras del nodo
   */
  router.get('/stats', (req, res) => controller.getStats(req, res));

  /**
   * DELETE /comprar/boleto/:bookingId
   * Cancelar un boleto comprado
   */
  router.delete('/boleto/:bookingId', (req, res) => controller.cancelBooking(req, res));

  return router;
};

export default createSeatPurchaseRoutes;
