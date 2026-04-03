/**
 * DijkstraController.js
 * Controlador para exponer el servicio de Dijkstra como API REST
 */

export default class DijkstraController {
  
  constructor(dijkstraService) {
    this.dijkstraService = dijkstraService;
  }

  /**
   * POST /dijkstra/route
   * Encontrar la ruta más barata entre dos aeropuertos
   * 
   * Body:
   * {
   *   "origin": "ATL",
   *   "destination": "LAX"
   * }
   */
  async findCheapestRoute(req, res) {
    try {
      const { origin, destination } = req.body;

      if (!origin || !destination) {
        return res.status(400).json({
          success: false,
          error: 'Debe proporcionar origin y destination',
          example: { origin: 'ATL', destination: 'LAX' }
        });
      }

      const result = this.dijkstraService.findCheapestRoute(origin, destination);

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /dijkstra/distances/:origin
   * Obtener matriz de distancias desde un aeropuerto origen
   */
  async getDistanceMatrix(req, res) {
    try {
      const { origin } = req.params;

      if (!origin) {
        return res.status(400).json({
          success: false,
          error: 'Debe proporcionar origin en la URL'
        });
      }

      const result = this.dijkstraService.generateDistanceMatrix(origin);

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /dijkstra/k-cheapest
   * Encontrar K rutas más baratas (utiliza la mejor ruta por ahora)
   * 
   * Body:
   * {
   *   "origin": "ATL",
   *   "destination": "LAX",
   *   "k": 3
   * }
   */
  async findKCheapestRoutes(req, res) {
    try {
      const { origin, destination, k = 3 } = req.body;

      if (!origin || !destination) {
        return res.status(400).json({
          success: false,
          error: 'Debe proporcionar origin y destination'
        });
      }

      const result = this.dijkstraService.findKCheapestRoutes(origin, destination, k);

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /dijkstra/has-route/:origin/:destination
   * Verificar si existe ruta entre dos aeropuertos
   */
  async checkRoute(req, res) {
    try {
      const { origin, destination } = req.params;

      if (!origin || !destination) {
        return res.status(400).json({
          success: false,
          error: 'Debe proporcionar origin y destination'
        });
      }

      const hasRoute = this.dijkstraService.hasRoute(origin, destination);

      return res.status(200).json({
        success: true,
        data: {
          origin,
          destination,
          hasRoute,
          message: hasRoute 
            ? `Existe ruta de ${origin} a ${destination}`
            : `No hay ruta disponible de ${origin} a ${destination}`
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /dijkstra/reachable/:origin
   * Obtener todos los destinos alcanzables desde un aeropuerto
   * 
   * Query params:
   * - maxHops: número máximo de conexiones
   */
  async getReachableDestinations(req, res) {
    try {
      const { origin } = req.params;
      const { maxHops } = req.query;

      if (!origin) {
        return res.status(400).json({
          success: false,
          error: 'Debe proporcionar origin'
        });
      }

      const result = this.dijkstraService.getReachableDestinations(
        origin,
        maxHops ? parseInt(maxHops) : null
      );

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * GET /dijkstra/stats
   * Obtener estadísticas del grafo
   */
  async getStats(req, res) {
    try {
      const stats = this.dijkstraService.getStats();

      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /dijkstra/validate
   * Validar múltiples rutas en una sola petición
   * 
   * Body:
   * {
   *   "routes": [
   *     { "origin": "ATL", "destination": "LAX" },
   *     { "origin": "DFW", "destination": "SIN" }
   *   ]
   * }
   */
  async validateRoutes(req, res) {
    try {
      const { routes } = req.body;

      if (!Array.isArray(routes)) {
        return res.status(400).json({
          success: false,
          error: 'Debe proporcionar un array de routes'
        });
      }

      const results = routes.map(({ origin, destination }) => {
        return this.dijkstraService.findCheapestRoute(origin, destination);
      });

      return res.status(200).json({
        success: true,
        data: {
          total: routes.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
          results
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}
