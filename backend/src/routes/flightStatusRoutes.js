/**
 * flightStatusRoutes.js
 * Rutas API para actualización de estados de vuelos (Ticket #18)
 */

import express from 'express';

export default function flightStatusRoutes(controller) {
    const router = express.Router();

    router.post('/actualizar', (req, res) => controller.actualizar(req, res));
    router.get('/validar', (req, res) => controller.validar(req, res));
    router.get('/validar-aviones', (req, res) => controller.validarAviones(req, res));
    router.get('/estadisticas', (req, res) => controller.getGlobalStats(req, res));
    router.get('/log', (req, res) => controller.getLog(req, res));

    return router;
}
