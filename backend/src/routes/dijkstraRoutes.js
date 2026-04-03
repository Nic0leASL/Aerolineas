/**
 * dijkstraRoutes.js
 * Rutas API para el servicio de Dijkstra
 */

import express from 'express';

export default function dijkstraRoutes(dijkstraController) {
  const router = express.Router();

  /**
   * POST /dijkstra/route
   * Encontrar la ruta más barata entre dos aeropuertos
   */
  router.post('/route', (req, res) => {
    dijkstraController.findCheapestRoute(req, res);
  });

  /**
   * GET /dijkstra/distances/:origin
   * Obtener matriz de distancias desde un origen
   */
  router.get('/distances/:origin', (req, res) => {
    dijkstraController.getDistanceMatrix(req, res);
  });

  /**
   * POST /dijkstra/k-cheapest
   * Encontrar K rutas más baratas
   */
  router.post('/k-cheapest', (req, res) => {
    dijkstraController.findKCheapestRoutes(req, res);
  });

  /**
   * GET /dijkstra/has-route/:origin/:destination
   * Verificar si existe ruta
   */
  router.get('/has-route/:origin/:destination', (req, res) => {
    dijkstraController.checkRoute(req, res);
  });

  /**
   * GET /dijkstra/reachable/:origin
   * Obtener destinos alcanzables
   */
  router.get('/reachable/:origin', (req, res) => {
    dijkstraController.getReachableDestinations(req, res);
  });

  /**
   * GET /dijkstra/stats
   * Obtener estadísticas
   */
  router.get('/stats', (req, res) => {
    dijkstraController.getStats(req, res);
  });

  /**
   * POST /dijkstra/validate
   * Validar múltiples rutas
   */
  router.post('/validate', (req, res) => {
    dijkstraController.validateRoutes(req, res);
  });

  return router;
}
