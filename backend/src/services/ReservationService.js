/**
 * Servicio de Reservas
 * Maneja la lógica de negocio de reservas
 */

import Logger from '../utils/logger.js';

const logger = new Logger(process.env.LOG_LEVEL || 'info');

class ReservationService {
  constructor(nodeId) {
    this.nodeId = nodeId;
    this.reservations = [];
    this.nextId = 1;
  }

  /**
   * Crear una nueva reserva
   * @param {Object} data - Datos de la reserva
   * @returns {Object} Reserva creada
   */
  createReservation(data) {
    const reservation = {
      id: this.nextId++,
      ...data,
      nodeId: this.nodeId,
      status: 'active',
      createdAt: new Date()
    };

    this.reservations.push(reservation);
    logger.info(`Reserva creada en nodo ${this.nodeId}`, { reservationId: reservation.id });
    return reservation;
  }

  /**
   * Obtener todas las reservas
   * @returns {Object[]} Array de reservas
   */
  getAllReservations() {
    return this.reservations;
  }

  /**
   * Obtener una reserva por ID
   * @param {number} id - ID de la reserva
   * @returns {Object|null} Reserva encontrada o null
   */
  getReservationById(id) {
    return this.reservations.find(r => r.id === id) || null;
  }

  /**
   * Actualizar una reserva
   * @param {number} id - ID de la reserva
   * @param {Object} updates - Cambios a aplicar
   * @returns {Object|null} Reserva actualizada o null
   */
  updateReservation(id, updates) {
    const reservation = this.getReservationById(id);
    if (!reservation) return null;

    Object.assign(reservation, updates);
    logger.info(`Reserva actualizada en nodo ${this.nodeId}`, { reservationId: id });
    return reservation;
  }

  /**
   * Eliminar una reserva
   * @param {number} id - ID de la reserva
   * @returns {boolean} True si se eliminó con éxito
   */
  deleteReservation(id) {
    const index = this.reservations.findIndex(r => r.id === id);
    if (index === -1) return false;

    this.reservations.splice(index, 1);
    logger.info(`Reserva eliminada en nodo ${this.nodeId}`, { reservationId: id });
    return true;
  }

  /**
   * Obtener estadísticas del nodo
   * @returns {Object} Estadísticas
   */
  getStats() {
    return {
      nodeId: this.nodeId,
      totalReservations: this.reservations.length,
      activeReservations: this.reservations.filter(r => r.status === 'active').length,
      timestamp: new Date()
    };
  }
}

export default ReservationService;
