/**
 * Rutas de Sincronización de Eventos
 * Endpoints para recibir eventos remotos y consultar estado del reloj Lamport y Vector Clock
 */

import express from 'express';

export const createSyncRoutes = (syncController) => {
  const router = express.Router();

  // LAMPORT CLOCK ENDPOINTS
  
  /**
   * POST /sync/events
   * Recibir evento remoto de otro nodo
   * Body: { lamportMark, vectorClock, event, sourceNodeId, timestamp }
   */
  router.post('/events', (req, res) => syncController.receiveRemoteEvent(req, res));

  /**
   * GET /sync/received-events
   * Obtener historial de eventos recibidos de nodos remotos
   * Query: limit (opcional), sourceNodeId (opcional)
   */
  router.get('/received-events', (req, res) => syncController.getReceivedEvents(req, res));

  /**
   * GET /sync/ordered-events
   * Obtener todos los eventos ordenados por marca Lamport
   * Query: limit (opcional)
   */
  router.get('/ordered-events', (req, res) => syncController.getOrderedEvents(req, res));

  /**
   * GET /sync/causality-matrix
   * Obtener relaciones de causalidad entre eventos
   */
  router.get('/causality-matrix', (req, res) => syncController.getCausalityMatrix(req, res));

  /**
   * GET /sync/stats
   * Obtener estadísticas de sincronización y reloj Lamport
   */
  router.get('/stats', (req, res) => syncController.getStats(req, res));

  /**
   * GET /sync/clock
   * Ver detalles del reloj Lamport local
   */
  router.get('/clock', (req, res) => syncController.getClockInfo(req, res));

  /**
   * POST /sync/retry-failed
   * Reintentar envío de eventos que fallaron
   */
  router.post('/retry-failed', (req, res) => syncController.retryFailedEvents(req, res));

  // VECTOR CLOCK ENDPOINTS
  
  /**
   * GET /sync/vector-clock
   * Ver información del vector clock actual
   */
  router.get('/vector-clock', (req, res) => syncController.getVectorClockInfo(req, res));

  /**
   * GET /sync/vector-history
   * Ver eventos ordenados por vector clock
   * Query: limit (opcional)
   */
  router.get('/vector-history', (req, res) => syncController.getVectorHistory(req, res));

  /**
   * GET /sync/concurrent-events
   * Detectar eventos concurrentes
   */
  router.get('/concurrent-events', (req, res) => syncController.getConcurrentEvents(req, res));

  return router;
};

export default createSyncRoutes;
