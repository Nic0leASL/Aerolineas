/**
 * Rutas de salud y estado del sistema
 */

import express from 'express';

export const createHealthRoutes = (nodeId, reservationService) => {
  const router = express.Router();

  /**
   * GET /health - Verificar si el nodo está activo
   */
  router.get('/', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      nodeId: nodeId,
      timestamp: new Date()
    });
  });

  /**
   * GET /stats - Obtener estadísticas del nodo
   */
  router.get('/stats', (req, res) => {
    const stats = reservationService.getStats();
    res.status(200).json(stats);
  });

  /**
   * GET /info - Información general del nodo
   */
  router.get('/info', (req, res) => {
    res.status(200).json({
      nodeId: nodeId,
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime()
    });
  });

  return router;
};

export default createHealthRoutes;
