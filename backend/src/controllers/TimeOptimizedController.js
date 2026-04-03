/**
 * TimeOptimizedController.js
 * Controlador REST para servicio de Dijkstra optimizado por tiempo
 */

class TimeOptimizedController {
  constructor(timeOptimizedService) {
    if (!timeOptimizedService) {
      throw new Error('timeOptimizedService es requerido');
    }
    this.timeOptimizedService = timeOptimizedService;
  }

  /**
   * POST /time-optimized/route
   * Encontrar la ruta más rápida entre dos aeropuertos
   */
  async findFastestRoute(req, res) {
    try {
      const { origin, destination } = req.body;

      // Validación
      if (!origin || !destination) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_PARAMS',
          error: 'origin y destination son requeridos'
        });
      }

      // Buscar ruta
      const result = this.timeOptimizedService.findFastestRoute(origin, destination);

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(200).json({
        success: true,
        path: result.path.join(' → '),
        pathArray: result.path,
        totalTime: Math.round(result.totalTime * 100) / 100,
        totalTimeHours: parseFloat(result.timeInHours),
        totalTimeFormatted: result.timeInDaysHours,
        hops: result.hops,
        routeDetails: result.routeDetails,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error en findFastestRoute:', error);
      return res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        error: 'Error interno del servidor'
      });
    }
  }

  /**
   * GET /time-optimized/time-matrix/:origin
   * Obtener matriz de tiempos desde un origen
   */
  async getTimeMatrix(req, res) {
    try {
      const { origin } = req.params;

      if (!origin) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_PARAMS',
          error: 'origin es requerido'
        });
      }

      const result = this.timeOptimizedService.generateTimeMatrix(origin);

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(200).json({
        success: true,
        origin: result.origin,
        destinations: result.destinations,
        matrix: result.matrix.slice(0, 10), // Top 10
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error en getTimeMatrix:', error);
      return res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        error: 'Error interno del servidor'
      });
    }
  }

  /**
   * POST /time-optimized/k-fastest
   * Encontrar K rutas más rápidas
   */
  async findKFastestRoutes(req, res) {
    try {
      const { origin, destination, k } = req.body;

      // Validación
      if (!origin || !destination) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_PARAMS',
          error: 'origin y destination son requeridos'
        });
      }

      const kValue = k || 1;

      const result = this.timeOptimizedService.findKFastestRoutes(origin, destination, kValue);

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(200).json({
        success: true,
        k: result.k,
        routes: result.routes.map(r => ({
          path: r.path.join(' → '),
          totalTime: Math.round(r.totalTime * 100) / 100,
          totalTimeHours: parseFloat(r.timeInHours),
          hops: r.hops
        })),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error en findKFastestRoutes:', error);
      return res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        error: 'Error interno del servidor'
      });
    }
  }

  /**
   * GET /time-optimized/has-route/:origin/:destination
   * Verificar si existe ruta
   */
  async checkRoute(req, res) {
    try {
      const { origin, destination } = req.params;

      if (!origin || !destination) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_PARAMS',
          error: 'origin y destination son requeridos'
        });
      }

      const hasRoute = this.timeOptimizedService.hasRoute(origin, destination);

      return res.status(200).json({
        success: true,
        origin,
        destination,
        hasRoute,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error en checkRoute:', error);
      return res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        error: 'Error interno del servidor'
      });
    }
  }

  /**
   * GET /time-optimized/reachable/:origin
   * Obtener destinos alcanzables
   */
  async getReachableDestinations(req, res) {
    try {
      const { origin } = req.params;
      const { maxHops } = req.query;

      if (!origin) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_PARAMS',
          error: 'origin es requerido'
        });
      }

      const maxHopsValue = maxHops ? parseInt(maxHops) : 10;

      const result = this.timeOptimizedService.getReachableDestinations(origin, maxHopsValue);

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(200).json({
        success: true,
        origin: result.origin,
        count: result.count,
        maxHops: maxHopsValue,
        reachable: result.reachable,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error en getReachableDestinations:', error);
      return res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        error: 'Error interno del servidor'
      });
    }
  }

  /**
   * POST /time-optimized/compare
   * Comparar ruta por costo vs ruta por tiempo
   */
  async compareRoutes(req, res) {
    try {
      const { origin, destination } = req.body;

      // Validación
      if (!origin || !destination) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_PARAMS',
          error: 'origin y destination son requeridos'
        });
      }

      const result = this.timeOptimizedService.compareCostVsTime(origin, destination);

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(200).json({
        success: true,
        ...result.comparison,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error en compareRoutes:', error);
      return res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        error: 'Error interno del servidor'
      });
    }
  }

  /**
   * GET /time-optimized/stats
   * Obtener estadísticas del grafo
   */
  async getStats(req, res) {
    try {
      const stats = this.timeOptimizedService.getStats();

      return res.status(200).json({
        success: true,
        stats: {
          ...stats,
          description: 'Estadísticas del grafo de rutas aéreas'
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error en getStats:', error);
      return res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        error: 'Error interno del servidor'
      });
    }
  }

  /**
   * POST /time-optimized/validate
   * Validar múltiples rutas
   */
  async validateRoutes(req, res) {
    try {
      const { routes } = req.body;

      if (!Array.isArray(routes)) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_PARAMS',
          error: 'routes debe ser un array'
        });
      }

      const results = [];

      for (const route of routes) {
        const { origin, destination } = route;

        if (!origin || !destination) {
          results.push({
            route: `${origin || 'N/A'}→${destination || 'N/A'}`,
            exists: false,
            error: 'Parámetros faltantes'
          });
          continue;
        }

        const hasRoute = this.timeOptimizedService.hasRoute(origin, destination);

        results.push({
          route: `${origin}→${destination}`,
          exists: hasRoute
        });
      }

      return res.status(200).json({
        success: true,
        totalRoutes: routes.length,
        validRoutes: results.filter(r => r.exists).length,
        results,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error en validateRoutes:', error);
      return res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        error: 'Error interno del servidor'
      });
    }
  }
}

export default TimeOptimizedController;
