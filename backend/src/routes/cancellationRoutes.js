/**
 * Rutas de Cancelación y Devoluciones
 * Maneja cancelaciones de boletos con consistencia eventual
 */

import express from 'express';

export const createCancellationRoutes = (controller) => {
  const router = express.Router();

  /**
   * POST /cancelar
   * Cancelar un boleto (cambiar a REFUNDED, luego a AVAILABLE tras delay)
   * Body: { bookingId, refundDelay (opcional, default 5 segundos) }
   */
  router.post('/', (req, res) => controller.cancelTicket(req, res));

  /**
   * GET /cancelar/eventos
   * Obtener historial de cancelaciones y liberaciones
   * Query: flightId (opcional), passengerId (opcional), limit (opcional)
   */
  router.get('/eventos', (req, res) => controller.getCancellationEvents(req, res));

  /**
   * GET /cancelar/pendientes
   * Ver reembolsos pendientes (asientos en estado REFUNDED)
   * Query: flightId (opcional)
   */
  router.get('/pendientes', (req, res) => controller.getPendingRefunds(req, res));

  /**
   * GET /cancelar/completados
   * Ver reembolsos que ya fueron procesados
   * Query: limit (opcional, default 100)
   */
  router.get('/completados', (req, res) => controller.getCompletedRefunds(req, res));

  /**
   * GET /cancelar/resumen
   * Resumen general de reembolsos y consistencia eventual
   */
  router.get('/resumen', (req, res) => controller.getRefundsSummary(req, res));

  /**
   * GET /cancelar/stats
   * Estadísticas de cancelaciones y reembolsos
   */
  router.get('/stats', (req, res) => controller.getStats(req, res));

  /**
   * POST /cancelar/liberar-inmediato/:bookingId
   * Forzar liberación inmediata de reembolso (para sincronización)
   */
  router.post('/liberar-inmediato/:bookingId', (req, res) => controller.forceReleaseRefund(req, res));

  return router;
};

export default createCancellationRoutes;
