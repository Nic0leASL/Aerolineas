/**
 * Modelo Mongoose para Tickets/Boletos
 * Replicación de datos transaccionales a MongoDB (Nodo América)
 * Garantiza que MongoDB tenga copia de todos los datos de SQL Server
 */

import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  // Identificadores
  flightId: { type: String, required: true, index: true },
  seatNumber: { type: String, required: true },
  confirmationCode: { type: String, unique: true, sparse: true },

  // Pasajero
  passengerId: { type: String, required: true, index: true },
  passengerName: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, default: null },

  // Detalles del asiento
  seatType: { type: String, enum: ['FIRST_CLASS', 'ECONOMY_CLASS'], required: true },
  price: { type: Number, required: true },

  // Estado
  status: { 
    type: String, 
    enum: ['BOOKED', 'RESERVED', 'CANCELLED', 'REFUNDED'], 
    required: true,
    index: true
  },

  // Datos del vuelo (desnormalizado para consultas rápidas)
  origin: { type: String },
  destination: { type: String },
  departureTime: { type: String },

  // Sincronización distribuida
  sourceNode: { type: Number, required: true }, // Nodo que originó la operación
  purchaseNode: { type: String, default: 'AMERICA' },
  lamportMark: { type: Number },
  vectorClock: { type: String },
  sqlPersisted: { type: Boolean, default: false },

  // Auditoría
  bookedAt: { type: Date, default: Date.now },
  cancelledAt: { type: Date }
}, {
  timestamps: true
});

// Índice compuesto para evitar doble reserva en Mongo también
ticketSchema.index({ flightId: 1, seatNumber: 1 }, { unique: true });

export const Ticket = mongoose.model('Ticket', ticketSchema);
export default Ticket;
