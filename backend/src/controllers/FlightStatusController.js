/**
 * FlightStatusController.js
 * Controlador REST para actualización automática de estados (Ticket #18)
 */

class FlightStatusController {
    constructor(flightStatusService) {
        if (!flightStatusService) throw new Error('flightStatusService es requerido');
        this.service = flightStatusService;
        this.flightsData = null; // Se establece al cargar datos
    }

    setFlightsData(data) {
        this.flightsData = data;
    }

    /**
     * POST /estado-vuelos/actualizar
     */
    async actualizar(req, res) {
        try {
            if (!this.flightsData || this.flightsData.length === 0) {
                return res.status(400).json({ success: false, error: 'No hay datos de vuelos cargados' });
            }
            const result = this.service.actualizarEstados(this.flightsData);
            return res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
            console.error('Error en actualizar:', error);
            return res.status(500).json({ success: false, error: 'Error interno' });
        }
    }

    /**
     * GET /estado-vuelos/validar
     */
    async validar(req, res) {
        try {
            if (!this.flightsData || this.flightsData.length === 0) {
                return res.status(400).json({ success: false, error: 'No hay datos de vuelos cargados' });
            }
            const result = this.service.validarConsistencia(this.flightsData);
            return res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
            console.error('Error en validar:', error);
            return res.status(500).json({ success: false, error: 'Error interno' });
        }
    }

    /**
     * GET /estado-vuelos/validar-aviones
     */
    async validarAviones(req, res) {
        try {
            if (!this.flightsData || this.flightsData.length === 0) {
                return res.status(400).json({ success: false, error: 'No hay datos de vuelos cargados' });
            }
            const result = this.service.validarRutasAvion(this.flightsData);
            return res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
            console.error('Error en validarAviones:', error);
            return res.status(500).json({ success: false, error: 'Error interno' });
        }
    }

    /**
     * GET /estado-vuelos/estadisticas
     */
    async getGlobalStats(req, res) {
        try {
            const data = this.flightsData || [];
            const result = await this.service.getGlobalStats(data);
            return res.status(200).json(result);
        } catch (error) {
            console.error('Error en getGlobalStats:', error);
            return res.status(500).json({ success: false, error: 'Error interno' });
        }
    }

    /**
     * GET /estado-vuelos/log
     */
    async getLog(req, res) {
        try {
            const result = this.service.getLog();
            return res.status(200).json(result);
        } catch (error) {
            console.error('Error en getLog:', error);
            return res.status(500).json({ success: false, error: 'Error interno' });
        }
    }
}

export default FlightStatusController;
