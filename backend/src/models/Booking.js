/**
 * Modelo de Boleto/Booking
 * Representa una reserva confirmada y comprada de un asiento
 */

export class Booking {
  constructor(bookingData) {
    this.id = bookingData.id;                       // ID único del boleto
    this.flightId = bookingData.flightId;           // ID del vuelo
    this.seatNumber = bookingData.seatNumber;       // Número del asiento
    this.passengerId = bookingData.passengerId;     // ID del pasajero
    this.passengerName = bookingData.passengerName; // Nombre del pasajero
    this.email = bookingData.email;                 // Email de contacto
    this.phoneNumber = bookingData.phoneNumber;     // Teléfono de contacto
    
    // Información financiera
    this.ticketPrice = bookingData.ticketPrice;     // Precio del boleto
    this.status = bookingData.status || 'CONFIRMED'; // CONFIRMED, CANCELLED
    
    // Fechas
    this.bookedAt = new Date();                     // Cuando se compró
    this.cancelledAt = null;                        // Cuando se canceló (si aplica)
    
    // Metadata
    this.confirmationCode = this.generateConfirmationCode();
    this.nodeId = bookingData.nodeId;               // Nodo que lo procesa
  }

  /**
   * Genera un código de confirmación único
   * @returns {string} Código de confirmación
   */
  generateConfirmationCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Cancela el boleto
   * @returns {boolean} True si se canceló exitosamente
   */
  cancel() {
    if (this.status === 'CANCELLED') {
      return false; // Ya estaba cancelado
    }
    this.status = 'CANCELLED';
    this.cancelledAt = new Date();
    return true;
  }

  /**
   * Obtiene el estado del boleto
   * @returns {Object} Información del estado
   */
  getStatus() {
    return {
      bookingId: this.id,
      confirmationCode: this.confirmationCode,
      status: this.status,
      flightId: this.flightId,
      seatNumber: this.seatNumber,
      passenger: this.passengerName,
      bookedAt: this.bookedAt,
      cancelledAt: this.cancelledAt
    };
  }

  toJSON() {
    return {
      id: this.id,
      flightId: this.flightId,
      seatNumber: this.seatNumber,
      passengerId: this.passengerId,
      passengerName: this.passengerName,
      email: this.email,
      phoneNumber: this.phoneNumber,
      ticketPrice: this.ticketPrice,
      status: this.status,
      confirmationCode: this.confirmationCode,
      bookedAt: this.bookedAt,
      cancelledAt: this.cancelledAt,
      nodeId: this.nodeId
    };
  }
}

export default Booking;
