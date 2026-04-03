/**
 * Modelo de Asiento
 * Representa un asiento individual en una aeronave
 */

import { SEAT_STATUS, SEAT_TYPES } from '../constants/seatTypes.js';

export class Seat {
  constructor(seatNumber, seatType, flightId, price = 0) {
    this.seatNumber = seatNumber;           // Ej: "1A", "12B"
    this.seatType = seatType;               // FIRST_CLASS, BUSINESS_CLASS, ECONOMY_CLASS
    this.flightId = flightId;               // ID del vuelo
    this.price = price;                     // Precio específico del asiento
    this.status = SEAT_STATUS.AVAILABLE;    // Estado actual
    this.reservedBy = null;                 // ID de usuario que lo tiene reservado (temporal)
    this.bookedBy = null;                   // ID de comprador (permanente)
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Reserva el asiento (temporal)
   * @param {number} userId - ID del usuario
   * @returns {boolean} True si se reservó exitosamente
   */
  reserve(userId) {
    if (this.status !== SEAT_STATUS.AVAILABLE) {
      return false;
    }
    this.status = SEAT_STATUS.RESERVED;
    this.reservedBy = userId;
    this.updatedAt = new Date();
    return true;
  }

  /**
   * Compra el asiento (permanente)
   * @param {number} userId - ID del comprador
   * @returns {boolean} True si se compró exitosamente
   */
  book(userId) {
    if (this.status !== SEAT_STATUS.RESERVED && this.status !== SEAT_STATUS.AVAILABLE) {
      return false;
    }
    this.status = SEAT_STATUS.BOOKED;
    this.bookedBy = userId;
    this.reservedBy = null;
    this.updatedAt = new Date();
    return true;
  }

  /**
   * Libera la reserva temporal
   * @returns {boolean} True si se liberó exitosamente
   */
  releaseReservation() {
    if (this.status !== SEAT_STATUS.RESERVED) {
      return false;
    }
    this.status = SEAT_STATUS.AVAILABLE;
    this.reservedBy = null;
    this.updatedAt = new Date();
    return true;
  }

  /**
   * Cancela la compra
   * @returns {boolean} True si se canceló exitosamente
   */
  cancelBooking() {
    if (this.status !== SEAT_STATUS.BOOKED) {
      return false;
    }
    this.status = SEAT_STATUS.AVAILABLE;
    this.bookedBy = null;
    this.updatedAt = new Date();
    return true;
  }

  /**
   * Bloquea el asiento (mantenimiento)
   */
  block() {
    this.status = SEAT_STATUS.BLOCKED;
    this.updatedAt = new Date();
  }

  /**
   * Obtiene la disponibilidad del asiento
   * @returns {boolean} True si está disponible
   */
  isAvailable() {
    return this.status === SEAT_STATUS.AVAILABLE;
  }

  toJSON() {
    return {
      seatNumber: this.seatNumber,
      seatType: this.seatType,
      flightId: this.flightId,
      price: this.price,
      status: this.status,
      reservedBy: this.reservedBy,
      bookedBy: this.bookedBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

export default Seat;
