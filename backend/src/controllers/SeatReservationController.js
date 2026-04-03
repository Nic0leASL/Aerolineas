/**
 * Controlador de Reserva de Asientos
 * Maneja la lógica de reserva temporal de asientos en vuelos
 */

import Logger from '../utils/logger.js';

const logger = new Logger(process.env.LOG_LEVEL || 'info');

export class SeatReservationController {
  constructor(flightService, nodeId) {
    this.flightService = flightService;
    this.nodeId = nodeId;
    this.reservationLog = [];  // Log de eventos de reservas
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
   * Inyectar servicio de sincronización de eventos
   */
  setEventSyncService(eventSyncService) {
    this.eventSyncService = eventSyncService;
  }

  /**
   * Inyectar Vector Clock
   */
  setVectorClock(vectorClock) {
    this.vectorClock = vectorClock;
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
   * Reservar un asiento temporalmente
   * POST /reservar
   * @param {Request} req - Request con flightId, seatNumber, userId, holdDuration
   * @param {Response} res - Response
   */
  async reserveSeat(req, res) {
    try {
      const { flightId, seatNumber, userId, holdDuration = 300 } = req.body;

      // Validar parámetros requeridos
      if (!flightId || !seatNumber || !userId) {
        return res.status(400).json({
          success: false,
          error: 'Parámetros requeridos: flightId, seatNumber, userId',
          nodeId: this.nodeId
        });
      }

      // Validar que holdDuration sea un número válido
      const duration = parseInt(holdDuration);
      if (isNaN(duration) || duration <= 0) {
        return res.status(400).json({
          success: false,
          error: 'holdDuration debe ser un número positivo (segundos)',
          nodeId: this.nodeId
        });
      }

      // Obtener vuelo
      const flight = this.flightService.getFlight(flightId);
      if (!flight) {
        return res.status(404).json({
          success: false,
          error: 'Vuelo no encontrado',
          flightId: flightId,
          nodeId: this.nodeId
        });
      }

      // Obtener asiento
      const seat = flight.getSeat(seatNumber);
      if (!seat) {
        return res.status(404).json({
          success: false,
          error: 'Asiento no encontrado en este vuelo',
          flightId: flightId,
          seatNumber: seatNumber,
          nodeId: this.nodeId
        });
      }

      // Validar que el asiento esté disponible
      if (!seat.isAvailable()) {
        return res.status(409).json({
          success: false,
          error: 'Asiento no disponible',
          flightId: flightId,
          seatNumber: seatNumber,
          currentStatus: seat.status,
          nodeId: this.nodeId
        });
      }

      // Intentar reservar el asiento
      const reserveResult = this.flightService.reserveSeat(
        flightId,
        seatNumber,
        userId,
        duration
      );

      if (!reserveResult.success) {
        return res.status(409).json({
          success: false,
          error: reserveResult.message,
          flightId: flightId,
          seatNumber: seatNumber,
          nodeId: this.nodeId
        });
      }

      // Crear evento de reserva con timestamps y clocks
      const reservationEvent = {
        id: `RES_${Date.now()}_${Math.random()}`,
        timestamp: new Date().toISOString(),
        nodeId: this.nodeId,
        flightId: flightId,
        seatNumber: seatNumber,
        userId: userId,
        seatType: seat.seatType,
        action: 'RESERVE',
        holdDuration: duration,
        status: 'SUCCESS'
      };

      // Obtener marca Lamport y Vector Clock
      let lamportMark = null;
      let vectorClock = null;
      if (this.lamportClock) {
        lamportMark = this.lamportClock.getLocalMark();
        reservationEvent.lamportClock = lamportMark;
        this.lamportClock.recordEvent(reservationEvent, lamportMark, 'LOCAL');
      }

      if (this.vectorClock) {
        vectorClock = this.vectorClock.getLocalMark();
        reservationEvent.vectorClock = vectorClock;
        this.vectorClock.recordEvent(reservationEvent, vectorClock, 'LOCAL');
      }

      // TICKET #9: Detectar conflictos
      const conflictDetection = this.conflictDetectionService
        ? this.conflictDetectionService.detectConflict(reservationEvent)
        : { isConflict: false };

      if (conflictDetection.isConflict) {
        logger.warn('CONFLICTO DETECTADO EN RESERVA', {
          flightId,
          seatNumber,
          nodeId: this.nodeId,
          conflictingEvents: conflictDetection.conflictingEvents.length,
          resolution: conflictDetection.resolution,
          winner: conflictDetection.winner
        });

        // Revertir la reserva que acabamos de hacer
        this.flightService.releaseReservation(flightId, seatNumber);

        return res.status(409).json({
          success: false,
          error: 'Conflicto de concurrencia: Otro nodo reservó este asiento simultáneamente',
          flightId: flightId,
          seatNumber: seatNumber,
          conflictDetails: {
            conflictingNodesCount: conflictDetection.conflictingEvents.length,
            winnerNodeId: conflictDetection.winner,
            resolution: conflictDetection.resolution,
            reason: conflictDetection.reason
          },
          nodeId: this.nodeId,
          shouldRetry: conflictDetection.winner === this.nodeId  // El usuario debe reintentar
        });
      }

      // Registrar operación en historial de conflictos si está disponible
      if (this.conflictDetectionService) {
        this.conflictDetectionService.registerOperation(reservationEvent);
      }

      // Broadcast a otros nodos
      if (this.eventSyncService) {
        this.eventSyncService.broadcastEvent(reservationEvent, lamportMark, vectorClock);
      }

      this.reservationLog.push(reservationEvent);

      logger.info('Asiento reservado con éxito', {
        flightId,
        seatNumber,
        userId,
        nodeId: this.nodeId,
        holdDuration: duration,
        lamportMark,
        vectorClock: vectorClock ? `[${vectorClock.join(',')}]` : null
      });

      // Retornar respuesta exitosa
      return res.status(201).json({
        success: true,
        message: 'Asiento reservado exitosamente',
        data: {
          reservationId: reservationEvent.id,
          flightId: flightId,
          seatNumber: seatNumber,
          seatType: seat.seatType,
          userId: userId,
          status: seat.status,
          reservedAt: reservationEvent.timestamp,
          nodeId: this.nodeId,
          holdExpiresIn: duration,
          expiresAt: new Date(Date.now() + duration * 1000).toISOString(),
          lamportMark: lamportMark,
          vectorClock: vectorClock
        }
      });
    } catch (error) {
      logger.error('Error al reservar asiento', { error: error.message });
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        nodeId: this.nodeId
      });
    }
  }

  /**
   * Obtener historial de reservas del nodo
   * GET /reservar/eventos
   */
  async getReservationEvents(req, res) {
    try {
      const { flightId, userId, limit = 100 } = req.query;

      let events = this.reservationLog;

      // Filtrar por flightId si se proporciona
      if (flightId) {
        events = events.filter(e => e.flightId === flightId);
      }

      // Filtrar por userId si se proporciona
      if (userId) {
        events = events.filter(e => e.userId === userId);
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
      logger.error('Error al obtener eventos', { error: error.message });
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        nodeId: this.nodeId
      });
    }
  }

  /**
   * Obtener reservas activas (asientos en estado RESERVED)
   * GET /reservar/activas
   */
  async getActiveReservations(req, res) {
    try {
      const { flightId } = req.query;
      const flights = flightId 
        ? [this.flightService.getFlight(flightId)].filter(f => f)
        : this.flightService.getAllFlights();

      const activeReservations = [];

      flights.forEach(flight => {
        flight.getAllSeats().forEach(seat => {
          if (seat.status === 'RESERVED') {
            activeReservations.push({
              flightId: flight.id,
              flightNumber: flight.flightNumber,
              seatNumber: seat.seatNumber,
              seatType: seat.seatType,
              reservedBy: seat.reservedBy,
              reservedAt: seat.updatedAt,
              nodeId: this.nodeId
            });
          }
        });
      });

      return res.status(200).json({
        success: true,
        count: activeReservations.count,
        nodeId: this.nodeId,
        reservations: activeReservations
      });
    } catch (error) {
      logger.error('Error al obtener reservas activas', { error: error.message });
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        nodeId: this.nodeId
      });
    }
  }

  /**
   * Liberar una reserva (cancelar hold)
   * DELETE /reservar/:flightId/:seatNumber
   */
  async releaseReservation(req, res) {
    try {
      const { flightId, seatNumber } = req.params;
      const { userId } = req.body;

      // Obtener vuelo
      const flight = this.flightService.getFlight(flightId);
      if (!flight) {
        return res.status(404).json({
          success: false,
          error: 'Vuelo no encontrado',
          flightId: flightId,
          nodeId: this.nodeId
        });
      }

      // Obtener asiento
      const seat = flight.getSeat(seatNumber);
      if (!seat) {
        return res.status(404).json({
          success: false,
          error: 'Asiento no encontrado',
          flightId: flightId,
          seatNumber: seatNumber,
          nodeId: this.nodeId
        });
      }

      // Validar que esté reservado por el usuario
      if (seat.status !== 'RESERVED') {
        return res.status(409).json({
          success: false,
          error: 'Asiento no está reservado',
          flightId: flightId,
          seatNumber: seatNumber,
          currentStatus: seat.status,
          nodeId: this.nodeId
        });
      }

      if (userId && seat.reservedBy !== userId) {
        return res.status(403).json({
          success: false,
          error: 'No tienes permiso para liberar esta reserva',
          flightId: flightId,
          seatNumber: seatNumber,
          nodeId: this.nodeId
        });
      }

      // Liberar la reserva
      const released = seat.releaseReservation();
      if (!released) {
        return res.status(409).json({
          success: false,
          error: 'Error al liberar la reserva',
          flightId: flightId,
          seatNumber: seatNumber,
          nodeId: this.nodeId
        });
      }

      // Registrar evento
      const releaseEvent = {
        id: `REL_${Date.now()}_${Math.random()}`,
        timestamp: new Date().toISOString(),
        nodeId: this.nodeId,
        flightId: flightId,
        seatNumber: seatNumber,
        userId: userId || seat.reservedBy,
        action: 'RELEASE',
        status: 'SUCCESS'
      };

      this.reservationLog.push(releaseEvent);

      logger.info('Reserva liberada', {
        flightId,
        seatNumber,
        userId: userId || seat.reservedBy,
        nodeId: this.nodeId
      });

      return res.status(200).json({
        success: true,
        message: 'Reserva liberada exitosamente',
        data: {
          flightId: flightId,
          seatNumber: seatNumber,
          status: 'AVAILABLE',
          releasedAt: releaseEvent.timestamp,
          nodeId: this.nodeId
        }
      });
    } catch (error) {
      logger.error('Error al liberar reserva', { error: error.message });
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        nodeId: this.nodeId
      });
    }
  }

  /**
   * Obtener estadísticas de reservas del nodo
   * GET /reservar/stats
   */
  async getStats(req, res) {
    try {
      const stats = {
        nodeId: this.nodeId,
        totalReservationEvents: this.reservationLog.length,
        reservationsByAction: {
          RESERVE: this.reservationLog.filter(e => e.action === 'RESERVE').length,
          RELEASE: this.reservationLog.filter(e => e.action === 'RELEASE').length
        },
        successfulReservations: this.reservationLog.filter(e => e.status === 'SUCCESS').length,
        activeReservations: 0
      };

      // Contar reservas activas
      this.flightService.getAllFlights().forEach(flight => {
        flight.getAllSeats().forEach(seat => {
          if (seat.status === 'RESERVED') {
            stats.activeReservations++;
          }
        });
      });

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

export default SeatReservationController;
