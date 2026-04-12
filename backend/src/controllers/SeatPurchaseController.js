/**
 * Controlador de Compra de Boletos
 * Maneja la lógica de compra definitiva de asientos en vuelos
 */

import Logger from '../utils/logger.js';
import { getConnection, sql } from '../config/db.js';

const logger = new Logger(process.env.LOG_LEVEL || 'info');

export class SeatPurchaseController {
  constructor(flightService, nodeId) {
    this.flightService = flightService;
    this.nodeId = nodeId;
    this.purchaseLog = [];  // Log de eventos de compras
    this.revenueByType = {  // Ingresos por tipo de asiento
      FIRST_CLASS: 0,
      BUSINESS_CLASS: 0,
      ECONOMY_CLASS: 0
    };
    this.lamportClock = null;
    this.eventSyncService = null;
    this.vectorClock = null;
    this.conflictDetectionService = null;
    this.auditService = null;
  }

  /**
   * Inyectar servicio de reloj Lamport
   */
  setLamportClock(lamportClock) {
    this.lamportClock = lamportClock;
  }

  /**
   * Inyectar Vector Clock
   */
  setVectorClock(vectorClock) {
    this.vectorClock = vectorClock;
  }

  /**
   * Inyectar servicio de sincronización de eventos
   */
  setEventSyncService(eventSyncService) {
    this.eventSyncService = eventSyncService;
  }

  /**
   * Inyectar servicio de detección de conflictos
   */
  setConflictDetectionService(conflictDetectionService) {
    this.conflictDetectionService = conflictDetectionService;
  }

  /**
   * Inyectar servicio de auditoría
   */
  setAuditService(auditService) {
    this.auditService = auditService;
  }

  /**
   * Comprar un asiento (transacción definitiva)
   * POST /comprar
   * @param {Request} req - Request con flightId, seatNumber, passengerId, passengerName, email, phoneNumber
   * @param {Response} res - Response
   */
  async purchaseSeat(req, res) {
    try {
      const {
        flightId,
        seatNumber,
        passengerId,
        passengerName,
        email,
        phoneNumber
      } = req.body;

      // Validar parámetros requeridos
      if (!flightId || !seatNumber || !passengerId || !passengerName || !email) {
        return res.status(400).json({
          success: false,
          error: 'Parámetros requeridos: flightId, seatNumber, passengerId, passengerName, email',
          nodeId: this.nodeId
        });
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Email inválido',
          nodeId: this.nodeId
        });
      }

      // Obtener vuelo
      let flight = this.flightService.getFlight(flightId);
      let seat = flight ? flight.getSeat(seatNumber) : null;

      // Soporte dinámico para compras múltiples (Dijkstra) vía Vuelo Virtual
      if (!flight && flightId.includes('_MULTIHOP')) {
          flight = { id: flightId, price: 1500, getSeat: () => seat };
          seat = { 
              seatNumber: seatNumber, 
              status: 'AVAILABLE', 
              seatType: seatNumber.includes('A') || seatNumber.includes('B') ? 'FIRST_CLASS' : 'ECONOMY_CLASS', 
              price: 1500 
          };
      }

      if (!flight) {
        return res.status(404).json({
          success: false,
          error: 'Vuelo no encontrado',
          flightId: flightId,
          nodeId: this.nodeId
        });
      }

      if (!seat) {
        return res.status(404).json({
          success: false,
          error: 'Asiento no encontrado en este vuelo',
          flightId: flightId,
          seatNumber: seatNumber,
          nodeId: this.nodeId
        });
      }

      // Validar que el asiento sea comprable (AVAILABLE o RESERVED)
      if (seat.status !== 'AVAILABLE' && seat.status !== 'RESERVED') {
        return res.status(409).json({
          success: false,
          error: 'Asiento no disponible para compra',
          flightId: flightId,
          seatNumber: seatNumber,
          currentStatus: seat.status,
          nodeId: this.nodeId
        });
      }

      // Calcular precio basado en tipo de asiento
      const ticketPrice = seat.price || flight.price; // Usar el precio seteado durante la creación del asiento

      // Crear datos de compra
      const bookingData = {
        flightId: flightId,
        seatNumber: seatNumber,
        passengerId: passengerId,
        passengerName: passengerName,
        email: email,
        phoneNumber: phoneNumber || null,
        ticketPrice: ticketPrice
      };

      // Intentar hacer la compra
      let booking = null;
      let transaction = null;

      try {
          const pool = await getConnection();
          transaction = new sql.Transaction(pool);
          
          await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
          const request = new sql.Request(transaction);

          // 1. Verificación Fuerte de SQL Server con Bloqueo Exclusivo (UPDLOCK)
          const checkStatus = await request.query(`
              SELECT Status FROM Tickets WITH (UPDLOCK, SERIALIZABLE)
              WHERE FlightId = '${flightId}' AND SeatNumber = '${seatNumber}'
          `);

          if (checkStatus.recordset.length > 0 && checkStatus.recordset[0].Status === 'BOOKED') {
              throw new Error('Doble reserva evitada (SQL Server Reject)');
          }

          // 2. Insertar Pasajero en tabla Persons si no existe
          let personResult = await request.query(`SELECT PersonId FROM Persons WHERE PassportNumber = '${passengerId}'`);
          let personId;
          
          if (personResult.recordset.length === 0) {
              const insertPerson = await request.query(`
                  INSERT INTO Persons (PassportNumber, FullName, Email)
                  OUTPUT INSERTED.PersonId
                  VALUES ('${passengerId}', '${passengerName}', '${email}')
              `);
              personId = insertPerson.recordset[0].PersonId;
          } else {
              personId = personResult.recordset[0].PersonId;
          }

          // 3. Gestionar Vuelo Virtual MULTIHOP en la Base de Datos para evitar Foreign Key Constraint Error
          if (flightId.includes("_MULTIHOP")) {
              const flightCheck = await request.query(`SELECT FlightId FROM Flights WHERE FlightId = '${flightId}'`);
              if (flightCheck.recordset.length === 0) {
                  await request.query(`
                      INSERT INTO Flights (FlightId, AircraftId, Origin, Destination, DepartureTime, ArrivalTime, Duration, FirstClassPrice, EconomyPrice, Status)
                      VALUES ('${flightId}', 1, 'VIRT', 'UAL', GETDATE(), GETDATE(), 0, 1500, 1200, 'SCHEDULED')
                  `);
              }
          }

          // 4. Inserción (Generación de clave identidad Tickets ocurrirá con Salto de Llave por DB Schema)
          await request.query(`
              INSERT INTO Tickets (FlightId, PersonId, SeatNumber, SeatClass, PricePaid, Status, PurchaseNode)
              VALUES ('${flightId}', ${personId}, '${seatNumber}', '${seat.seatType || 'ECONOMY_CLASS'}', ${ticketPrice}, 'BOOKED', 'DYNAMIC_MULTINODE')
          `);

          await transaction.commit();
          
          booking = {
              id: Date.now(), 
              confirmationCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
              bookedAt: new Date().toISOString()
          };
          
          // Opcionalmente actualizar el simulador Legacy de Ram (mantener logica original estable)
          this.flightService.bookSeat(bookingData);

      } catch (err) {
          if (transaction) {
               try { await transaction.rollback(); } catch(e) {}
          }
          logger.error('Transacción SQL rechazada por Control de Concurrencia', { error: err.message });
          return res.status(409).json({
              success: false,
              error: 'Concurrencia rechazada por BDD: Otro nodo compró o reservó este asiento simultáneamente (Prioridad C en CAP).',
              flightId: flightId,
              seatNumber: seatNumber,
              nodeId: this.nodeId
          });
      }

      // Actualizar ingresos
      this.revenueByType[seat.seatType] += ticketPrice;

      // Registrar evento de compra
      const purchaseEvent = {
        id: `PURCHASE_${Date.now()}_${Math.random()}`,
        timestamp: new Date().toISOString(),
        nodeId: this.nodeId,
        bookingId: booking.id,
        confirmationCode: booking.confirmationCode,
        flightId: flightId,
        seatNumber: seatNumber,
        seatType: seat.seatType,
        passengerId: passengerId,
        passengerName: passengerName,
        ticketPrice: ticketPrice,
        action: 'PURCHASE',
        status: 'SUCCESS'
      };

      // Obtener marca Lamport y Vector Clock
      let lamportMark = null;
      let vectorClock = null;
      if (this.lamportClock) {
        lamportMark = this.lamportClock.getLocalMark();
        purchaseEvent.lamportClock = lamportMark;
        this.lamportClock.recordEvent(purchaseEvent, lamportMark, 'LOCAL');
      }

      if (this.vectorClock) {
        vectorClock = this.vectorClock.getLocalMark();
        purchaseEvent.vectorClock = vectorClock;
        this.vectorClock.recordEvent(purchaseEvent, vectorClock, 'LOCAL');
      }

      // TICKET #9: Detectar conflictos de compra
      const conflictDetection = this.conflictDetectionService
        ? this.conflictDetectionService.detectConflict(purchaseEvent)
        : { isConflict: false };

      if (conflictDetection.isConflict) {
        logger.warn('CONFLICTO DETECTADO EN COMPRA', {
          flightId,
          seatNumber,
          nodeId: this.nodeId,
          conflictingEvents: conflictDetection.conflictingEvents.length,
          resolution: conflictDetection.resolution,
          winner: conflictDetection.winner
        });

        // Revertir la compra que acabamos de hacer
        this.flightService.cancelBooking(flightId, seatNumber);

        return res.status(409).json({
          success: false,
          error: 'Conflicto de concurrencia: Otro nodo compró este asiento simultáneamente',
          flightId: flightId,
          seatNumber: seatNumber,
          conflictDetails: {
            conflictingNodesCount: conflictDetection.conflictingEvents.length,
            winnerNodeId: conflictDetection.winner,
            resolution: conflictDetection.resolution,
            reason: conflictDetection.reason
          },
          nodeId: this.nodeId,
          shouldRetry: conflictDetection.winner === this.nodeId
        });
      }

      // Registrar operación en historial de conflictos si está disponible
      if (this.conflictDetectionService) {
        this.conflictDetectionService.registerOperation(purchaseEvent);
      }

      // Broadcast a otros nodos
      if (this.eventSyncService) {
        this.eventSyncService.broadcastEvent(purchaseEvent, lamportMark, vectorClock);
      }

      this.purchaseLog.push(purchaseEvent);

      logger.info('Boleto vendido con éxito', {
        bookingId: booking.id,
        confirmationCode: booking.confirmationCode,
        flightId,
        seatNumber,
        passengerId,
        ticketPrice,
        nodeId: this.nodeId,
        lamportMark,
        vectorClock: vectorClock ? `[${vectorClock.join(',')}]` : null
      });

      // Retornar respuesta exitosa
      return res.status(201).json({
        success: true,
        message: 'Boleto comprado exitosamente',
        data: {
          bookingId: booking.id,
          confirmationCode: booking.confirmationCode,
          flightId: flightId,
          seatNumber: seatNumber,
          seatType: seat.seatType,
          passengerId: passengerId,
          passengerName: passengerName,
          email: email,
          phoneNumber: phoneNumber,
          ticketPrice: ticketPrice,
          status: seat.status,
          bookedAt: booking.bookedAt,
          nodeId: this.nodeId
        }
      });
    } catch (error) {
      logger.error('Error al comprar boleto', { error: error.message });
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        nodeId: this.nodeId
      });
    }
  }

  /**
   * Obtener información de un boleto
   * GET /comprar/boleto/:bookingId
   */
  async getBooking(req, res) {
    try {
      const { bookingId } = req.params;

      const booking = this.flightService.getBooking(parseInt(bookingId));
      if (!booking) {
        return res.status(404).json({
          success: false,
          error: 'Boleto no encontrado',
          bookingId: bookingId,
          nodeId: this.nodeId
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          ...booking.toJSON(),
          nodeId: this.nodeId
        }
      });
    } catch (error) {
      logger.error('Error al obtener boleto', { error: error.message });
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        nodeId: this.nodeId
      });
    }
  }

  /**
   * Obtener boletos de un pasajero
   * GET /comprar/pasajero/:passengerId
   */
  async getPassengerBookings(req, res) {
    try {
      const { passengerId } = req.params;
      const { status = null } = req.query;

      let bookings = this.flightService.getPassengerBookings(passengerId);

      // Filtrar por estado si se proporciona
      if (status) {
        bookings = bookings.filter(b => b.status === status);
      }

      return res.status(200).json({
        success: true,
        count: bookings.length,
        passengerId: passengerId,
        nodeId: this.nodeId,
        bookings: bookings.map(b => b.toJSON())
      });
    } catch (error) {
      logger.error('Error al obtener boletos del pasajero', { error: error.message });
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        nodeId: this.nodeId
      });
    }
  }

  /**
   * Cancelar un boleto
   * DELETE /comprar/boleto/:bookingId
   */
  async cancelBooking(req, res) {
    try {
      const { bookingId } = req.params;

      const result = this.flightService.cancelBooking(parseInt(bookingId));

      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: result.message,
          bookingId: bookingId,
          nodeId: this.nodeId
        });
      }

      // Registrar evento de cancelación
      const cancelEvent = {
        id: `CANCEL_${Date.now()}_${Math.random()}`,
        timestamp: new Date().toISOString(),
        nodeId: this.nodeId,
        bookingId: bookingId,
        action: 'CANCEL',
        status: 'SUCCESS'
      };

      // Obtener marca Lamport y Vector Clock, adjuntarlos al evento
      if (this.lamportClock) {
        const lamportMark = this.lamportClock.getLocalMark();
        cancelEvent.lamportClock = lamportMark;
        this.lamportClock.recordEvent(cancelEvent, lamportMark, 'LOCAL');

        let vectorClock = null;
        if (this.vectorClock) {
          vectorClock = this.vectorClock.getLocalMark();
          cancelEvent.vectorClock = vectorClock;
          this.vectorClock.recordEvent(cancelEvent, vectorClock, 'LOCAL');
        }

        // Broadcast a otros nodos
        if (this.eventSyncService) {
          this.eventSyncService.broadcastEvent(cancelEvent, lamportMark, vectorClock);
        }
      }

      this.purchaseLog.push(cancelEvent);

      logger.info('Boleto cancelado', {
        bookingId,
        nodeId: this.nodeId
      });

      return res.status(200).json({
        success: true,
        message: 'Boleto cancelado exitosamente',
        data: {
          bookingId: bookingId,
          status: 'CANCELLED',
          cancelledAt: new Date().toISOString(),
          nodeId: this.nodeId
        }
      });
    } catch (error) {
      logger.error('Error al cancelar boleto', { error: error.message });
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        nodeId: this.nodeId
      });
    }
  }

  /**
   * Obtener historial de compras del nodo
   * GET /comprar/eventos
   */
  async getPurchaseEvents(req, res) {
    try {
      const { flightId, passengerId, limit = 100 } = req.query;

      let events = this.purchaseLog;

      // Filtrar por flightId si se proporciona
      if (flightId) {
        events = events.filter(e => e.flightId === flightId);
      }

      // Filtrar por passengerId si se proporciona
      if (passengerId) {
        events = events.filter(e => e.passengerId === passengerId);
      }

      // Limitar resultados
      const limitNum = Math.min(parseInt(limit) || 100, 1000);
      events = events.slice(-limitNum);

      return res.status(200).json({
        success: true,
        count: events.length,
        nodeId: this.nodeId,
        events: events
      });
    } catch (error) {
      logger.error('Error al obtener eventos de compra', { error: error.message });
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        nodeId: this.nodeId
      });
    }
  }

  /**
   * Obtener ingresos por tipo de asiento
   * GET /comprar/ingresos
   */
  async getRevenue(req, res) {
    try {
      const total = Object.values(this.revenueByType).reduce((a, b) => a + b, 0);

      return res.status(200).json({
        success: true,
        nodeId: this.nodeId,
        revenue: {
          total: total,
          byType: this.revenueByType,
          currency: 'USD'
        },
        totalPurchases: this.purchaseLog.filter(e => e.action === 'PURCHASE').length,
        totalCancellations: this.purchaseLog.filter(e => e.action === 'CANCEL').length
      });
    } catch (error) {
      logger.error('Error al calcular ingresos', { error: error.message });
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        nodeId: this.nodeId
      });
    }
  }

  /**
   * Obtener estadísticas de compras del nodo
   * GET /comprar/stats
   */
  async getStats(req, res) {
    try {
      const stats = {
        nodeId: this.nodeId,
        totalPurchaseEvents: this.purchaseLog.length,
        purchasesByAction: {
          PURCHASE: this.purchaseLog.filter(e => e.action === 'PURCHASE').length,
          CANCEL: this.purchaseLog.filter(e => e.action === 'CANCEL').length
        },
        successfulPurchases: this.purchaseLog.filter(e => e.status === 'SUCCESS').length,
        totalRevenue: Object.values(this.revenueByType).reduce((a, b) => a + b, 0),
        revenueByType: this.revenueByType,
        totalBookings: this.flightService.bookings.length
      };

      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error al obtener estadísticas', { error: error.message });
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        nodeId: this.nodeId
      });
    }
  }
}

export default SeatPurchaseController;
