/**
 * Modelo de Vuelo
 * Representa un vuelo en específico con ruta, horarios y asientos
 */

import { FLIGHT_STATES } from '../constants/flightStates.js';
import { Seat } from './Seat.js';
import { SEAT_TYPES, SEATS_PER_TYPE } from '../constants/seatTypes.js';

export class Flight {
  constructor(flightData) {
    this.id = flightData.id;                           // Código único del vuelo
    this.flightNumber = flightData.flightNumber;       // Número de vuelo (ej: AA123)
    this.aircraft = flightData.aircraft;               // Tipo de aeronave (ej: Boeing 777)

    // Rutas y horarios
    this.origin = flightData.origin;                   // Código aeropuerto origen (ej: JFK)
    this.destination = flightData.destination;         // Código aeropuerto destino (ej: LAX)
    this.departureTime = flightData.departureTime;     // Hora de despegue
    this.arrivalTime = flightData.arrivalTime;         // Hora de llegada estimada

    // Estado actual
    this.status = FLIGHT_STATES.SCHEDULED;             // Estado inicial
    this.price = flightData.price || 1000;             // Precio base base (Economy)
    this.firstClassPrice = flightData.firstClassPrice || Math.round(this.price * 2.5);
    this.duration = flightData.duration || 120; // Duracion en minutos

    // Asientos - se inicializan vacíos
    this.seats = {};                                   // { seatNumber: Seat }
    this.initializeSeats();

    // Metadata
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.nodeId = flightData.nodeId;                   // Nodo que lo gestiona
  }

  /**
   * Inicializa los asientos del vuelo
   */
  initializeSeats() {
    this.seats = {};
    let firstSeats = 10;
    let economySeats = 150; // Fallback generico
    
    // Aeronave 1: Airbus A380-800
    if (this.aircraft === 'Aeronave 1') { firstSeats = 10; economySeats = 439; }
    // Aeronave 2: Boeing 777-300ER
    else if (this.aircraft === 'Aeronave 2') { firstSeats = 10; economySeats = 300; }
    // Aeronave 3: Airbus A350-900
    else if (this.aircraft === 'Aeronave 3') { firstSeats = 12; economySeats = 250; }
    // Aeronave 4: Boeing 787-9 Dreamliner
    else if (this.aircraft === 'Aeronave 4') { firstSeats = 8; economySeats = 220; }
    // Nodos Intermedios / Phantom
    else if (this.aircraft.includes('Phantom') || this.aircraft.includes('Escalas')) { firstSeats = 8; economySeats = 220; }

    // Generar Primera Clase
    for (let i = 0; i < firstSeats; i++) {
      const row = String.fromCharCode(65 + (i % 4));  // A, B, C, D
      const seatId = `${Math.floor(i / 4) + 1}${row}`;
      this.seats[seatId] = new Seat(seatId, SEAT_TYPES.FIRST_CLASS, this.id, this.firstClassPrice);
    }

    // Generar Case Turística
    for (let i = 0; i < economySeats; i++) {
      const row = String.fromCharCode(65 + (i % 6));  // A-F
      const seatId = `${Math.floor(i / 6) + 5}${row}`; // Empieza en fila 5
      this.seats[seatId] = new Seat(seatId, SEAT_TYPES.ECONOMY_CLASS, this.id, this.price);
    }
  }

  /**
   * Obtiene la disponibilidad global del vuelo
   * @returns {Object} Estadísticas de disponibilidad
   */
  getAvailability() {
    const stats = {
      total: Object.keys(this.seats).length,
      available: 0,
      reserved: 0,
      booked: 0,
      blocked: 0,
      byType: {
        FIRST_CLASS: { total: 0, available: 0, reserved: 0, booked: 0 },
        BUSINESS_CLASS: { total: 0, available: 0, reserved: 0, booked: 0 },
        ECONOMY_CLASS: { total: 0, available: 0, reserved: 0, booked: 0 }
      }
    };

    Object.values(this.seats).forEach(seat => {
      const typeStats = stats.byType[seat.seatType];
      typeStats.total++;

      switch (seat.status) {
        case 'AVAILABLE':
          stats.available++;
          typeStats.available++;
          break;
        case 'RESERVED':
          stats.reserved++;
          typeStats.reserved++;
          break;
        case 'BOOKED':
          stats.booked++;
          typeStats.booked++;
          break;
        case 'BLOCKED':
          stats.blocked++;
          break;
      }
    });

    return stats;
  }

  /**
   * Obtiene todos los asientos disponibles
   * @param {string} seatType - Tipo de asiento (opcional)
   * @returns {Seat[]} Array de asientos disponibles
   */
  getAvailableSeats(seatType = null) {
    return Object.values(this.seats).filter(seat => {
      const typeMatch = !seatType || seat.seatType === seatType;
      return seat.isAvailable() && typeMatch;
    });
  }

  /**
   * Obtiene un asiento específico
   * @param {string} seatNumber - Número del asiento
   * @returns {Seat|null} Asiento o null si no existe
   */
  getSeat(seatNumber) {
    return this.seats[seatNumber] || null;
  }

  /**
   * Obtiene todos los asientos del vuelo
   * @returns {Seat[]} Array de todos los asientos
   */
  getAllSeats() {
    return Object.values(this.seats);
  }

  /**
   * Actualiza el estado del vuelo
   * @param {string} newStatus - Nuevo estado
   * @returns {boolean} True si se actualizó exitosamente
   */
  updateStatus(newStatus) {
    if (!Object.values(FLIGHT_STATES).includes(newStatus)) {
      return false;
    }
    this.status = newStatus;
    this.updatedAt = new Date();
    return true;
  }

  toJSON() {
    return {
      id: this.id,
      flightNumber: this.flightNumber,
      aircraft: this.aircraft,
      origin: this.origin,
      destination: this.destination,
      departureTime: this.departureTime,
      arrivalTime: this.arrivalTime,
      status: this.status,
      price: this.price,
      availability: this.getAvailability(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      nodeId: this.nodeId
    };
  }

  toJSONWithSeats() {
    return {
      ...this.toJSON(),
      seats: Object.entries(this.seats).map(([num, seat]) => ({
        seatNumber: seat.seatNumber,
        seatType: seat.seatType,
        status: seat.status,
        price: seat.price
      }))
    };
  }
}

export default Flight;
