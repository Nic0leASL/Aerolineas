/**
 * seatOccupancyRoutes.js
 * Rutas API para simulación de ocupación (Ticket #17)
 */

import express from 'express';

export default function seatOccupancyRoutes(controller) {
    const router = express.Router();

    router.post('/simular', (req, res) => controller.simular(req, res));
    router.post('/simular-todos', (req, res) => controller.simularTodos(req, res));
    router.get('/exportar/:flightId', (req, res) => controller.exportar(req, res));
    router.put('/configuracion', (req, res) => controller.actualizarConfiguracion(req, res));
    router.get('/configuracion', (req, res) => controller.getConfiguracion(req, res));

    return router;
}
