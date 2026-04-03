/**
 * OptimalRouteService.js
 * Ticket #16: Servicio unificado de rutas óptimas
 * 
 * Empaqueta los algoritmos de Dijkstra, Time-Optimized y TSP
 * en funciones reutilizables con salida JSON estandarizada.
 * 
 * Métodos principales:
 *   rutaMasBarata(origen, destino)
 *   rutaMasRapida(origen, destino)
 *   rutaTSP(destinos, criterio)
 */

class OptimalRouteService {
    constructor(dijkstraService, timeOptimizedService, tspService) {
        if (!dijkstraService) throw new Error('dijkstraService es requerido');
        if (!timeOptimizedService) throw new Error('timeOptimizedService es requerido');
        if (!tspService) throw new Error('tspService es requerido');

        this.dijkstraService = dijkstraService;
        this.timeOptimizedService = timeOptimizedService;
        this.tspService = tspService;
    }

    /**
     * Obtener la ruta más barata entre dos aeropuertos
     * Usa algoritmo de Dijkstra con pesos de costo
     * 
     * @param {string} origen - Código aeropuerto origen (ej: 'ATL')
     * @param {string} destino - Código aeropuerto destino (ej: 'LAX')
     * @returns {Object} Resultado JSON estandarizado
     */
    rutaMasBarata(origen, destino) {
        const result = this.dijkstraService.findCheapestRoute(origen, destino);

        if (!result.success) {
            return {
                success: false,
                tipo: 'RUTA_MAS_BARATA',
                codigo: result.code || 'ERROR',
                error: result.error,
                origen,
                destino
            };
        }

        return {
            success: true,
            tipo: 'RUTA_MAS_BARATA',
            origen,
            destino,
            ruta: result.path,
            rutaTexto: result.path.join(' → '),
            totalCost: result.totalCost, // Frontend espera totalCost
            costoTotal: result.totalCost,
            saltos: result.hops,
            detallesSegmentos: result.routeDetails,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Obtener la ruta más rápida entre dos aeropuertos
     * Usa algoritmo de Dijkstra con pesos de tiempo
     * 
     * @param {string} origen - Código aeropuerto origen (ej: 'ATL')
     * @param {string} destino - Código aeropuerto destino (ej: 'LAX')
     * @returns {Object} Resultado JSON estandarizado
     */
    rutaMasRapida(origen, destino) {
        const result = this.timeOptimizedService.findFastestRoute(origen, destino);

        if (!result.success) {
            return {
                success: false,
                tipo: 'RUTA_MAS_RAPIDA',
                codigo: result.code || 'ERROR',
                error: result.error,
                origen,
                destino
            };
        }

        return {
            success: true,
            tipo: 'RUTA_MAS_RAPIDA',
            origen,
            destino,
            ruta: result.path,
            rutaTexto: result.path.join(' → '),
            totalTime: result.totalTime, // Frontend espera totalTime
            tiempoTotal: result.totalTime,
            tiempoHoras: result.timeInHours,
            tiempoFormato: result.timeInDaysHours,
            saltos: result.hops,
            detallesSegmentos: result.routeDetails,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Resolver el TSP para múltiples destinos
     * Usa Nearest Neighbor + 2-Opt o fuerza bruta según cantidad
     * 
     * @param {Array<string>} destinos - Lista de aeropuertos a visitar
     * @param {string} criterio - 'cost' o 'time'
     * @returns {Object} Resultado JSON estandarizado
     */
    rutaTSP(destinos, criterio = 'cost') {
        // Si hay ≤8 destinos, intentar exacto también
        let exactResult = null;
        if (destinos.length <= 8) {
            exactResult = this.tspService.solveTSPExact(destinos, criterio);
        }

        // Siempre ejecutar heurístico
        const heuristicResult = this.tspService.solveTSP(destinos, criterio);

        if (!heuristicResult.success) {
            return {
                success: false,
                tipo: 'TSP',
                codigo: heuristicResult.code || 'ERROR',
                error: heuristicResult.error,
                destinos
            };
        }

        const response = {
            success: true,
            tipo: 'TSP',
            criterio,
            destinos: destinos.length,
            rutaOptima: heuristicResult.path,
            rutaTexto: heuristicResult.pathString,
            distanciaTotal: heuristicResult.totalDistance,
            algoritmo: 'Nearest Neighbor + 2-Opt',
            mejora2Opt: heuristicResult.iterations.improvement + '%',
            segmentos: heuristicResult.segments,
            resumen: heuristicResult.summary,
            timestamp: new Date().toISOString()
        };

        // Incluir resultado exacto si está disponible
        if (exactResult && exactResult.success) {
            response.resultadoExacto = {
                rutaOptima: exactResult.path,
                rutaTexto: exactResult.pathString,
                distanciaTotal: exactResult.totalDistance,
                algoritmo: exactResult.algorithm
            };
        }

        return response;
    }

    /**
     * Comparar ruta más barata vs más rápida
     * 
     * @param {string} origen - Código aeropuerto origen
     * @param {string} destino - Código aeropuerto destino
     * @returns {Object} Comparación completa
     */
    compararCostoVsTiempo(origen, destino) {
        const barata = this.rutaMasBarata(origen, destino);
        const rapida = this.rutaMasRapida(origen, destino);

        if (!barata.success || !rapida.success) {
            return {
                success: false,
                tipo: 'COMPARACION',
                error: 'No fue posible calcular ambas rutas',
                detalleCosto: barata,
                detalleTiempo: rapida
            };
        }

        const mismaRuta = JSON.stringify(barata.ruta) === JSON.stringify(rapida.ruta);

        return {
            success: true,
            tipo: 'COMPARACION',
            origen,
            destino,
            mismaRuta,
            rutaMasBarata: {
                ruta: barata.rutaTexto,
                costo: barata.costoTotal,
                saltos: barata.saltos
            },
            rutaMasRapida: {
                ruta: rapida.rutaTexto,
                tiempo: rapida.tiempoTotal,
                tiempoHoras: rapida.tiempoHoras,
                saltos: rapida.saltos
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Comparar TSP por costo vs tiempo
     * 
     * @param {Array<string>} destinos - Lista de destinos
     * @returns {Object} Comparación
     */
    compararTSP(destinos) {
        const result = this.tspService.compareCostVsTime(destinos);

        if (!result.success) {
            return {
                success: false,
                tipo: 'COMPARACION_TSP',
                error: result.error
            };
        }

        return {
            success: true,
            tipo: 'COMPARACION_TSP',
            ...result,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Obtener estadísticas generales del servicio
     * 
     * @returns {Object} Estadísticas combinadas
     */
    getEstadisticas() {
        const dijkstraStats = this.dijkstraService.getStats();
        const timeStats = this.timeOptimizedService.getStats();
        const tspStats = this.tspService.getStats();

        return {
            success: true,
            grafo: {
                nodos: dijkstraStats.totalNodes,
                aristas: dijkstraStats.totalEdges,
                gradoPromedio: dijkstraStats.avgDegree
            },
            algoritmosDisponibles: [
                { nombre: 'Dijkstra (costo)', funcion: 'rutaMasBarata(origen, destino)' },
                { nombre: 'Dijkstra (tiempo)', funcion: 'rutaMasRapida(origen, destino)' },
                { nombre: 'TSP Heurístico', funcion: 'rutaTSP(destinos, criterio)' },
                { nombre: 'TSP Exacto', funcion: 'rutaTSP(destinos, criterio) [≤8 destinos]' }
            ],
            maxDestinosTSPExacto: tspStats.maxTSPExact,
            aeropuertos: timeStats.nodeNames || [],
            timestamp: new Date().toISOString()
        };
    }
}

export default OptimalRouteService;
