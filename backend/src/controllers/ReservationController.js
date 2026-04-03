/**
 * Controlador de Reservas
 */

import Logger from '../utils/logger.js';

const logger = new Logger(process.env.LOG_LEVEL || 'info');

export class ReservationController {
  constructor(reservationService) {
    this.service = reservationService;
  }

  /**
   * Crear nueva reserva
   */
  async create(req, res) {
    try {
      const { userId, resourceId, startTime, endTime } = req.body;

      if (!userId || !resourceId || !startTime || !endTime) {
        return res.status(400).json({
          error: 'Faltan parámetros requeridos'
        });
      }

      const reservation = this.service.createReservation({
        userId,
        resourceId,
        startTime,
        endTime
      });

      res.status(201).json(reservation);
    } catch (error) {
      logger.error('Error creando reserva', { error: error.message });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Obtener todas las reservas
   */
  async getAll(req, res) {
    try {
      const reservations = this.service.getAllReservations();
      res.status(200).json(reservations);
    } catch (error) {
      logger.error('Error obteniendo reservas', { error: error.message });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Obtener reserva por ID
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const reservation = this.service.getReservationById(parseInt(id));

      if (!reservation) {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }

      res.status(200).json(reservation);
    } catch (error) {
      logger.error('Error obteniendo reserva', { error: error.message });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Actualizar reserva
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const reservation = this.service.updateReservation(parseInt(id), req.body);

      if (!reservation) {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }

      res.status(200).json(reservation);
    } catch (error) {
      logger.error('Error actualizando reserva', { error: error.message });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Eliminar reserva
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      const success = this.service.deleteReservation(parseInt(id));

      if (!success) {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }

      res.status(204).send();
    } catch (error) {
      logger.error('Error eliminando reserva', { error: error.message });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

export default ReservationController;
