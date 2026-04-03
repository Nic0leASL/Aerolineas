/**
 * Servicio de Vuelos
 * Maneja la lógica de negocio para vuelos, asientos y boletos
 */

import Logger from '../utils/logger.js';
import { Flight } from '../models/Flight.js';
import { Booking } from '../models/Booking.js';
import { FLIGHT_STATES, isValidTransition } from '../constants/flightStates.js';

const logger = new Logger(process.env.LOG_LEVEL || 'info');

class FlightService {
  constructor(nodeId) {
    this.nodeId = nodeId;
    this.flights = {};              // { flightId: Flight }
    this.bookings = [];             // Array de Booking
    this.nextBookingId = 1;
    this.reservationTimeouts = {};  // Timeouts para reservas temporales
  }

  /**
   * Crea un nuevo vuelo
   * @param {Object} flightData - Datos del vuelo
   * @returns {Flight} Vuelo creado
   */
  createFlight(flightData) {
    const flight = new Flight({
      ...flightData,
      nodeId: this.nodeId
    });
    
    this.flights[flight.id] = flight;
    logger.info(`Vuelo creado en nodo ${this.nodeId}`, { flightId: flight.id });
    return flight;
  }

  /**
   * Obtiene un vuelo por ID
   * @param {string} flightId - ID del vuelo
   * @returns {Flight|null} El vuelo o null
   */
  getFlight(flightId) {
    return this.flights[flightId] || null;
  }

  /**
   * Obtiene todos los vuelos
   * @returns {Flight[]} Array de vuelos
   */
  getAllFlights() {
    return Object.values(this.flights);
  }

  /**
   * Obtiene disponibilidad de un vuelo
   * @param {string} flightId - ID del vuelo
   * @returns {Object|null} Disponibilidad del vuelo o null
   */
  getFlightAvailability(flightId) {
    const flight = this.getFlight(flightId);
    if (!flight) return null;
    return flight.getAvailability();
  }

  /**
   * Obtiene asientos disponibles de un vuelo
   * @param {string} flightId - ID del vuelo
   * @param {string} seatType - Tipo de asiento (opcional)
   * @returns {Array} Array de asientos disponibles
   */
  getAvailableSeats(flightId, seatType = null) {
    const flight = this.getFlight(flightId);
    if (!flight) return [];
    
    const seats = flight.getAvailableSeats(seatType);
    return seats.map(seat => ({
      seatNumber: seat.seatNumber,
      seatType: seat.seatType,
      status: seat.status
    }));
  }

  /**
   * Reserva un asiento temporal (hold)
   * @param {string} flightId - ID del vuelo
   * @param {string} seatNumber - Número del asiento
   * @param {number} userId - ID del usuario
   * @param {number} holdDuration - Duración de la reserva en segundos
   * @returns {Object} Resultado de la reserva
   */
  reserveSeat(flightId, seatNumber, userId, holdDuration = 300) {
    const flight = this.getFlight(flightId);
    if (!flight) {
      return { success: false, message: 'Vuelo no encontrado' };
    }

    const seat = flight.getSeat(seatNumber);
    if (!seat) {
      return { success: false, message: 'Asiento no encontrado' };
    }

    if (!seat.reserve(userId)) {
      return { success: false, message: 'Asiento no disponible' };
    }

    logger.info(`Asiento reservado`, { 
      flightId, 
      seatNumber, 
      userId, 
      nodeId: this.nodeId 
    });

    // Establecer timeout para liberar la reserva si no se compra
    const timeoutId = setTimeout(() => {
      seat.releaseReservation();
      logger.info(`Reserva expirada - asiento liberado`, { flightId, seatNumber });
    }, holdDuration * 1000);

    this.reservationTimeouts[`${flightId}-${seatNumber}`] = timeoutId;

    return { 
      success: true, 
      message: 'Asiento reservado exitosamente',
      holdExpiresIn: holdDuration
    };
  }

  /**
   * Compra un asiento (crea booking)
   * @param {Object} bookingData - Datos del boleto
   * @returns {Booking|null} Boleto creado o null
   */
  bookSeat(bookingData) {
    const flight = this.getFlight(bookingData.flightId);
    if (!flight) {
      logger.error('Vuelo no encontrado', { flightId: bookingData.flightId });
      return null;
    }

    const seat = flight.getSeat(bookingData.seatNumber);
    if (!seat || !seat.book(bookingData.passengerId)) {
      logger.error('No se puede comprar el asiento', { 
        flightId: bookingData.flightId,
        seatNumber: bookingData.seatNumber
      });
      return null;
    }

    // Crear booking
    const booking = new Booking({
      id: this.nextBookingId++,
      ...bookingData,
      nodeId: this.nodeId
    });

    this.bookings.push(booking);

    // Limpiar timeout de reserva si existe
    const timeoutKey = `${bookingData.flightId}-${bookingData.seatNumber}`;
    if (this.reservationTimeouts[timeoutKey]) {
      clearTimeout(this.reservationTimeouts[timeoutKey]);
      delete this.reservationTimeouts[timeoutKey];
    }

    logger.info(`Boleto comprado`, { 
      bookingId: booking.id,
      confirmationCode: booking.confirmationCode,
      nodeId: this.nodeId
    });

    return booking;
  }

  /**
   * Obtiene un booking por ID
   * @param {number} bookingId - ID del booking
   * @returns {Booking|null} El booking o null
   */
  getBooking(bookingId) {
    return this.bookings.find(b => b.id === bookingId) || null;
  }

  /**
   * Obtiene bookings de un pasajero
   * @param {number} passengerId - ID del pasajero
   * @returns {Booking[]} Array de bookings
   */
  getPassengerBookings(passengerId) {
    return this.bookings.filter(b => b.passengerId === passengerId);
  }

  /**
   * Cancela un booking
   * @param {number} bookingId - ID del booking
   * @returns {Object} Resultado de la cancelación
   */
  cancelBooking(bookingId) {
    const booking = this.getBooking(bookingId);
    if (!booking) {
      return { success: false, message: 'Boleto no encontrado' };
    }

    if (booking.status === 'CANCELLED') {
      return { success: false, message: 'El boleto ya está cancelado' };
    }

    // Validar que la cancelación sea posible
    const flight = this.getFlight(booking.flightId);
    if (!flight) {
      return { success: false, message: 'Vuelo no encontrado' };
    }

    // Solo se puede cancelar si el vuelo aún no ha despegado
    if ([FLIGHT_STATES.DEPARTED, FLIGHT_STATES.IN_FLIGHT, 
         FLIGHT_STATES.LANDED, FLIGHT_STATES.ARRIVED].includes(flight.status)) {
      return { success: false, message: 'No se puede cancelar después del despegue' };
    }

    booking.cancel();
    const seat = flight.getSeat(booking.seatNumber);
    if (seat) {
      seat.cancelBooking();
    }

    logger.info(`Boleto cancelado`, { 
      bookingId,
      nodeId: this.nodeId
    });

    return { 
      success: true, 
      message: 'Boleto cancelado exitosamente',
      refund: booking.ticketPrice
    };
  }

  /**
   * Actualiza el estado de un vuelo
   * @param {string} flightId - ID del vuelo
   * @param {string} newStatus - Nuevo estado
   * @returns {Object} Resultado de la actualización
   */
  updateFlightStatus(flightId, newStatus) {
    const flight = this.getFlight(flightId);
    if (!flight) {
      return { success: false, message: 'Vuelo no encontrado' };
    }

    if (!isValidTransition(flight.status, newStatus)) {
      return { 
        success: false, 
        message: `Transición inválida de ${flight.status} a ${newStatus}` 
      };
    }

    flight.updateStatus(newStatus);
    logger.info(`Estado de vuelo actualizado`, { 
      flightId, 
      newStatus,
      nodeId: this.nodeId 
    });

    return { 
      success: true, 
      message: 'Estado actualizado exitosamente',
      oldStatus: flight.status,
      newStatus: newStatus
    };
  }

  /**
   * Obtiene estadísticas del nodo
   * @returns {Object} Estadísticas
   */
  getStats() {
    return {
      nodeId: this.nodeId,
      totalFlights: Object.keys(this.flights).length,
      totalBookings: this.bookings.length,
      activeReservations: Object.keys(this.reservationTimeouts).length,
      timestamp: new Date()
    };
  }
}

export default FlightService;
