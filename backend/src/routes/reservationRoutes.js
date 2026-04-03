/**
 * Rutas de Reservas
 */

import express from 'express';

export const createReservationRoutes = (controller) => {
  const router = express.Router();

  /**
   * POST /reservations - Crear nueva reserva
   */
  router.post('/', (req, res) => controller.create(req, res));

  /**
   * GET /reservations - Obtener todas las reservas
   */
  router.get('/', (req, res) => controller.getAll(req, res));

  /**
   * GET /reservations/:id - Obtener reserva por ID
   */
  router.get('/:id', (req, res) => controller.getById(req, res));

  /**
   * PUT /reservations/:id - Actualizar reserva
   */
  router.put('/:id', (req, res) => controller.update(req, res));

  /**
   * DELETE /reservations/:id - Eliminar reserva
   */
  router.delete('/:id', (req, res) => controller.delete(req, res));

  return router;
};

export default createReservationRoutes;
