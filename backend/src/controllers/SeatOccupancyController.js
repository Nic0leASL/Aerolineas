/**
 * SeatOccupancyController.js
 * Controlador REST para simulación de ocupación de asientos (Ticket #17)
 */

class SeatOccupancyController {
    constructor(seatOccupancyService, flightService) {
        if (!seatOccupancyService) throw new Error('seatOccupancyService es requerido');
        this.service = seatOccupancyService;
        this.flightService = flightService;
    }

    /**
     * POST /ocupacion/simular
     * Body: { flightId }
     */
    async simular(req, res) {
        try {
            const { flightId } = req.body;
            if (!flightId) {
                return res.status(400).json({ success: false, error: 'Se requiere flightId' });
            }

            const flight = this.flightService.getFlight(flightId);
            if (!flight) {
                return res.status(404).json({ success: false, error: 'Vuelo no encontrado' });
            }

            const result = this.service.simularOcupacion(flight);
            return res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
            console.error('Error en simular:', error);
            return res.status(500).json({ success: false, error: 'Error interno' });
        }
    }

    /**
     * POST /ocupacion/simular-todos
     * Simular ocupación para todos los vuelos
     */
    async simularTodos(req, res) {
        try {
            const flights = this.flightService.getAllFlights();
            if (flights.length === 0) {
                return res.status(400).json({ success: false, error: 'No hay vuelos registrados' });
            }

            const result = this.service.simularOcupacionMasiva(flights);
            return res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
            console.error('Error en simularTodos:', error);
            return res.status(500).json({ success: false, error: 'Error interno' });
        }
    }

    /**
     * GET /ocupacion/exportar/:flightId
     */
    async exportar(req, res) {
        try {
            const { flightId } = req.params;
            const flight = this.flightService.getFlight(flightId);
            if (!flight) {
                return res.status(404).json({ success: false, error: 'Vuelo no encontrado' });
            }

            const result = this.service.exportarDistribucion(flight);
            return res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
            console.error('Error en exportar:', error);
            return res.status(500).json({ success: false, error: 'Error interno' });
        }
    }

    /**
     * PUT /ocupacion/configuracion
     * Body: { vendido: {...}, reservado: {...} }
     */
    async actualizarConfiguracion(req, res) {
        try {
            const result = this.service.actualizarConfiguracion(req.body);
            return res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
            console.error('Error en actualizarConfiguracion:', error);
            return res.status(500).json({ success: false, error: 'Error interno' });
        }
    }

    /**
     * GET /ocupacion/configuracion
     */
    async getConfiguracion(req, res) {
        try {
            const result = this.service.getConfiguracion();
            return res.status(200).json(result);
        } catch (error) {
            console.error('Error en getConfiguracion:', error);
            return res.status(500).json({ success: false, error: 'Error interno' });
        }
    }
}

export default SeatOccupancyController;
