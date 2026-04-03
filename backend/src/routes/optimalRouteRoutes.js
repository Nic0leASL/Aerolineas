/**
 * optimalRouteRoutes.js
 * Rutas API para servicio de rutas óptimas (Ticket #16)
 */

import express from 'express';

export default function optimalRouteRoutes(controller) {
    const router = express.Router();

    router.post('/mas-barata', (req, res) => controller.rutaMasBarata(req, res));
    router.post('/mas-rapida', (req, res) => controller.rutaMasRapida(req, res));
    router.post('/tsp', (req, res) => controller.rutaTSP(req, res));
    router.post('/comparar', (req, res) => controller.comparar(req, res));
    router.post('/comparar-tsp', (req, res) => controller.compararTSP(req, res));
    router.get('/estadisticas', (req, res) => controller.estadisticas(req, res));

    return router;
}
