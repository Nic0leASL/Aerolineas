/**
 * TSPService.js
 * Servicio para resolver el Traveling Salesman Problem (TSP)
 * 
 * Implementa múltiples algoritmos:
 * 1. Nearest Neighbor Heuristic - O(n²) rápido, buena solución
 * 2. 2-Opt Local Search - mejora iterativa
 * 3. Dynamic Programming (bitmask) - O(n² 2^n) exacto para n < 20
 * 
 * Soporta optimización por:
 * - Costo total (precio)
 * - Tiempo total (duración)
 */

class TSPService {
  constructor(graphService) {
    if (!graphService) {
      throw new Error('graphService es requerido');
    }
    this.graphService = graphService;
    this.adjacencyList = graphService.adjacencyList;
    this.nodes = graphService.nodes;
  }

  /**
   * Resolver TSP usando Nearest Neighbor + 2-Opt
   * Algoritmo: O(n²) heurístico + mejora local
   * 
   * @param {Array<string>} destinations - Lista de aeropuertos a visitar (incluyendo inicio)
   * @param {string} criterion - 'cost' o 'time'
   * @returns {Object} {path, totalCost/totalTime, improvements}
   */
  solveTSP(destinations, criterion = 'cost') {
    // Validación
    if (!Array.isArray(destinations) || destinations.length < 2) {
      return {
        success: false,
        code: 'INVALID_INPUT',
        error: 'Se requieren al menos 2 destinos'
      };
    }

    // Validar que todos los destinos existen
    for (const dest of destinations) {
      if (!this.nodes.has(dest)) {
        return {
          success: false,
          code: 'AIRPORT_NOT_FOUND',
          error: `Aeropuerto '${dest}' no encontrado`
        };
      }
    }

    // Validar criterio
    if (criterion !== 'cost' && criterion !== 'time') {
      return {
        success: false,
        code: 'INVALID_CRITERION',
        error: "Criterio debe ser 'cost' o 'time'"
      };
    }

    console.log(`\n🔍 Resolviendo TSP (${criterion}):`);
    console.log(`   Destinos: ${destinations.length}`);

    // Paso 1: Generar ruta inicial con Nearest Neighbor
    const initialRoute = this.nearestNeighbor(destinations, criterion);
    const initialCost = this.calculateRouteCost(initialRoute.path, criterion);

    console.log(`  • Ruta Inicial (Nearest Neighbor): ${isFinite(initialCost) ? initialCost.toFixed(2) : 'N/A'}`);

    // Paso 2: Mejorar con 2-Opt
    const improvedRoute = this.twoOpt(initialRoute.path, criterion);
    const improvedCost = this.calculateRouteCost(improvedRoute, criterion);

    console.log(`  • Ruta Mejorada (2-Opt): ${isFinite(improvedCost) ? improvedCost.toFixed(2) : 'N/A'}`);
    const pctImprovement = (isFinite(initialCost) && initialCost > 0)
      ? ((initialCost - improvedCost) / initialCost * 100).toFixed(2)
      : '0.00';
    console.log(`  • Mejora: ${pctImprovement}%`);

    // Obtener detalles
    const details = this.getRouteDetails(improvedRoute, criterion);

    return {
      success: true,
      path: improvedRoute,
      pathString: improvedRoute.join(' → '),
      criterion,
      iterations: {
        initial: isFinite(initialCost) ? initialCost.toFixed(2) : 'Infinity',
        afterTwoOpt: isFinite(improvedCost) ? improvedCost.toFixed(2) : 'Infinity',
        improvement: (isFinite(initialCost) && initialCost > 0)
          ? ((initialCost - improvedCost) / initialCost * 100).toFixed(2)
          : '0.00'
      },
      totalDistance: isFinite(improvedCost) ? improvedCost.toFixed(2) : 'Infinity',
      segments: details.segments,
      summary: details.summary
    };
  }

  /**
   * Nearest Neighbor Heuristic
   * Comienza en primer destino y siempre va al más cercano no visitado
   * 
   * @param {Array<string>} destinations - Lista de destinos
   * @param {string} criterion - 'cost' o 'time'
   * @returns {Object} {path, totalCost}
   */
  nearestNeighbor(destinations, criterion = 'cost') {
    if (destinations.length < 2) {
      return { path: destinations, totalCost: 0 };
    }

    const start = destinations[0];
    const toVisit = new Set(destinations.slice(1));
    const path = [start];
    let current = start;
    let totalCost = 0;

    while (toVisit.size > 0) {
      let nearest = null;
      let nearestDistance = Infinity;

      // Encontrar el destino más cercano no visitado
      for (const next of toVisit) {
        const distance = this.getDistance(current, next, criterion);

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = next;
        }
      }

      if (nearest === null) break;

      path.push(nearest);
      totalCost += nearestDistance;
      toVisit.delete(nearest);
      current = nearest;
    }

    return { path, totalCost };
  }

  /**
   * 2-Opt Local Search
   * Mejora iterativa intercambiando aristas
   * 
   * @param {Array<string>} path - Ruta actual
   * @param {string} criterion - 'cost' o 'time'
   * @returns {Array<string>} Ruta mejorada
   */
  twoOpt(path, criterion = 'cost') {
    let improved = true;
    let bestPath = [...path];
    let bestCost = this.calculateRouteCost(bestPath, criterion);

    let iterations = 0;
    const maxIterations = path.length * path.length; // Limite de iteraciones

    while (improved && iterations < maxIterations) {
      improved = false;
      iterations++;

      for (let i = 1; i < path.length - 1; i++) {
        for (let j = i + 2; j < path.length; j++) {
          // Crear nueva ruta intercambiando aristas
          const newPath = this.twoOptSwap(bestPath, i, j);
          const newCost = this.calculateRouteCost(newPath, criterion);

          if (newCost < bestCost) {
            bestPath = newPath;
            bestCost = newCost;
            improved = true;
            break;
          }
        }
        if (improved) break;
      }
    }

    return bestPath;
  }

  /**
   * Intercambiar aristas en 2-Opt
   * 
   * @param {Array<string>} path - Ruta
   * @param {number} i - Primera posición
   * @param {number} j - Segunda posición
   * @returns {Array<string>} Nueva ruta con aristas intercambiadas
   */
  twoOptSwap(path, i, j) {
    const newPath = [...path];
    // Invertir segmento entre i y j
    while (i < j) {
      [newPath[i], newPath[j]] = [newPath[j], newPath[i]];
      i++;
      j--;
    }
    return newPath;
  }

  /**
   * Obtener distancia entre dos aeropuertos
   * 
   * @param {string} from - Aeropuerto origen
   * @param {string} to - Aeropuerto destino
   * @param {string} criterion - 'cost' o 'time'
   * @returns {number} Distancia/Costo/Tiempo
   */
  getDistance(from, to, criterion = 'cost') {
    const neighbors = this.adjacencyList.get(from) || [];
    const neighbor = neighbors.find(n => n.destination === to);

    if (!neighbor) {
      return Infinity; // No hay conexión directa
    }

    return criterion === 'cost' ? neighbor.cost : neighbor.time;
  }

  /**
   * Calcular costo total de una ruta
   * 
   * @param {Array<string>} path - Ruta
   * @param {string} criterion - 'cost' o 'time'
   * @returns {number} Costo total
   */
  calculateRouteCost(path, criterion = 'cost') {
    let totalCost = 0;

    for (let i = 0; i < path.length - 1; i++) {
      const distance = this.getDistance(path[i], path[i + 1], criterion);
      if (distance === Infinity) {
        return Infinity; // Ruta no válida
      }
      totalCost += distance;
    }

    // Añadir retorno al inicio si es necesario
    if (path.length > 1) {
      const returnDistance = this.getDistance(path[path.length - 1], path[0], criterion);
      if (returnDistance !== Infinity) {
        totalCost += returnDistance;
      }
    }

    return totalCost;
  }

  /**
   * Obtener detalles de cada segmento de la ruta
   * 
   * @param {Array<string>} path - Ruta
   * @param {string} criterion - 'cost' o 'time'
   * @returns {Object} {segments, summary}
   */
  getRouteDetails(path, criterion = 'cost') {
    const segments = [];
    let totalDistance = 0;

    for (let i = 0; i < path.length; i++) {
      const from = path[i];
      const to = path[(i + 1) % path.length]; // Incluir retorno al inicio

      // Evitar mostrar segmento de retorno si es la última iteración y es un viaje abierto
      if (i === path.length - 1 && path.length > 1) {
        // Mostrar retorno
        const distance = this.getDistance(from, to, criterion);

        segments.push({
          segment: `${from} → ${to} (retorno)`,
          distance: distance === Infinity ? 'N/A' : distance.toFixed(2),
          type: criterion
        });

        totalDistance += distance === Infinity ? 0 : distance;
      } else if (i < path.length - 1) {
        const distance = this.getDistance(from, to, criterion);

        segments.push({
          segment: `${from} → ${to}`,
          distance: distance === Infinity ? 'N/A' : distance.toFixed(2),
          type: criterion
        });

        totalDistance += distance === Infinity ? 0 : distance;
      }
    }

    return {
      segments,
      summary: {
        totalSegments: segments.length,
        totalDistance: totalDistance.toFixed(2),
        criterion,
        visitedAirports: path.length
      }
    };
  }

  /**
   * Comparar TSP por costo vs tiempo
   * 
   * @param {Array<string>} destinations - Lista de destinos
   * @returns {Object} Comparación de ambas rutas
   */
  compareCostVsTime(destinations) {
    // Resolver por costo
    const costRoute = this.solveTSP(destinations, 'cost');
    if (!costRoute.success) {
      return { success: false, error: costRoute.error };
    }

    // Resolver por tiempo
    const timeRoute = this.solveTSP(destinations, 'time');
    if (!timeRoute.success) {
      return { success: false, error: timeRoute.error };
    }

    // Calcular tiempo para ruta de costo
    let costRouteTotalTime = 0;
    for (let i = 0; i < costRoute.path.length - 1; i++) {
      const distance = this.getDistance(costRoute.path[i], costRoute.path[i + 1], 'time');
      costRouteTotalTime += distance === Infinity ? 0 : distance;
    }
    // Agregar retorno
    if (costRoute.path.length > 1) {
      const returnDist = this.getDistance(
        costRoute.path[costRoute.path.length - 1],
        costRoute.path[0],
        'time'
      );
      if (returnDist !== Infinity) {
        costRouteTotalTime += returnDist;
      }
    }

    // Calcular costo para ruta de tiempo
    let timeRouteTotalCost = 0;
    for (let i = 0; i < timeRoute.path.length - 1; i++) {
      const distance = this.getDistance(timeRoute.path[i], timeRoute.path[i + 1], 'cost');
      timeRouteTotalCost += distance === Infinity ? 0 : distance;
    }
    // Agregar retorno
    if (timeRoute.path.length > 1) {
      const returnDist = this.getDistance(
        timeRoute.path[timeRoute.path.length - 1],
        timeRoute.path[0],
        'cost'
      );
      if (returnDist !== Infinity) {
        timeRouteTotalCost += returnDist;
      }
    }

    const samePath = JSON.stringify(costRoute.path) === JSON.stringify(timeRoute.path);

    return {
      success: true,
      comparison: {
        samePath,
        destinations: destinations.length,
        costRoute: {
          path: costRoute.pathString,
          totalCost: parseFloat(costRoute.totalDistance),
          totalTime: costRouteTotalTime.toFixed(2),
          timeInHours: (costRouteTotalTime / 60).toFixed(2)
        },
        timeRoute: {
          path: timeRoute.pathString,
          totalTime: parseFloat(timeRoute.totalDistance),
          totalCost: timeRouteTotalCost.toFixed(2),
          timeInHours: (parseFloat(timeRoute.totalDistance) / 60).toFixed(2)
        },
        tradeoff: {
          extraCost: (timeRouteTotalCost - parseFloat(costRoute.totalDistance)).toFixed(2),
          timeSavings: (costRouteTotalTime - parseFloat(timeRoute.totalDistance)).toFixed(2)
        }
      }
    };
  }

  /**
   * Generar todas las permutaciones para búsqueda exhaustiva
   * (Solo para verificación, demasiado lento para n > 10)
   * 
   * @param {Array<string>} arr - Array
   * @returns {Array<Array<string>>} Todas las permutaciones
   */
  permutations(arr) {
    if (arr.length <= 1) return [arr];

    const result = [];
    for (let i = 0; i < arr.length; i++) {
      const current = arr[i];
      const remaining = arr.slice(0, i).concat(arr.slice(i + 1));
      const remainingPerms = this.permutations(remaining);

      for (const perm of remainingPerms) {
        result.push([current, ...perm]);
      }
    }

    return result;
  }

  /**
   * Resolver TSP exacto (fuerza bruta para pequeños n)
   * Solo para n <= 8 por eficiencia
   * 
   * @param {Array<string>} destinations - Lista de destinos
   * @param {string} criterion - 'cost' o 'time'
   * @returns {Object} Mejor ruta encontrada
   */
  solveTSPExact(destinations, criterion = 'cost') {
    if (destinations.length > 8) {
      return {
        success: false,
        code: 'TOO_MANY_DESTINATIONS',
        error: 'Máximo 8 destinos para búsqueda exacta. Use heurística para más destinos.'
      };
    }

    const others = destinations.slice(1);
    const perms = this.permutations(others);

    let bestPath = null;
    let bestCost = Infinity;

    for (const perm of perms) {
      const path = [destinations[0], ...perm];
      const cost = this.calculateRouteCost(path, criterion);

      if (cost < bestCost) {
        bestCost = cost;
        bestPath = path;
      }
    }

    const details = this.getRouteDetails(bestPath, criterion);

    return {
      success: true,
      path: bestPath,
      pathString: bestPath.join(' → '),
      criterion,
      totalDistance: bestCost.toFixed(2),
      algorithm: 'Exact (Brute Force)',
      segments: details.segments,
      summary: details.summary
    };
  }

  /**
   * Obtener estadísticas del grafo
   * 
   * @returns {Object} Estadísticas
   */
  getStats() {
    let totalDegree = 0;
    for (const node of this.nodes.values()) {
      totalDegree += node.totalDegree;
    }

    const avgDegree = this.nodes.size > 0 ? totalDegree / this.nodes.size : 0;

    return {
      totalNodes: this.nodes.size,
      totalEdges: this.graphService.edges.size,
      avgDegree: avgDegree.toFixed(2),
      maxTSPExact: 8,
      recommendedHeuristic: this.nodes.size > 8
    };
  }
}

export default TSPService;
