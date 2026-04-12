/**
 * Controlador de Vuelos
 */

import Logger from '../utils/logger.js';
import { getConnection, sql } from '../config/db.js';

const logger = new Logger(process.env.LOG_LEVEL || 'info');

export class FlightController {
  constructor(flightService) {
    this.service = flightService;
  }

  /**
   * Crear nuevo vuelo
   */
  async createFlight(req, res) {
    try {
      const { flightNumber, aircraft, origin, destination, departureTime, arrivalTime, price } = req.body;

      if (!flightNumber || !aircraft || !origin || !destination || !departureTime || !arrivalTime) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos' });
      }

      const flight = this.service.createFlight({
        id: `FLIGHT_${Date.now()}_${Math.random()}`,
        flightNumber,
        aircraft,
        origin,
        destination,
        departureTime,
        arrivalTime,
        price
      });

      res.status(201).json(flight.toJSON());
    } catch (error) {
      logger.error('Error creando vuelo', { error: error.message });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Obtener todos los vuelos
   */
  async getAllFlights(req, res) {
    try {
      // Intentar obtener desde DB en vivo en lugar de memoria
      try {
          const pool = await getConnection();
          // We limit results to 300 so it doesn't overload
          const result = await pool.request().query('SELECT TOP(300) * FROM Flights'); 
          
          if (result.recordset && result.recordset.length > 0) {
              const dbFlights = result.recordset.map(r => ({
                  id: r.FlightId,
                  flightNumber: r.FlightNumber || r.FlightId,
                  origin: r.Origin,
                  destination: r.Destination,
                  departureTime: r.DepartureTime,
                  arrivalTime: r.ArrivalTime || r.DepartureTime, // fallback if missing
                  price: r.EconomyPrice,
                  status: r.Status,
                  duration: r.Duration,
                  nodeId: req.params.nodeId || 1
              }));
              return res.status(200).json(dbFlights);
          }
      } catch (e) {
          logger.error('Fallo SQL en getAllFlights, usando fallback en memoria', { error: e.message });
      }

      // Fallback
      const flights = this.service.getAllFlights();
      res.status(200).json(flights.map(f => f.toJSON()));
    } catch (error) {
      logger.error('Error obteniendo vuelos', { error: error.message });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Obtener vuelo por ID (Sincronizado con SQL Server)
   */
  async getFlightById(req, res) {
    try {
      const { flightId } = req.params;

      // Soporte dinámico para compras múltiples (Dijkstra)
      if (flightId.includes('_MULTIHOP')) {
          const parts = flightId.replace('_MULTIHOP', '').split('-');
          const origin = parts[0];
          const dest = parts[parts.length - 1];
          return res.status(200).json({
              id: flightId,
              flightNumber: `MULTI-${origin}-${dest}`,
              origin: origin,
              destination: dest,
              departureTime: "2026-04-14T08:00:00Z",
              arrivalTime: "2026-04-14T18:00:00Z",
              aircraft: "Aeronave Escalas Optimizada",
              status: "SCHEDULED",
              price: 1200,
              duration: 600,
              seats: Array.from({length: 300}, (_, i) => ({
                 seatNumber: `${Math.floor(i / 6) + 1}${String.fromCharCode(65 + (i % 6))}`,
                 class: i < 30 ? 'FIRST' : 'ECONOMY',
                 status: Math.random() > 0.8 ? 'BOOKED' : 'AVAILABLE',
                 price: i < 30 ? 2500 : 1200
             }))
          });
      }

      const flight = this.service.getFlight(flightId);

      if (!flight) {
        return res.status(404).json({ error: 'Vuelo no encontrado' });
      }

      const payload = flight.toJSONWithSeats();

      try {
         const pool = await getConnection();
         const result = await pool.request()
            .input('flightId', sql.VarChar, flightId)
            .query(`SELECT SeatNumber, Status, PricePaid FROM Tickets WHERE FlightId = @flightId`);
            
         const dbTickets = result.recordset;
         // Sincronizar estado visual desde la Base de Datos Verdadera
         for (const dbTick of dbTickets) {
             const seatIndex = payload.seats.findIndex(s => s.seatNumber === dbTick.SeatNumber);
             if (seatIndex !== -1) {
                 payload.seats[seatIndex].status = dbTick.Status;
                 payload.seats[seatIndex].price = dbTick.PricePaid; 
             }
         }
      } catch(e) {
         logger.error('Fallo al sincronizar asientos con SQL DB, usando fallback', { error: e.message });
      }

      res.status(200).json(payload);
    } catch (error) {
      logger.error('Error obteniendo vuelo', { error: error.message });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Obtener disponibilidad de un vuelo
   */
  async getAvailability(req, res) {
    try {
      const { flightId } = req.params;
      const availability = this.service.getFlightAvailability(flightId);

      if (!availability) {
        return res.status(404).json({ error: 'Vuelo no encontrado' });
      }

      res.status(200).json(availability);
    } catch (error) {
      logger.error('Error obteniendo disponibilidad', { error: error.message });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Obtener asientos disponibles de un vuelo
   */
  async getAvailableSeats(req, res) {
    try {
      const { flightId } = req.params;
      const { seatType } = req.query;

      const seats = this.service.getAvailableSeats(flightId, seatType);
      
      res.status(200).json({
        flightId,
        seatType: seatType || 'all',
        count: seats.length,
        seats
      });
    } catch (error) {
      logger.error('Error obteniendo asientos', { error: error.message });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Reservar un asiento
   */
  async reserveSeat(req, res) {
    try {
      const { flightId, seatNumber, userId } = req.body;
      const holdDuration = req.body.holdDuration || 300;

      if (!flightId || !seatNumber || !userId) {
        return res.status(400).json({ error: 'Parámetros requeridos: flightId, seatNumber, userId' });
      }

      const result = this.service.reserveSeat(flightId, seatNumber, userId, holdDuration);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      logger.error('Error reservando asiento', { error: error.message });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Comprar un asiento (crear booking)
   */
  async bookSeat(req, res) {
    try {
      const { flightId, seatNumber, passengerId, passengerName, email, phoneNumber, ticketPrice } = req.body;

      if (!flightId || !seatNumber || !passengerId || !passengerName) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos' });
      }

      const booking = this.service.bookSeat({
        flightId,
        seatNumber,
        passengerId,
        passengerName,
        email,
        phoneNumber,
        ticketPrice: ticketPrice || 1000
      });

      if (!booking) {
        return res.status(400).json({ error: 'No se puede comprar el asiento' });
      }

      res.status(201).json(booking.toJSON());
    } catch (error) {
      logger.error('Error comprando asiento', { error: error.message });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Obtener booking
   */
  async getBooking(req, res) {
    try {
      const { bookingId } = req.params;
      const booking = this.service.getBooking(parseInt(bookingId));

      if (!booking) {
        return res.status(404).json({ error: 'Boleto no encontrado' });
      }

      res.status(200).json(booking.toJSON());
    } catch (error) {
      logger.error('Error obteniendo booking', { error: error.message });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Obtener bookings de un pasajero
   */
  async getPassengerBookings(req, res) {
    try {
      const { passengerId } = req.params;
      const bookings = this.service.getPassengerBookings(parseInt(passengerId));

      res.status(200).json({
        passengerId,
        count: bookings.length,
        bookings: bookings.map(b => b.toJSON())
      });
    } catch (error) {
      logger.error('Error obteniendo bookings', { error: error.message });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Cancelar booking
   */
  async cancelBooking(req, res) {
    try {
      const { bookingId } = req.params;
      const result = this.service.cancelBooking(parseInt(bookingId));

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      logger.error('Error cancelando booking', { error: error.message });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Actualizar estado del vuelo
   */
  async updateFlightStatus(req, res) {
    try {
      const { flightId } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ error: 'Estado requerido' });
      }

      const result = this.service.updateFlightStatus(flightId, status);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      logger.error('Error actualizando estado', { error: error.message });
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

export default FlightController;
