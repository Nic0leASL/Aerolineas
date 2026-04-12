/**
 * TimeOptimizedService.js
 * Servicio de Dijkstra optimizado por tiempo de vuelo
 * 
 * Encuentra la ruta más rápida entre dos aeropuertos
 * usando tiempos de vuelo como pesos en el algoritmo.
 * 
 * Objetivo: Minimizar tiempo total vs costo total
 */

class TimeOptimizedService {
  constructor(graphService) {
    if (!graphService) {
      throw new Error('graphService es requerido');
    }
    this.graphService = graphService;
  }

  /**
   * Algoritmo de Dijkstra usando TIEMPO como peso
   * Complejidad: O(V²)
   * 
   * @param {string} start - Código del aeropuerto de inicio
   * @param {string} end - Código del aeropuerto de destino (null para todos)
   * @returns {Object} {distances, previous, path}
   */
  dijkstra(start, end, ignoreEdge = null) {
    const adjacencyList = this.graphService.adjacencyList;
    const nodes = this.graphService.nodes;

    // Validar que el aeropuerto de inicio existe
    if (!nodes.has(start)) {
      return null;
    }

    // Si end es proporcionado, validar que existe
    if (end && !nodes.has(end)) {
      return null;
    }

    // Inicialización
    const distances = new Map();
    const previous = new Map();
    const unvisited = new Set();

    for (const node of nodes.keys()) {
      distances.set(node, Infinity);
      previous.set(node, null);
      unvisited.add(node);
    }

    distances.set(start, 0);

    console.log(`  ✓ Inicialización: ${nodes.size} nodos`);

    // Algoritmo principal
    let iterationCount = 0;
    while (unvisited.size > 0) {
      // Encontrar nodo no visitado con menor distancia
      let minDistance = Infinity;
      let current = null;

      for (const node of unvisited) {
        if (distances.get(node) < minDistance) {
          minDistance = distances.get(node);
          current = node;
        }
      }

      if (current === null || distances.get(current) === Infinity) {
        break; // No hay más nodos alcanzables
      }

      // Si hay destino especifico y lo encontramos, terminar
      if (end && current === end) {
        console.log(`  ✓ Destino encontrado en iteración ${iterationCount}`);
        break;
      }

      unvisited.delete(current);

      // Relajación de aristas (usando TIME como peso)
      const neighbors = adjacencyList.get(current) || [];
      for (const neighbor of neighbors) {
        if (ignoreEdge && ignoreEdge.from === current && ignoreEdge.to === neighbor.destination) {
           continue;
        }
        
        if (unvisited.has(neighbor.destination)) {
          // Usar TIME como peso, no cost
          const newDistance = distances.get(current) + neighbor.time;

          if (newDistance < distances.get(neighbor.destination)) {
            distances.set(neighbor.destination, newDistance);
            previous.set(neighbor.destination, current);
          }
        }
      }

      iterationCount++;
    }

    console.log(`  ✓ Algoritmo completado`);

    return { distances, previous };
  }

  /**
   * Encontrar la ruta más rápida entre dos aeropuertos
   * 
   * @param {string} origin - Código del aeropuerto de origen
   * @param {string} destination - Código del aeropuerto de destino
   * @returns {Object} {success, path, totalTime, hops, code}
   */
  findFastestRoute(origin, destination) {
    const nodes = this.graphService.nodes;

    // Validación 1: Aeropuerto de origen existe
    if (!nodes.has(origin)) {
      return {
        success: false,
        code: 'AIRPORT_NOT_FOUND',
        error: `Aeropuerto de origen '${origin}' no encontrado`,
        origin
      };
    }

    // Validación 2: Aeropuerto de destino existe
    if (!nodes.has(destination)) {
      return {
        success: false,
        code: 'AIRPORT_NOT_FOUND',
        error: `Aeropuerto de destino '${destination}' no encontrado`,
        destination
      };
    }

    // Validación 3: No es el mismo aeropuerto
    if (origin === destination) {
      return {
        success: false,
        code: 'SAME_AIRPORT',
        error: 'El origen y destino no pueden ser iguales',
        origin,
        destination
      };
    }

    // Ejecutar Dijkstra
    const result = this.dijkstra(origin, destination);

    if (!result) {
      return {
        success: false,
        code: 'INVALID_PARAMS',
        error: 'Parámetros inválidos'
      };
    }

    const { distances, previous } = result;
    const totalTime = distances.get(destination);

    // Validación 4: Existe ruta disponible
    if (totalTime === Infinity) {
      return {
        success: false,
        code: 'NO_ROUTE_FOUND',
        error: `No existe ruta disponible entre ${origin} y ${destination}`,
        origin,
        destination
      };
    }

    // Reconstruir ruta
    const path = [];
    let current = destination;

    while (current !== null) {
      path.unshift(current);
      current = previous.get(current);
    }

    // Calcular hops (número de vuelos)
    const hops = path.length - 1;

    // Obtener detalles por segmento
    const routeDetails = this.getRouteDetails(path);

    return {
      success: true,
      path,
      totalTime,           // Minutos
      hops,
      routeDetails,
      timeInHours: (totalTime / 60).toFixed(2),
      timeInDaysHours: this.formatTime(totalTime)
    };
  }

  /**
   * Obtener detalles de cada segmento de la ruta
   * 
   * @param {Array<string>} path - Ruta de aeropuertos
   * @returns {Array} Detalles de cada segmento
   */
  getRouteDetails(path) {
    const details = [];
    const adjacencyList = this.graphService.adjacencyList;

    for (let i = 0; i < path.length - 1; i++) {
      const origin = path[i];
      const destination = path[i + 1];
      const neighbors = adjacencyList.get(origin) || [];
      const neighbor = neighbors.find(n => n.destination === destination);

      if (neighbor) {
        details.push({
          segment: `${origin} → ${destination}`,
          time: neighbor.time,
          cost: neighbor.cost,
          frequency: neighbor.frequency,
          timeInHours: (neighbor.time / 60).toFixed(2)
        });
      }
    }

    return details;
  }

  /**
   * Generar matriz de tiempos desde un origen
   * 
   * @param {string} origin - Código del aeropuerto
   * @returns {Object} {success, matrix, destinations}
   */
  generateTimeMatrix(origin) {
    const nodes = this.graphService.nodes;

    // Validar que el aeropuerto existe
    if (!nodes.has(origin)) {
      return {
        success: false,
        code: 'AIRPORT_NOT_FOUND',
        error: `Aeropuerto '${origin}' no encontrado`
      };
    }

    // Ejecutar Dijkstra desde el origen a todos los destinos
    const result = this.dijkstra(origin, null);

    if (!result) {
      return {
        success: false,
        code: 'INTERNAL_ERROR',
        error: 'Error calculando matriz de tiempos'
      };
    }

    const { distances } = result;
    const matrix = [];

    // Crear matriz ordenada por tiempo
    for (const [destination, time] of distances.entries()) {
      if (time !== Infinity) {
        matrix.push({
          destination,
          time: time === 0 ? 0 : Math.round(time * 100) / 100,
          timeInHours: time === 0 ? '0h' : (time / 60).toFixed(2),
          timeFormat: this.formatTime(time)
        });
      }
    }

    // Ordenar por tiempo
    matrix.sort((a, b) => a.time - b.time);

    return {
      success: true,
      origin,
      destinations: matrix.length,
      matrix
    };
  }

  /**
   * Encontrar K rutas más rápidas (simplificado a 1 por ahora)
   * 
   * @param {string} origin - Aeropuerto de origen
   * @param {string} destination - Aeropuerto de destino
   * @param {number} k - Número de rutas a retornar
   * @returns {Object} {success, routes}
   */
  findKFastestRoutes(origin, destination, k = 2) {
    const fastest = this.findFastestRoute(origin, destination);
    if (!fastest.success) return { success: false, code: fastest.code, error: fastest.error };

    const routes = [
      {
        rank: 1,
        path: fastest.path,
        totalTime: fastest.totalTime,
        hops: fastest.hops,
        isPrimary: true
      }
    ];

    if (k === 1) return { success: true, k, routes };

    let bestAlternative = null;
    for (let i = 0; i < fastest.path.length - 1; i++) {
        const ignoreEdge = { from: fastest.path[i], to: fastest.path[i+1] };
        
        const altResult = this.dijkstra(origin, destination, ignoreEdge);
        if (altResult && altResult.distances.get(destination) !== Infinity) {
             const time = altResult.distances.get(destination);
             if (!bestAlternative || time < bestAlternative.totalTime) {
                 const altPath = [];
                 let current = destination;
                 while (current !== null) {
                   altPath.unshift(current);
                   current = altResult.previous.get(current);
                 }
                 
                 if (JSON.stringify(altPath) !== JSON.stringify(fastest.path)) {
                     bestAlternative = {
                         rank: 2,
                         path: altPath,
                         totalTime: time,
                         hops: altPath.length - 1,
                         isPrimary: false
                     };
                 }
             }
        }
    }

    if (bestAlternative) {
        routes.push(bestAlternative);
    }

    return { success: true, k, routes };
  }

  /**
   * Verificar si existe ruta entre dos aeropuertos
   * 
   * @param {string} origin - Aeropuerto de origen
   * @param {string} destination - Aeropuerto de destino
   * @returns {boolean}
   */
  hasRoute(origin, destination) {
    const route = this.findFastestRoute(origin, destination);
    return route.success;
  }

  /**
   * Obtener destinos alcanzables desde un origen
   * 
   * @param {string} origin - Aeropuerto de origen
   * @param {number} maxHops - Máximo número de hops
   * @returns {Object} {success, reachable}
   */
  getReachableDestinations(origin, maxHops = 10) {
    const nodes = this.graphService.nodes;

    if (!nodes.has(origin)) {
      return {
        success: false,
        code: 'AIRPORT_NOT_FOUND',
        error: `Aeropuerto '${origin}' no encontrado`
      };
    }

    const result = this.dijkstra(origin, null);

    if (!result) {
      return {
        success: false,
        code: 'INTERNAL_ERROR',
        error: 'Error procesando destinos alcanzables'
      };
    }

    const { distances } = result;
    const reachable = {};

    for (const [destination, time] of distances.entries()) {
      if (destination !== origin && time !== Infinity && time <= maxHops * 1000) {
        reachable[destination] = time;
      }
    }

    return {
      success: true,
      origin,
      count: Object.keys(reachable).length,
      reachable
    };
  }

  /**
   * Comparar ruta por costo vs ruta por tiempo
   * 
   * @param {string} origin - Aeropuerto de origen
   * @param {string} destination - Aeropuerto de destino
   * @returns {Object} Comparación de ambas rutas
   */
  compareCostVsTime(origin, destination) {
    const nodes = this.graphService.nodes;
    const adjacencyList = this.graphService.adjacencyList;

    // Validar que los aeropuertos existen
    if (!nodes.has(origin) || !nodes.has(destination)) {
      return {
        success: false,
        code: 'AIRPORT_NOT_FOUND',
        error: 'Uno o ambos aeropuertos no encontrados'
      };
    }

    // Ruta más barata (usando cost como peso)
    const costRoute = this.findCheapestRoute(origin, destination);

    // Ruta más rápida (usando time como peso)
    const timeRoute = this.findFastestRoute(origin, destination);

    if (!costRoute.success || !timeRoute.success) {
      return {
        success: false,
        error: 'No fue posible calcular ambas rutas'
      };
    }

    // Calcular estadísticas
    const samePath = JSON.stringify(costRoute.path) === JSON.stringify(timeRoute.path);

    // Calcular costo total para ruta por tiempo
    let timeRouteCost = 0;
    for (let i = 0; i < timeRoute.path.length - 1; i++) {
      const current = timeRoute.path[i];
      const next = timeRoute.path[i + 1];
      const neighbors = adjacencyList.get(current) || [];
      const neighbor = neighbors.find(n => n.destination === next);
      if (neighbor) {
        timeRouteCost += neighbor.cost;
      }
    }

    // Calcular tiempo total para ruta por costo
    let costRouteTime = 0;
    for (let i = 0; i < costRoute.path.length - 1; i++) {
      const current = costRoute.path[i];
      const next = costRoute.path[i + 1];
      const neighbors = adjacencyList.get(current) || [];
      const neighbor = neighbors.find(n => n.destination === next);
      if (neighbor) {
        costRouteTime += neighbor.time;
      }
    }

    return {
      success: true,
      comparison: {
        samePath,
        costRoute: {
          path: costRoute.path.join(' → '),
          totalCost: typeof costRoute.totalCost === 'number' ? costRoute.totalCost.toFixed(2) : '0.00',
          totalTime: costRoute.totalTime.toFixed(2),
          timeInHours: (costRoute.totalTime / 60).toFixed(2),
          hops: costRoute.hops
        },
        timeRoute: {
          path: timeRoute.path.join(' → '),
          totalTime: timeRoute.totalTime.toFixed(2),
          timeInHours: (timeRoute.totalTime / 60).toFixed(2),
          totalCost: timeRouteCost.toFixed(2),
          hops: timeRoute.hops
        },
        savings: {
          timeSavings: (costRoute.totalTime - timeRoute.totalTime).toFixed(2),
          costSavings: (timeRouteCost - costRoute.totalCost).toFixed(2),
          costOverhead: (timeRouteCost - costRoute.totalCost).toFixed(2),
          timeOverhead: (costRouteTime - costRoute.totalTime).toFixed(2)
        }
      }
    };
  }

  /**
   * Encontrar ruta más barata (para comparación)
   * Dijkstra usando COST como peso
   */
  findCheapestRoute(origin, destination) {
    const nodes = this.graphService.nodes;
    const adjacencyList = this.graphService.adjacencyList;

    if (!nodes.has(origin) || !nodes.has(destination)) {
      return { success: false, error: 'Aeropuerto no encontrado' };
    }

    if (origin === destination) {
      return { success: false, error: 'Mismo aeropuerto' };
    }

    // Dijkstra con COST
    const distances = new Map();
    const previous = new Map();
    const unvisited = new Set();

    for (const node of nodes.keys()) {
      distances.set(node, Infinity);
      previous.set(node, null);
      unvisited.add(node);
    }

    distances.set(origin, 0);

    while (unvisited.size > 0) {
      let minDistance = Infinity;
      let current = null;

      for (const node of unvisited) {
        if (distances.get(node) < minDistance) {
          minDistance = distances.get(node);
          current = node;
        }
      }

      if (current === null || distances.get(current) === Infinity) {
        break;
      }

      if (current === destination) break;

      unvisited.delete(current);

      const neighbors = adjacencyList.get(current) || [];
      for (const neighbor of neighbors) {
        if (unvisited.has(neighbor.destination)) {
          const newDistance = distances.get(current) + neighbor.cost;

          if (newDistance < distances.get(neighbor.destination)) {
            distances.set(neighbor.destination, newDistance);
            previous.set(neighbor.destination, current);
          }
        }
      }
    }

    const totalCost = distances.get(destination);

    if (totalCost === Infinity) {
      return { success: false, error: 'No route found' };
    }

    const path = [];
    let current = destination;

    while (current !== null) {
      path.unshift(current);
      current = previous.get(current);
    }

    // Calcular tiempo total
    let totalTime = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const curr = path[i];
      const next = path[i + 1];
      const neighbors = adjacencyList.get(curr) || [];
      const neighbor = neighbors.find(n => n.destination === next);
      if (neighbor) {
        totalTime += neighbor.time;
      }
    }

    return {
      success: true,
      path,
      totalCost: totalCost === 0 ? 0 : Math.round(totalCost * 100) / 100,
      totalTime: totalTime === 0 ? 0 : Math.round(totalTime * 100) / 100,
      hops: path.length - 1
    };
  }

  /**
   * Obtener estadísticas del grafo
   * 
   * @returns {Object} Estadísticas
   */
  getStats() {
    const nodes = this.graphService.nodes;
    const edges = this.graphService.edges;

    let totalDegree = 0;
    for (const node of nodes.values()) {
      totalDegree += node.totalDegree;
    }

    const avgDegree = nodes.size > 0 ? totalDegree / nodes.size : 0;

    return {
      totalNodes: nodes.size,
      totalEdges: edges.size,
      avgDegree: avgDegree.toFixed(2),
      nodeNames: Array.from(nodes.keys()).sort()
    };
  }

  /**
   * Formatear tiempo en formato legible
   * 
   * @param {number} minutes - Minutos
   * @returns {string} Formato "Xd Yh Zm"
   */
  formatTime(minutes) {
    if (minutes === 0) return '0m';

    const days = Math.floor(minutes / (24 * 60));
    const hours = Math.floor((minutes % (24 * 60)) / 60);
    const mins = Math.floor(minutes % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (mins > 0) parts.push(`${mins}m`);

    return parts.join(' ');
  }
}

export default TimeOptimizedService;
