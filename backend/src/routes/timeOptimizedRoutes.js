/**
 * timeOptimizedRoutes.js
 * Rutas API para el servicio de rutas optimizadas por tiempo
 */

import express from 'express';

export default function timeOptimizedRoutes(timeOptimizedController) {
  const router = express.Router();

  /**
   * POST /time-optimized/route
   * Encontrar la ruta más rápida entre dos aeropuertos
   */
  router.post('/route', (req, res) => {
    timeOptimizedController.findFastestRoute(req, res);
  });

  /**
   * GET /time-optimized/time-matrix/:origin
   * Obtener matriz de tiempos desde un origen
   */
  router.get('/time-matrix/:origin', (req, res) => {
    timeOptimizedController.getTimeMatrix(req, res);
  });

  /**
   * POST /time-optimized/k-fastest
   * Encontrar K rutas más rápidas
   */
  router.post('/k-fastest', (req, res) => {
    timeOptimizedController.findKFastestRoutes(req, res);
  });

  /**
   * GET /time-optimized/has-route/:origin/:destination
   * Verificar si existe ruta
   */
  router.get('/has-route/:origin/:destination', (req, res) => {
    timeOptimizedController.checkRoute(req, res);
  });

  /**
   * GET /time-optimized/reachable/:origin
   * Obtener destinos alcanzables
   */
  router.get('/reachable/:origin', (req, res) => {
    timeOptimizedController.getReachableDestinations(req, res);
  });

  /**
   * POST /time-optimized/compare
   * Comparar ruta por costo vs ruta por tiempo
   */
  router.post('/compare', (req, res) => {
    timeOptimizedController.compareRoutes(req, res);
  });

  /**
   * GET /time-optimized/stats
   * Obtener estadísticas
   */
  router.get('/stats', (req, res) => {
    timeOptimizedController.getStats(req, res);
  });

  /**
   * POST /time-optimized/validate
   * Validar múltiples rutas
   */
  router.post('/validate', (req, res) => {
    timeOptimizedController.validateRoutes(req, res);
  });

  return router;
}
