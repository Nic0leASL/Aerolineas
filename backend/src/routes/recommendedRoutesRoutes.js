/**
 * Rutas API para el catálogo de rutas recomendadas con escalas
 * Basado en las tablas del PDF de Práctica 3
 */

import express from 'express';

export default function recommendedRoutesRoutes(recommendedRoutesService) {
    const router = express.Router();

    /**
     * GET /rutas-recomendadas
     * Obtener todas las rutas recomendadas con escalas
     */
    router.get('/', (req, res) => {
        res.json({
            success: true,
            data: recommendedRoutesService.getAllRoutes(),
            descripcion: 'Catálogo completo de rutas recomendadas con escalas según el PDF de Práctica 3'
        });
    });

    /**
     * GET /rutas-recomendadas/buscar?origen=ATL&destino=PEK
     * Buscar rutas recomendadas entre dos aeropuertos
     */
    router.get('/buscar', (req, res) => {
        const { origen, destino } = req.query;

        if (!origen || !destino) {
            return res.status(400).json({
                success: false,
                error: 'Parámetros requeridos: origen, destino'
            });
        }

        const rutas = recommendedRoutesService.findRoutes(
            origen.toUpperCase(), 
            destino.toUpperCase()
        );

        res.json({
            success: true,
            origen: origen.toUpperCase(),
            destino: destino.toUpperCase(),
            rutasEncontradas: rutas.length,
            rutas,
            nota: rutas.length === 0 
                ? 'No hay rutas predefinidas. Usa /dijkstra o /ruta-optima para calcular la mejor ruta.' 
                : 'Opciones: rápida, barata, alternativa'
        });
    });

    /**
     * GET /rutas-recomendadas/region/:region
     * Obtener rutas por región: america, europa, asia_medio_oriente
     */
    router.get('/region/:region', (req, res) => {
        const { region } = req.params;
        const data = recommendedRoutesService.getRoutesByRegion(region.toLowerCase());

        if (!data) {
            return res.status(404).json({
                success: false,
                error: `Región no encontrada: ${region}`,
                regionesDisponibles: ['america', 'europa', 'asia_medio_oriente']
            });
        }

        res.json({ success: true, region, data });
    });

    /**
     * GET /rutas-recomendadas/intra-europa
     * Obtener rutas directas dentro de Europa
     */
    router.get('/intra-europa', (req, res) => {
        const data = recommendedRoutesService.getIntraEuropeRoutes();
        res.json({ success: true, data });
    });

    /**
     * GET /rutas-recomendadas/hubs
     * Obtener resumen de hubs principales por región
     */
    router.get('/hubs', (req, res) => {
        res.json({
            success: true,
            hubs: recommendedRoutesService.getHubsSummary()
        });
    });

    return router;
}
