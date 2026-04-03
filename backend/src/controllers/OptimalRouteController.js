/**
 * OptimalRouteController.js
 * Controlador REST para el servicio de rutas óptimas (Ticket #16)
 */

class OptimalRouteController {
    constructor(optimalRouteService) {
        if (!optimalRouteService) throw new Error('optimalRouteService es requerido');
        this.service = optimalRouteService;
    }

    /**
     * POST /rutas/mas-barata
     * Body: { origen, destino }
     */
    async rutaMasBarata(req, res) {
        try {
            const { origen, destino } = req.body;
            if (!origen || !destino) {
                return res.status(400).json({
                    success: false, code: 'INVALID_INPUT',
                    error: 'Se requieren origen y destino'
                });
            }
            const result = this.service.rutaMasBarata(origen, destino);
            return res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
            console.error('Error en rutaMasBarata:', error);
            return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', error: 'Error interno' });
        }
    }

    /**
     * POST /rutas/mas-rapida
     * Body: { origen, destino }
     */
    async rutaMasRapida(req, res) {
        try {
            const { origen, destino } = req.body;
            if (!origen || !destino) {
                return res.status(400).json({
                    success: false, code: 'INVALID_INPUT',
                    error: 'Se requieren origen y destino'
                });
            }
            const result = this.service.rutaMasRapida(origen, destino);
            return res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
            console.error('Error en rutaMasRapida:', error);
            return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', error: 'Error interno' });
        }
    }

    /**
     * POST /rutas/tsp
     * Body: { destinos, criterio }
     */
    async rutaTSP(req, res) {
        try {
            const { destinos, criterio } = req.body;
            if (!Array.isArray(destinos) || destinos.length < 2) {
                return res.status(400).json({
                    success: false, code: 'INVALID_INPUT',
                    error: 'Se requieren al menos 2 destinos'
                });
            }
            const result = this.service.rutaTSP(destinos, criterio || 'cost');
            return res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
            console.error('Error en rutaTSP:', error);
            return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', error: 'Error interno' });
        }
    }

    /**
     * POST /rutas/comparar
     * Body: { origen, destino }
     */
    async comparar(req, res) {
        try {
            const { origen, destino } = req.body;
            if (!origen || !destino) {
                return res.status(400).json({
                    success: false, code: 'INVALID_INPUT',
                    error: 'Se requieren origen y destino'
                });
            }
            const result = this.service.compararCostoVsTiempo(origen, destino);
            return res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
            console.error('Error en comparar:', error);
            return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', error: 'Error interno' });
        }
    }

    /**
     * POST /rutas/comparar-tsp
     * Body: { destinos }
     */
    async compararTSP(req, res) {
        try {
            const { destinos } = req.body;
            if (!Array.isArray(destinos) || destinos.length < 2) {
                return res.status(400).json({
                    success: false, code: 'INVALID_INPUT',
                    error: 'Se requieren al menos 2 destinos'
                });
            }
            const result = this.service.compararTSP(destinos);
            return res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
            console.error('Error en compararTSP:', error);
            return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', error: 'Error interno' });
        }
    }

    /**
     * GET /rutas/estadisticas
     */
    async estadisticas(req, res) {
        try {
            const result = this.service.getEstadisticas();
            return res.status(200).json(result);
        } catch (error) {
            console.error('Error en estadisticas:', error);
            return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', error: 'Error interno' });
        }
    }
}

export default OptimalRouteController;
