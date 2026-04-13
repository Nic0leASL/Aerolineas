/**
 * RecommendedRoutesService.js
 * 
 * Servicio de rutas recomendadas con escalas según el PDF de Práctica 3.
 * Proporciona itinerarios predefinidos organizados por región:
 *   - América (ATL, LAX, DFW, SAO)
 *   - Europa (LON, PAR, FRA, MAD, AMS, IST)
 *   - Asia + Medio Oriente (PEK, TYO, DXB, SIN, CAN)
 *
 * Cada ruta tiene 3 opciones:
 *   1. Más Rápida
 *   2. Más Barata / Buena
 *   3. Alternativa
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class RecommendedRoutesService {
    constructor() {
        this.routes = null;
        this.loadRoutes();
    }

    /**
     * Cargar catálogo de rutas recomendadas desde JSON
     */
    loadRoutes() {
        try {
            const routesPath = path.join(__dirname, '..', 'data', 'recommended_routes.json');
            const data = fs.readFileSync(routesPath, 'utf8');
            this.routes = JSON.parse(data);
        } catch (error) {
            console.error('Error cargando rutas recomendadas:', error.message);
            this.routes = {};
        }
    }

    /**
     * Obtener todas las rutas recomendadas
     */
    getAllRoutes() {
        return this.routes;
    }

    /**
     * Obtener rutas por región
     * @param {string} region - 'america', 'europa', 'asia_medio_oriente'
     */
    getRoutesByRegion(region) {
        return this.routes[region] || null;
    }

    /**
     * Buscar rutas recomendadas entre origen y destino
     * @param {string} origen - Código IATA del aeropuerto origen
     * @param {string} destino - Código IATA del aeropuerto destino
     * @returns {Array} Opciones de ruta encontradas
     */
    findRoutes(origen, destino) {
        const results = [];

        // Buscar en rutas desde América
        if (this.routes.america) {
            // Desde ATL
            if (this.routes.america.desde_ATL) {
                for (const ruta of this.routes.america.desde_ATL.rutas) {
                    if (this.matchRoute(origen, destino, 'ATL', ruta)) {
                        results.push({
                            region: 'América',
                            hub: 'ATL',
                            destino: ruta.destino,
                            region_destino: ruta.region_destino,
                            opciones: ruta.opciones
                        });
                    }
                }
            }
            // Desde SAO
            if (this.routes.america.desde_SAO) {
                for (const ruta of this.routes.america.desde_SAO.rutas) {
                    if (this.matchRoute(origen, destino, 'SAO', ruta)) {
                        results.push({
                            region: 'América (Sudamérica)',
                            hub: 'SAO',
                            destino: ruta.destino,
                            region_destino: ruta.region_destino,
                            opciones: ruta.opciones
                        });
                    }
                }
            }
        }

        // Buscar en rutas desde Europa → Asia
        if (this.routes.europa?.europa_a_asia) {
            for (const ruta of this.routes.europa.europa_a_asia.rutas) {
                if (this.matchRouteEuropa(origen, destino, ruta)) {
                    results.push({
                        region: 'Europa → Asia',
                        hub: ruta.origen,
                        destino: ruta.destino,
                        opciones: ruta.opciones
                    });
                }
            }
        }

        // Buscar en rutas desde Asia + Medio Oriente
        if (this.routes.asia_medio_oriente?.rutas) {
            for (const ruta of this.routes.asia_medio_oriente.rutas) {
                if (this.matchRouteAsia(origen, destino, ruta)) {
                    results.push({
                        region: 'Asia + Medio Oriente',
                        hub: ruta.origen,
                        destino: ruta.destino,
                        opciones: ruta.opciones
                    });
                }
            }
        }

        return results;
    }

    /**
     * Verificar si una ruta de América coincide con origen/destino
     */
    matchRoute(origen, destino, hub, ruta) {
        if (origen !== hub) return false;
        // Manejar destinos con "/" como "LON/PAR/FRA"
        const destinos = ruta.destino.split('/');
        return destinos.some(d => d === destino || d === 'destino');
    }

    /**
     * Verificar si una ruta europea coincide
     */
    matchRouteEuropa(origen, destino, ruta) {
        const origenes = ruta.origen.split('/');
        const destinos = ruta.destino.split('/');
        return origenes.some(o => o === origen) && 
               (destinos.some(d => d === destino) || ruta.destino === destino);
    }

    /**
     * Verificar si una ruta asiática coincide
     */
    matchRouteAsia(origen, destino, ruta) {
        const origenes = ruta.origen.split('/');
        const destinos = ruta.destino.split('/');
        return origenes.some(o => o === origen) && 
               (destinos.some(d => d === destino) || ruta.destino === destino);
    }

    /**
     * Obtener rutas intra-Europa (directas)
     */
    getIntraEuropeRoutes() {
        return this.routes.europa?.intra_europa || null;
    }

    /**
     * Obtener resumen de hubs por región
     */
    getHubsSummary() {
        return {
            america: {
                hubs: this.routes.america?.hubs || [],
                mejorHub: 'ATL',
                nota: 'Atlanta - el mejor hub de América'
            },
            europa: {
                hubs: this.routes.europa?.hubs || [],
                mejorHub: 'IST',
                nota: 'IST conecta con toda Europa (3-4h)'
            },
            asia: {
                hubs: this.routes.asia_medio_oriente?.hubs || [],
                mejorHub: 'PEK',
                nota: 'Beijing - hub principal de Asia'
            }
        };
    }
}

export default RecommendedRoutesService;
