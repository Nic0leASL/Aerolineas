/**
 * Rutas de Conflictos
 * Endpoints para consultar y gestionar conflictos detectados
 */

import express from 'express';

export const createConflictRoutes = (conflictController) => {
  const router = express.Router();

  /**
   * GET /conflictos/historial
   * Obtener historial de conflictos detectados
   * Query: limit (opcional, default 50)
   */
  router.get('/historial', (req, res) => conflictController.getConflictHistory(req, res));

  /**
   * GET /conflictos/stats
   * Obtener estadísticas de conflictos
   */
  router.get('/stats', (req, res) => conflictController.getConflictStats(req, res));

  /**
   * GET /conflictos/resumen
   * Obtener resumen de conflictos por asiento y razón
   */
  router.get('/resumen', (req, res) => conflictController.getConflictSummary(req, res));

  /**
   * GET /conflictos/asiento/:flightId/:seatNumber
   * Obtener conflictos de un asiento específico
   * Params: flightId, seatNumber
   */
  router.get('/asiento/:flightId/:seatNumber', (req, res) => 
    conflictController.getConflictsForSeat(req, res));

  /**
   * POST /conflictos/cleanup
   * Limpiar histórico de conflictos antiguos
   * Body: { maxAgeSeconds: 3600 } (opcional)
   */
  router.post('/cleanup', (req, res) => conflictController.cleanupOldConflicts(req, res));

  return router;
};

export default createConflictRoutes;
