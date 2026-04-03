/**
 * tspRoutes.js
 * Rutas API para el servicio TSP
 */

import express from 'express';

export default function tspRoutes(tspController) {
  const router = express.Router();

  /**
   * POST /tsp/solve
   * Resolver TSP con heurística (Nearest Neighbor + 2-Opt)
   */
  router.post('/solve', (req, res) => {
    tspController.solveTSP(req, res);
  });

  /**
   * POST /tsp/solve-exact
   * Resolver TSP exacto (máximo 8 destinos)
   */
  router.post('/solve-exact', (req, res) => {
    tspController.solveTSPExact(req, res);
  });

  /**
   * POST /tsp/compare
   * Comparar TSP por costo vs tiempo
   */
  router.post('/compare', (req, res) => {
    tspController.compareTSP(req, res);
  });

  /**
   * GET /tsp/stats
   * Obtener estadísticas del servicio
   */
  router.get('/stats', (req, res) => {
    tspController.getStats(req, res);
  });

  /**
   * POST /tsp/validate-tour
   * Validar una ruta y calcular costos
   */
  router.post('/validate-tour', (req, res) => {
    tspController.validateTour(req, res);
  });

  return router;
}
