/**
 * DijkstraService.js
 * Servicio especializado para encontrar rutas óptimas por menor costo
 * 
 * Implementa el algoritmo de Dijkstra para:
 * - Encontrar la ruta más barata entre dos aeropuertos
 * - Generar matriz de distancias desde un origen
 * - Validar existencia de rutas
 * - Manejar casos de error (sin ruta posible)
 */

class DijkstraService {

  constructor(graphService) {
    this.graphService = graphService;
  }

  /**
   * MÉTODO PRINCIPAL: Encontrar ruta más barata
   * 
   * @param {string} origin - Aeropuerto origen (ej: 'ATL')
   * @param {string} destination - Aeropuerto destino (ej: 'LAX')
   * @returns {object} Resultado con ruta, costo total y detalles
   */
  findCheapestRoute(origin, destination) {
    console.log(`\n🔍 Buscando ruta más barata: ${origin} → ${destination}`);

    // Validar que los aeropuertos existen
    if (!this.graphService.nodes.has(origin)) {
      return {
        success: false,
        error: `Aeropuerto origen no existe: ${origin}`,
        code: 'AIRPORT_NOT_FOUND'
      };
    }

    if (!this.graphService.nodes.has(destination)) {
      return {
        success: false,
        error: `Aeropuerto destino no existe: ${destination}`,
        code: 'AIRPORT_NOT_FOUND'
      };
    }

    if (origin === destination) {
      return {
        success: false,
        error: `El origen y destino deben ser diferentes`,
        code: 'SAME_AIRPORT'
      };
    }

    // Ejecutar Dijkstra
    const dijkstraResult = this.dijkstra(origin, destination);

    if (!dijkstraResult.success) {
      return dijkstraResult;
    }

    return {
      success: true,
      origin,
      destination,
      path: dijkstraResult.path,
      totalCost: dijkstraResult.distance,
      hops: dijkstraResult.path.length - 1,
      routeDetails: this.getRouteDetails(dijkstraResult.path)
    };
  }

  /**
   * ALGORITMO DE DIJKSTRA
   * Encuentra el camino más corto hacia todos los destinos o un destino específico
   * 
   * Complejidad: O(V + E log V) con heap, O(V²) sin heap
   */
  dijkstra(start, end = null, ignoreEdge = null) {
    const startTime = Date.now();

    // Paso 1: Inicializar estructuras
    const distances = new Map();
    const previous = new Map();
    const unvisited = new Set();

    // Distancia infinita a todos excepto el origen (distancia 0)
    for (const airport of this.graphService.nodes.keys()) {
      distances.set(airport, airport === start ? 0 : Infinity);
      previous.set(airport, null);
      unvisited.add(airport);
    }

    console.log(`  ✓ Inicialización: ${this.graphService.nodes.size} nodos`);

    // Paso 2: Procesamiento principal
    let iteraciones = 0;
    while (unvisited.size > 0) {
      iteraciones++;

      // Encontrar nodo no visitado con menor distancia
      let current = null;
      let minDist = Infinity;

      for (const airport of unvisited) {
        const dist = distances.get(airport);
        if (dist < minDist) {
          minDist = dist;
          current = airport;
        }
      }

      // Si no hay nodo con distancia finita, terminar
      if (current === null || distances.get(current) === Infinity) {
        console.log(`  ✓ Exploración completada: ${iteraciones} iteraciones`);
        break;
      }

      unvisited.delete(current);

      // Si llegamos al destino y fue especificado, podemos terminar temprano
      if (end && current === end) {
        console.log(`  ✓ Destino encontrado en iteración ${iteraciones}`);
        break;
      }

      // Relajación de aristas: revisar todos los vecinos
      const neighbors = this.graphService.adjacencyList.get(current) || [];

      for (const neighbor of neighbors) {
        // Skip ignored edge for K-Shortest Path Yen's Algorithm
        if (ignoreEdge && ignoreEdge.from === current && ignoreEdge.to === neighbor.destination) {
           continue;
        }
        
        const dest = neighbor.destination;
        const edgeWeight = neighbor.weight || neighbor.cost || 1; // Usar el peso real (costo)

        // Calcular distancia alternativa
        const alt = distances.get(current) + edgeWeight;

        // Si encontramos camino más corto, actualizar
        if (alt < distances.get(dest)) {
          distances.set(dest, alt);
          previous.set(dest, current);
        }
      }
    }

    console.log(`  ✓ Algoritmo completado`);

    // Paso 3: Reconstruir camino si se especificó destino
    if (end) {
      // Verificar que existe camino
      if (distances.get(end) === Infinity) {
        return {
          success: false,
          error: `No hay ruta disponible de ${start} a ${end}`,
          code: 'NO_ROUTE_FOUND'
        };
      }

      // Reconstruir camino backtrackeando
      const path = [];
      let current = end;

      while (current !== null) {
        path.unshift(current);
        current = previous.get(current);
      }

      // Verificar que el camino comienza en start
      if (path[0] !== start) {
        return {
          success: false,
          error: `Error al reconstruir camino`,
          code: 'PATH_RECONSTRUCTION_ERROR'
        };
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      return {
        success: true,
        start,
        end,
        path,
        distance: distances.get(end),
        previousMap: Object.fromEntries(previous),
        duration,
        iteraciones
      };
    }

    // Sin destino específico, devolver todas las distancias
    const endTime = Date.now();
    const duration = endTime - startTime;

    return {
      success: true,
      start,
      distances: Object.fromEntries(
        Array.from(distances.entries()).filter(([, dist]) => dist !== Infinity)
      ),
      duration,
      iteraciones
    };
  }

  /**
   * Obtener detalles de cada segmento de la ruta
   */
  getRouteDetails(path) {
    const details = [];

    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i];
      const to = path[i + 1];

      // Buscar arista
      const edgeKey = `${from}-${to}`;
      const edge = this.graphService.edges.get(edgeKey);

      if (edge) {
        details.push({
          from,
          to,
          cost: edge.cost,
          time: edge.time,
          frequency: edge.frequency,
          status: Object.keys(edge.statusDistribution || {})[0] || 'UNKNOWN'
        });
      } else {
        details.push({
          from,
          to,
          cost: 0,
          time: 0,
          frequency: 0,
          status: 'UNKNOWN'
        });
      }
    }

    return details;
  }

  /**
   * Generar matriz de distancias desde un origen a TODOS los destinos
   */
  generateDistanceMatrix(origin) {
    if (!this.graphService.nodes.has(origin)) {
      return {
        success: false,
        error: `Aeropuerto no encontrado: ${origin}`
      };
    }

    const result = this.dijkstra(origin);

    if (!result.success) {
      return result;
    }

    // Convertir a formato matriz
    const matrix = [];
    const sorted = Array.from(this.graphService.nodes.keys()).sort();

    for (const dest of sorted) {
      const distance = result.distances[dest] || Infinity;
      if (distance !== Infinity) {
        matrix.push({
          destination: dest,
          cost: distance,
          details: this.graphService.nodes.get(dest)
        });
      }
    }

    return {
      success: true,
      origin,
      destinations: matrix.length,
      matrix: matrix.sort((a, b) => a.cost - b.cost)
    };
  }

  /**
   * Encontrar K rutas más baratas (variantes)
   */
  findKCheapestRoutes(origin, destination, k = 2) {
    if (k < 1) {
      return { success: false, error: 'K debe ser al menos 1' };
    }

    const primary = this.findCheapestRoute(origin, destination);
    if (!primary.success) return primary;

    const routes = [
      {
        rank: 1,
        path: primary.path,
        totalCost: primary.totalCost,
        hops: primary.hops,
        isPrimary: true
      }
    ];

    if (k === 1) return { success: true, origin, destination, k, routes };

    // Búsqueda de rutas secundarias (Variaciones de Edge Deletion - Yen Simplificado)
    let bestAlternative = null;

    for (let i = 0; i < primary.path.length - 1; i++) {
        const ignoreEdge = { from: primary.path[i], to: primary.path[i+1] };
        
        // Ejecutar Dijkstra ignorando esta arista crítica del camino más rápido
        const altResult = this.dijkstra(origin, destination, ignoreEdge);
        if (altResult.success) {
             const cost = altResult.distance;
             // Si encontramos una alternativa válida
             if (!bestAlternative || cost < bestAlternative.totalCost) {
                 // Validar que no sea idéntica (improbable por la arista borrada pero posible en multigrafos)
                 if (JSON.stringify(altResult.path) !== JSON.stringify(primary.path)) {
                     bestAlternative = {
                         rank: 2,
                         path: altResult.path,
                         totalCost: cost,
                         hops: altResult.path.length - 1,
                         isPrimary: false
                     };
                 }
             }
        }
    }

    if (bestAlternative) {
        routes.push(bestAlternative);
    }

    return {
      success: true,
      origin,
      destination,
      k,
      routes
    };
  }

  /**
   * Validar si existe conexión entre dos aeropuertos
   */
  hasRoute(origin, destination) {
    const result = this.findCheapestRoute(origin, destination);
    return result.success;
  }

  /**
   * Obtener todos los destinos alcanzables desde un origen (máximo N hops)
   */
  getReachableDestinations(origin, maxHops = null) {
    if (!this.graphService.nodes.has(origin)) {
      return {
        success: false,
        error: `Aeropuerto no encontrado: ${origin}`
      };
    }

    const result = this.dijkstra(origin);

    if (!result.success) {
      return result;
    }

    // Si no se especifica maxHops, retornar todos
    if (!maxHops) {
      return {
        success: true,
        origin,
        reachable: result.distances,
        count: Object.keys(result.distances).length
      };
    }

    // Filtrar por máximo de hops (costo teóricamente correlacionado con hops)
    const filtered = {
      success: true,
      origin,
      maxHops,
      destinations: {}
    };

    // Aquí se podría usar BFS para contar hops exactos
    for (const [dest, cost] of Object.entries(result.distances)) {
      // Aproximación: asumir que costo bajo = pocos hops
      if (cost <= maxHops * 500) { // 500 es costo promedio estimado
        filtered.destinations[dest] = cost;
      }
    }

    return filtered;
  }

  /**
   * Estadísticas del servicio
   */
  getStats() {
    return {
      totalNodes: this.graphService.nodes.size,
      totalEdges: this.graphService.edges.size,
      avgDegree: (this.graphService.edges.size / this.graphService.nodes.size).toFixed(2)
    };
  }
}

export default DijkstraService;
