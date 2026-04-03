/**
 * FlightGraphService.js
 * Servicio para construir y manipular un grafo de rutas aéreas
 * 
 * Construye grafo dirigido ponderado desde datos de vuelos
 * - Nodos: Aeropuertos
 * - Aristas: Rutas entre aeropuertos
 * - Pesos: Costo (precio), tiempo de vuelo, distancia
 * 
 * Compatible con:
 * - Algoritmo de Dijkstra (ruta más corta)
 * - TSP (Traveling Salesman Problem)
 * - BFS/DFS para exploración
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FlightGraphService {

  constructor(flightsData = null) {
    this.flights = flightsData || [];

    // Estructura del grafo
    this.nodes = new Map();      // Aeropuertos (nodos)
    this.edges = new Map();      // Rutas (aristas)
    this.adjacencyList = new Map(); // Lista de adyacencia para BFS/DFS/Dijkstra

    // Estadísticas
    this.stats = {
      totalNodes: 0,
      totalEdges: 0,
      oneWayRoutes: 0,  // Rutas sin retorno
      roundTripRoutes: 0 // Rutas con retorno
    };
  }

  /**
   * PASO 1: Cargar datos de vuelos
   */
  loadFlightsData(flightsData) {
    this.flights = flightsData;
    console.log(`✓ Cargados ${this.flights.length} vuelos`);
    return { success: true, flightsLoaded: this.flights.length };
  }

  /**
   * PASO 2: Construir grafo desde datos de vuelos
   */
  buildGraph() {
    console.log('\n📊 Construyendo grafo de rutas aéreas...');

    // Paso 2.1: Crear nodos (aeropuertos)
    this.buildNodes();

    // Paso 2.2: Crear aristas (rutas)
    this.buildEdges();

    // Paso 2.3: Crear lista de adyacencia
    this.buildAdjacencyList();

    // Paso 2.4: Detectar rutas con/sin retorno
    this.detectRoundTripRoutes();

    console.log(`✓ Grafo construido exitosamente`);

    return {
      success: true,
      nodes: this.nodes.size,
      edges: this.edges.size,
      adjacencyList: this.adjacencyList.size
    };
  }

  /**
   * Paso 2.1: Crear nodos (aeropuertos)
   */
  buildNodes() {
    const uniqueAirports = new Set();

    // Recopilar todos los aeropuertos únicos
    for (const flight of this.flights) {
      uniqueAirports.add(flight.origin);
      uniqueAirports.add(flight.destination);
    }

    // Crear nodo para cada aeropuerto
    for (const airport of uniqueAirports) {
      this.nodes.set(airport, {
        id: airport,
        inDegree: 0,      // Conexiones entrantes
        outDegree: 0,     // Conexiones salientes
        totalDegree: 0,   // Total conexiones
        info: this.getAirportInfo(airport)
      });
    }

    this.stats.totalNodes = this.nodes.size;
    console.log(`  → ${this.nodes.size} nodos (aeropuertos) creados`);
  }

  /**
   * Paso 2.2: Crear aristas (rutas)
   */
  buildEdges() {
    // Agrupar vuelos por ruta (origen-destino)
    const routeMap = new Map();

    for (const flight of this.flights) {
      const route = `${flight.origin}-${flight.destination}`;

      if (!routeMap.has(route)) {
        routeMap.set(route, []);
      }
      routeMap.get(route).push(flight);
    }

    // Crear arista para cada ruta
    for (const [route, flights] of routeMap.entries()) {
      const [origin, destination] = route.split('-');

      // Calcular pesos agregados
      const totalCost = flights.reduce((sum, f) => sum + (f.price || 500), 0);
      const avgCost = flights.length > 0 ? totalCost / flights.length : 0;

      const totalTime = flights.reduce((sum, f) => sum + (this.calculateFlightTime(f) || 120), 0);
      const avgTime = flights.length > 0 ? totalTime / flights.length : 0;

      // Contar vuelos por status
      const statusCounts = {};
      for (const flight of flights) {
        statusCounts[flight.status] = (statusCounts[flight.status] || 0) + 1;
      }

      // Crear arista
      const edge = {
        source: origin,
        target: destination,
        weight: avgCost,           // Peso: costo promedio
        cost: avgCost,             // Costo (precio promedio)
        time: avgTime,             // Tiempo en minutos
        frequency: flights.length, // Cantidad de vuelos en esta ruta
        flightIds: flights.map(f => f.flightId || f.id),
        statusDistribution: statusCounts
      };

      const edgeKey = route;
      this.edges.set(edgeKey, edge);

      // Actualizar grados de nodos
      this.nodes.get(origin).outDegree++;
      this.nodes.get(destination).inDegree++;
      this.nodes.get(origin).totalDegree++;
      this.nodes.get(destination).totalDegree++;
    }

    this.stats.totalEdges = this.edges.size;
    console.log(`  → ${this.edges.size} aristas (rutas) creadas`);
  }

  /**
   * Paso 2.3: Crear lista de adyacencia
   */
  buildAdjacencyList() {
    // Inicializar lista vacía para cada nodo
    for (const airport of this.nodes.keys()) {
      this.adjacencyList.set(airport, []);
    }

    // Añadir aristas a lista de adyacencia
    for (const edge of this.edges.values()) {
      const adjacency = {
        destination: edge.target,
        weight: edge.weight,
        cost: edge.cost,
        time: edge.time,
        frequency: edge.frequency
      };

      this.adjacencyList.get(edge.source).push(adjacency);
    }

    console.log(`  → Lista de adyacencia creada (${this.adjacencyList.size} nodos)`);
  }

  /**
   * Paso 2.4: Detectar rutas con/sin retorno
   */
  detectRoundTripRoutes() {
    for (const [route, edge] of this.edges.entries()) {
      const reverseRoute = `${edge.target}-${edge.source}`;

      if (this.edges.has(reverseRoute)) {
        this.stats.roundTripRoutes++;
      } else {
        this.stats.oneWayRoutes++;
      }
    }

    console.log(`  → Rutas de un solo sentido: ${this.stats.oneWayRoutes}`);
    console.log(`  → Rutas ida/retorno: ${this.stats.roundTripRoutes}`);
  }

  /**
   * PASO 3: Consultar vecinos de un nodo
   */
  getNeighbors(airport) {
    if (!this.adjacencyList.has(airport)) {
      return { success: false, error: `Aeropuerto no encontrado: ${airport}` };
    }

    const neighbors = this.adjacencyList.get(airport);

    return {
      success: true,
      airport,
      neighbors: neighbors.map(n => ({
        destination: n.destination,
        cost: n.cost,
        time: n.time,
        frequency: n.frequency
      })),
      totalNeighbors: neighbors.length
    };
  }

  /**
   * Consultar todos los vecinos (sucesor y predecesor)
   */
  getAllConnections(airport) {
    if (!this.nodes.has(airport)) {
      return { success: false, error: `Aeropuerto no encontrado: ${airport}` };
    }

    const node = this.nodes.get(airport);

    // Sucesores (outgoing)
    const successors = this.adjacencyList.get(airport) || [];

    // Predecesores (incoming)
    const predecessors = [];
    for (const [sourceAirport, neighbors] of this.adjacencyList.entries()) {
      for (const neighbor of neighbors) {
        if (neighbor.destination === airport) {
          predecessors.push({
            source: sourceAirport,
            cost: neighbor.cost,
            time: neighbor.time
          });
        }
      }
    }

    return {
      success: true,
      airport,
      node: {
        inDegree: node.inDegree,
        outDegree: node.outDegree,
        totalDegree: node.totalDegree
      },
      successors: successors.length,
      predecessors: predecessors.length,
      outgoing: successors.map(s => ({ destination: s.destination, cost: s.cost })),
      incoming: predecessors.map(p => ({ source: p.source, cost: p.cost }))
    };
  }

  /**
   * PASO 4: Algoritmo de Dijkstra
   */
  dijkstra(start, end = null) {
    if (!this.nodes.has(start)) {
      return { success: false, error: `Nodo inicial no encontrado: ${start}` };
    }

    const distances = new Map();
    const previous = new Map();
    const unvisited = new Set();

    // Inicializar
    for (const airport of this.nodes.keys()) {
      distances.set(airport, airport === start ? 0 : Infinity);
      previous.set(airport, null);
      unvisited.add(airport);
    }

    while (unvisited.size > 0) {
      // Obtener nodo no visitado con menor distancia
      let current = null;
      let minDist = Infinity;

      for (const airport of unvisited) {
        if (distances.get(airport) < minDist) {
          minDist = distances.get(airport);
          current = airport;
        }
      }

      if (current === null || distances.get(current) === Infinity) break;

      unvisited.delete(current);

      // Revisar vecinos
      const neighbors = this.adjacencyList.get(current) || [];
      for (const neighbor of neighbors) {
        const alt = distances.get(current) + neighbor.weight;

        if (alt < distances.get(neighbor.destination)) {
          distances.set(neighbor.destination, alt);
          previous.set(neighbor.destination, current);
        }
      }
    }

    // Si end especificado, devolver camino
    if (end && this.nodes.has(end)) {
      const path = [];
      let current = end;

      while (current !== null) {
        path.unshift(current);
        current = previous.get(current);
      }

      if (path[0] !== start) {
        return {
          success: false,
          error: `No hay camino de ${start} a ${end}`
        };
      }

      return {
        success: true,
        start,
        end,
        distance: distances.get(end),
        path,
        pathLength: path.length
      };
    }

    // Sin end especificado, devolver todas las distancias
    return {
      success: true,
      start,
      distances: Object.fromEntries(distances),
      previous: Object.fromEntries(previous)
    };
  }

  /**
   * PASO 5: BFS para exploración
   */
  bfs(start, maxDepth = 3) {
    if (!this.nodes.has(start)) {
      return { success: false, error: `Nodo inicial no encontrado: ${start}` };
    }

    const visited = new Set();
    const queue = [[start, 0]]; // [airport, depth]
    const result = new Map();

    visited.add(start);
    result.set(start, { depth: 0, path: [start] });

    while (queue.length > 0) {
      const [current, depth] = queue.shift();

      if (depth >= maxDepth) continue;

      const neighbors = this.adjacencyList.get(current) || [];
      for (const neighbor of neighbors) {
        const dest = neighbor.destination;

        if (!visited.has(dest)) {
          visited.add(dest);
          const path = [...result.get(current).path, dest];
          result.set(dest, { depth: depth + 1, path });
          queue.push([dest, depth + 1]);
        }
      }
    }

    return {
      success: true,
      start,
      maxDepth,
      reachableNodes: result.size,
      exploration: Object.fromEntries(result)
    };
  }

  /**
   * Exportar grafo a JSON
   */
  exportGraph(outputPath = null) {
    const finalPath = outputPath || path.join(__dirname, '../flights_graph.json');

    const graphData = {
      metadata: {
        exportDate: new Date().toISOString(),
        totalNodes: this.stats.totalNodes,
        totalEdges: this.stats.totalEdges,
        oneWayRoutes: this.stats.oneWayRoutes,
        roundTripRoutes: this.stats.roundTripRoutes
      },
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()),
      adjacencyList: Object.fromEntries(
        Array.from(this.adjacencyList.entries()).map(([airport, neighbors]) => [
          airport,
          neighbors
        ])
      )
    };

    try {
      fs.writeFileSync(finalPath, JSON.stringify(graphData, null, 2), 'utf-8');
      console.log(`✓ Grafo exportado a: ${finalPath}`);
      return { success: true, filePath: finalPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener estadísticas del grafo
   */
  getStats() {
    const allOutDegrees = Array.from(this.nodes.values()).map(n => n.outDegree);
    const allInDegrees = Array.from(this.nodes.values()).map(n => n.inDegree);

    return {
      totalNodes: this.stats.totalNodes,
      totalEdges: this.stats.totalEdges,
      oneWayRoutes: this.stats.oneWayRoutes,
      roundTripRoutes: this.stats.roundTripRoutes,
      averageOutDegree: (allOutDegrees.reduce((a, b) => a + b, 0) / this.stats.totalNodes).toFixed(2),
      averageInDegree: (allInDegrees.reduce((a, b) => a + b, 0) / this.stats.totalNodes).toFixed(2),
      maxOutDegree: Math.max(...allOutDegrees),
      maxInDegree: Math.max(...allInDegrees),
      hubNodes: Array.from(this.nodes.values())
        .filter(n => n.totalDegree > 10)
        .map(n => ({ airport: n.id, connections: n.totalDegree }))
        .sort((a, b) => b.connections - a.connections)
        .slice(0, 10)
    };
  }

  /**
   * Funciones auxiliares
   */

  calculateFlightTime(flight) {
    // 1. Usar duración explícita si existe (del modelo o del JSON original)
    if (flight.duration) return parseInt(flight.duration);
    if (flight.flight_time) return parseInt(flight.flight_time);

    // 2. Calcular si tenemos tiempos reales distintos
    if (flight.departureTime && flight.arrivalTime && flight.departureTime !== flight.arrivalTime) {
      const dept = new Date(flight.departureTime);
      const arr = new Date(flight.arrivalTime);
      return Math.max(30, (arr - dept) / (1000 * 60));
    }

    // 3. Estimación por defecto
    return 120;
  }

  getAirportInfo(code) {
    // Buscar informacion del aeropuerto en la data
    for (const flight of this.flights) {
      if (flight.origin === code && flight.originAirport) {
        return flight.originAirport;
      }
      if (flight.destination === code && flight.destinationAirport) {
        return flight.destinationAirport;
      }
    }
    return { city: code, country: 'Unknown', name: code };
  }

  /**
   * Pipeline completo
   */
  executeFullPipeline(flightsData) {
    console.log('\n═══════════════════════════════════════════════════');
    console.log('🚀 PIPELINE DE CONSTRUCCIÓN DE GRAFO DE RUTAS');
    console.log('═══════════════════════════════════════════════════\n');

    const startTime = Date.now();

    // Cargar datos
    this.loadFlightsData(flightsData);

    // Construir grafo
    this.buildGraph();

    // Ejemplo: Dijkstra (ruta más corta)
    const dijkstraExample = this.dijkstra('ATL', 'LAX');

    // Ejemplo: BFS
    const bfsExample = this.bfs('ATL', 2);

    // Estadísticas
    const stats = this.getStats();

    // Exportar
    const exportResult = this.exportGraph();

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('\n═══════════════════════════════════════════════════');
    console.log('📊 RESUMEN DE CONSTRUCCIÓN DE GRAFO');
    console.log('═══════════════════════════════════════════════════');
    console.log(`⏱️  Tiempo total: ${duration}ms`);
    console.log(`📍 Nodos (aeropuertos): ${this.stats.totalNodes}`);
    console.log(`🔗 Aristas (rutas): ${this.stats.totalEdges}`);
    console.log(`🛫 Rutas un solo sentido: ${this.stats.oneWayRoutes}`);
    console.log(`🔄 Rutas ida/retorno: ${this.stats.roundTripRoutes}`);
    console.log('═══════════════════════════════════════════════════\n');

    return {
      success: true,
      stats: {
        totalNodes: this.stats.totalNodes,
        totalEdges: this.stats.totalEdges,
        oneWayRoutes: this.stats.oneWayRoutes,
        roundTripRoutes: this.stats.roundTripRoutes,
        duration,
        graphExported: exportResult.success
      }
    };
  }
}

export default FlightGraphService;
