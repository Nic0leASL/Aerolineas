/**
 * TSPController.js
 * Controlador REST para servicio TSP
 */

class TSPController {
  constructor(tspService) {
    if (!tspService) {
      throw new Error('tspService es requerido');
    }
    this.tspService = tspService;
  }

  /**
   * POST /tsp/solve
   * Resolver TSP para múltiples destinos
   */
  async solveTSP(req, res) {
    try {
      const { destinations, criterion } = req.body;

      // Validación
      if (!Array.isArray(destinations) || destinations.length < 2) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_INPUT',
          error: 'destinations debe ser un array con al menos 2 destinos'
        });
      }

      const criterionValue = criterion || 'cost';

      if (criterionValue !== 'cost' && criterionValue !== 'time') {
        return res.status(400).json({
          success: false,
          code: 'INVALID_CRITERION',
          error: "criterion debe ser 'cost' o 'time'"
        });
      }

      // Resolver
      const result = this.tspService.solveTSP(destinations, criterionValue);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json({
        success: true,
        ...result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error en solveTSP:', error);
      return res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        error: 'Error interno del servidor'
      });
    }
  }

  /**
   * POST /tsp/solve-exact
   * Resolver TSP exacto (fuerza bruta, máximo 8 destinos)
   */
  async solveTSPExact(req, res) {
    try {
      const { destinations, criterion } = req.body;

      // Validación
      if (!Array.isArray(destinations) || destinations.length < 2) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_INPUT',
          error: 'destinations debe ser un array con al menos 2 destinos'
        });
      }

      if (destinations.length > 8) {
        return res.status(400).json({
          success: false,
          code: 'TOO_MANY_DESTINATIONS',
          error: 'Máximo 8 destinos para búsqueda exacta'
        });
      }

      const criterionValue = criterion || 'cost';

      // Resolver
      const result = this.tspService.solveTSPExact(destinations, criterionValue);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json({
        success: true,
        ...result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error en solveTSPExact:', error);
      return res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        error: 'Error interno del servidor'
      });
    }
  }

  /**
   * POST /tsp/compare
   * Comparar TSP por costo vs tiempo
   */
  async compareTSP(req, res) {
    try {
      const { destinations } = req.body;

      // Validación
      if (!Array.isArray(destinations) || destinations.length < 2) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_INPUT',
          error: 'destinations debe ser un array con al menos 2 destinos'
        });
      }

      const result = this.tspService.compareCostVsTime(destinations);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json({
        success: true,
        ...result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error en compareTSP:', error);
      return res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        error: 'Error interno del servidor'
      });
    }
  }

  /**
   * GET /tsp/stats
   * Obtener estadísticas del servicio TSP
   */
  async getStats(req, res) {
    try {
      const stats = this.tspService.getStats();

      return res.status(200).json({
        success: true,
        stats: {
          ...stats,
          description: 'Estadísticas del servicio TSP',
          algorithms: {
            heuristic: 'Nearest Neighbor + 2-Opt (O(n²+))',
            exact: 'Brute Force Permutations (O(n!))'
          }
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
   * POST /tsp/validate-tour
   * Validar que una ruta completa es válida
   */
  async validateTour(req, res) {
    try {
      const { path } = req.body;

      if (!Array.isArray(path) || path.length < 2) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_INPUT',
          error: 'path debe ser un array'
        });
      }

      // Validar que todos los nodos existen
      for (const airport of path) {
        if (!this.tspService.nodes.has(airport)) {
          return res.status(400).json({
            success: false,
            code: 'AIRPORT_NOT_FOUND',
            error: `Aeropuerto '${airport}' no encontrado`
          });
        }
      }

      // Calcular costos
      const costByTime = this.tspService.calculateRouteCost(path, 'time');
      const costByCost = this.tspService.calculateRouteCost(path, 'cost');

      return res.status(200).json({
        success: true,
        path: path.join(' → '),
        validPath: true,
        metrics: {
          totalCost: (costByCost === Infinity ? 'N/A' : costByCost.toFixed(2)),
          totalTime: (costByTime === Infinity ? 'N/A' : costByTime.toFixed(2)),
          totalTimeHours: (costByTime === Infinity ? 'N/A' : (costByTime / 60).toFixed(2)),
          airports: path.length,
          segments: path.length - 1
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error en validateTour:', error);
      return res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        error: 'Error interno del servidor'
      });
    }
  }
}

export default TSPController;
