/**
 * Controlador de Cancelación y Devoluciones
 * Maneja cancelaciones de boletos con consistencia eventual
 */

import Logger from '../utils/logger.js';
import { FLIGHT_STATES } from '../constants/flightStates.js';

const logger = new Logger(process.env.LOG_LEVEL || 'info');

export class CancellationController {
  constructor(flightService, nodeId) {
    this.flightService = flightService;
    this.nodeId = nodeId;
    this.cancellationLog = [];      // Log de cancelaciones
    this.refundQueue = [];          // Cola de reembolsos pendientes
    this.refundTimeouts = {};       // Timeouts para reembolsos
    this.lamportClock = null;
    this.eventSyncService = null;
    this.vectorClock = null;
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
   * Inyectar servicio de auditoría
   */
  setAuditService(auditService) {
    this.auditService = auditService;
  }

  /**
   * Cancelar un boleto y devolver el asiento
   * POST /cancelar
   * @param {Request} req - Request con bookingId y refundDelay (opcional)
   * @param {Response} res - Response
   */
  async cancelTicket(req, res) {
    try {
      const { bookingId, refundDelay = 5 } = req.body;

      // Validar parámetros
      if (!bookingId) {
        return res.status(400).json({
          success: false,
          error: 'Parámetro requerido: bookingId',
          nodeId: this.nodeId
        });
      }

      // Validar que refundDelay sea positivo
      const delay = parseInt(refundDelay);
      if (isNaN(delay) || delay < 0) {
        return res.status(400).json({
          success: false,
          error: 'refundDelay debe ser un número >= 0 (segundos)',
          nodeId: this.nodeId
        });
      }

      // Obtener booking
      const booking = this.flightService.getBooking(parseInt(bookingId));
      if (!booking) {
        return res.status(404).json({
          success: false,
          error: 'Boleto no encontrado',
          bookingId: bookingId,
          nodeId: this.nodeId
        });
      }

      // Validar que el boleto esté en estado CONFIRMED
      if (booking.status !== 'CONFIRMED') {
        return res.status(409).json({
          success: false,
          error: `Boleto no puede cancelarse. Estado actual: ${booking.status}`,
          bookingId: bookingId,
          currentStatus: booking.status,
          nodeId: this.nodeId
        });
      }

      // Validar que el vuelo no haya despegado
      const flight = this.flightService.getFlight(booking.flightId);
      if (!flight) {
        return res.status(404).json({
          success: false,
          error: 'Vuelo no encontrado',
          flightId: booking.flightId,
          nodeId: this.nodeId
        });
      }

      if ([FLIGHT_STATES.DEPARTED, FLIGHT_STATES.IN_FLIGHT,
           FLIGHT_STATES.LANDED, FLIGHT_STATES.ARRIVED].includes(flight.status)) {
        return res.status(409).json({
          success: false,
          error: 'No se puede cancelar después del despegue',
          flightStatus: flight.status,
          nodeId: this.nodeId
        });
      }

      // Cambiar booking a CANCELLED
      booking.cancel();

      // Obtener asiento y cambiarlo a REFUNDED
      const seat = flight.getSeat(booking.seatNumber);
      if (!seat) {
        return res.status(404).json({
          success: false,
          error: 'Asiento no encontrado en vuelo',
          seatNumber: booking.seatNumber,
          nodeId: this.nodeId
        });
      }

      // Cambiar estado a REFUNDED (inicia consistencia eventual)
      seat.status = 'REFUNDED';
      seat.bookedBy = null;
      seat.updatedAt = new Date();

      // Registrar evento de cancelación
      const cancellationEvent = {
        id: `CANCEL_${Date.now()}_${Math.random()}`,
        timestamp: new Date().toISOString(),
        nodeId: this.nodeId,
        bookingId: bookingId,
        confirmationCode: booking.confirmationCode,
        flightId: flight.id,
        seatNumber: booking.seatNumber,
        seatType: seat.seatType,
        passengerId: booking.passengerId,
        passengerName: booking.passengerName,
        refundAmount: booking.ticketPrice,
        action: 'CANCEL',
        status: 'SUCCESS',
        refundDelaySeconds: delay
      };

      // Obtener marca Lamport y Vector Clock, adjuntarlos al evento
      if (this.lamportClock) {
        const lamportMark = this.lamportClock.getLocalMark();
        cancellationEvent.lamportClock = lamportMark;
        this.lamportClock.recordEvent(cancellationEvent, lamportMark, 'LOCAL');

        let vectorClock = null;
        if (this.vectorClock) {
          vectorClock = this.vectorClock.getLocalMark();
          cancellationEvent.vectorClock = vectorClock;
          this.vectorClock.recordEvent(cancellationEvent, vectorClock, 'LOCAL');
        }

        // Broadcast a otros nodos
        if (this.eventSyncService) {
          this.eventSyncService.broadcastEvent(cancellationEvent, lamportMark, vectorClock);
        }
      }

      this.cancellationLog.push(cancellationEvent);

      // Crear entrada en cola de reembolsos
      const refundEntry = {
        id: `REFUND_${Date.now()}_${Math.random()}`,
        bookingId: bookingId,
        flightId: flight.id,
        seatNumber: booking.seatNumber,
        createdAt: new Date().toISOString(),
        scheduledReleaseAt: new Date(Date.now() + delay * 1000).toISOString(),
        status: 'PENDING'
      };

      this.refundQueue.push(refundEntry);

      logger.info(`Boleto cancelado. Reembolso programado en ${delay}s`, {
        bookingId,
        flightId: flight.id,
        seatNumber: booking.seatNumber,
        nodeId: this.nodeId
      });

      // Configurar timeout para liberar asiento (consistencia eventual)
      const timeoutId = setTimeout(() => {
        this._processRefund(bookingId, flight.id, booking.seatNumber);
      }, delay * 1000);

      this.refundTimeouts[bookingId] = timeoutId;

      // Respuesta inmediata de cancelación
      return res.status(200).json({
        success: true,
        message: 'Boleto cancelado. Asiento en estado REFUNDED',
        data: {
          bookingId: bookingId,
          confirmationCode: booking.confirmationCode,
          flightId: flight.id,
          seatNumber: booking.seatNumber,
          status: 'REFUNDED',
          refundAmount: booking.ticketPrice,
          cancelledAt: new Date().toISOString(),
          nodeId: this.nodeId,
          refundInfo: {
            status: 'PENDING',
            willReleaseIn: delay,
            willReleaseAt: new Date(Date.now() + delay * 1000).toISOString(),
            message: `Asiento volvera a AVAILABLE en ${delay} segundos (consistencia eventual)`
          }
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
   * Procesa el reembolso (consistencia eventual)
   * @private
   */
  _processRefund(bookingId, flightId, seatNumber) {
    try {
      const flight = this.flightService.getFlight(flightId);
      if (!flight) {
        logger.error('Vuelo no encontrado en processRefund', { flightId });
        return;
      }

      const seat = flight.getSeat(seatNumber);
      if (!seat) {
        logger.error('Asiento no encontrado en processRefund', { flightId, seatNumber });
        return;
      }

      // Cambiar de REFUNDED a AVAILABLE
      seat.status = 'AVAILABLE';
      seat.updatedAt = new Date();

      // Actualizar cola de reembolsos
      const refundEntry = this.refundQueue.find(r => r.bookingId === bookingId);
      if (refundEntry) {
        refundEntry.status = 'COMPLETED';
        refundEntry.completedAt = new Date().toISOString();
      }

      // Registrar evento de liberación
      const releaseEvent = {
        id: `RELEASE_${Date.now()}_${Math.random()}`,
        timestamp: new Date().toISOString(),
        nodeId: this.nodeId,
        bookingId: bookingId,
        flightId: flightId,
        seatNumber: seatNumber,
        previousStatus: 'REFUNDED',
        newStatus: 'AVAILABLE',
        action: 'RELEASE_REFUND',
        status: 'SUCCESS'
      };

      // Obtener marca Lamport y Vector Clock, adjuntarlos al evento
      if (this.lamportClock) {
        const lamportMark = this.lamportClock.getLocalMark();
        releaseEvent.lamportClock = lamportMark;
        this.lamportClock.recordEvent(releaseEvent, lamportMark, 'LOCAL');

        let vectorClock = null;
        if (this.vectorClock) {
          vectorClock = this.vectorClock.getLocalMark();
          releaseEvent.vectorClock = vectorClock;
          this.vectorClock.recordEvent(releaseEvent, vectorClock, 'LOCAL');
        }

        // Broadcast a otros nodos
        if (this.eventSyncService) {
          this.eventSyncService.broadcastEvent(releaseEvent, lamportMark, vectorClock);
        }
      }

      this.cancellationLog.push(releaseEvent);

      logger.info('Reembolso procesado - Asiento liberado a AVAILABLE', {
        bookingId,
        flightId,
        seatNumber,
        nodeId: this.nodeId
      });

      // Limpiar timeout
      delete this.refundTimeouts[bookingId];
    } catch (error) {
      logger.error('Error procesando reembolso', { error: error.message });
    }
  }

  /**
   * Obtener historial de cancelaciones
   * GET /cancelar/eventos
   */
  async getCancellationEvents(req, res) {
    try {
      const { flightId, passengerId, limit = 100 } = req.query;

      let events = this.cancellationLog;

      if (flightId) {
        events = events.filter(e => e.flightId === flightId);
      }

      if (passengerId) {
        events = events.filter(e => e.passengerId === passengerId);
      }

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
   * Ver reembolsos pendientes
   * GET /cancelar/pendientes
   */
  async getPendingRefunds(req, res) {
    try {
      const { flightId } = req.query;

      let refunds = this.refundQueue.filter(r => r.status === 'PENDING');

      if (flightId) {
        refunds = refunds.filter(r => r.flightId === flightId);
      }

      return res.status(200).json({
        success: true,
        count: refunds.length,
        nodeId: this.nodeId,
        pendingRefunds: refunds.map(r => ({
          ...r,
          secondsUntilRelease: Math.max(0, Math.round(
            (new Date(r.scheduledReleaseAt).getTime() - Date.now()) / 1000
          ))
        }))
      });
    } catch (error) {
      logger.error('Error al obtener reembolsos', { error: error.message });
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        nodeId: this.nodeId
      });
    }
  }

  /**
   * Ver reembolsos completados
   * GET /cancelar/completados
   */
  async getCompletedRefunds(req, res) {
    try {
      const { limit = 100 } = req.query;

      const completed = this.refundQueue
        .filter(r => r.status === 'COMPLETED')
        .slice(-parseInt(limit || 100));

      return res.status(200).json({
        success: true,
        count: completed.length,
        nodeId: this.nodeId,
        completedRefunds: completed
      });
    } catch (error) {
      logger.error('Error al obtener reembolsos', { error: error.message });
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        nodeId: this.nodeId
      });
    }
  }

  /**
   * Obtener resumen de reembolsos
   * GET /cancelar/resumen
   */
  async getRefundsSummary(req, res) {
    try {
      const summary = {
        nodeId: this.nodeId,
        timestamp: new Date().toISOString(),
        cancellations: {
          total: this.cancellationLog.filter(e => e.action === 'CANCEL').length,
          releases: this.cancellationLog.filter(e => e.action === 'RELEASE_REFUND').length
        },
        refundQueue: {
          pending: this.refundQueue.filter(r => r.status === 'PENDING').length,
          completed: this.refundQueue.filter(r => r.status === 'COMPLETED').length,
          total: this.refundQueue.length
        },
        activeTimeouts: Object.keys(this.refundTimeouts).length,
        totalRefunded: this.cancellationLog
          .filter(e => e.action === 'CANCEL')
          .reduce((sum, e) => sum + (e.refundAmount || 0), 0)
      };

      return res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      logger.error('Error al obtener resumen', { error: error.message });
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        nodeId: this.nodeId
      });
    }
  }

  /**
   * Forzar liberación de asiento (para emergencias/sincronización)
   * POST /cancelar/liberar-inmediato/:bookingId
   */
  async forceReleaseRefund(req, res) {
    try {
      const { bookingId } = req.params;

      const refundEntry = this.refundQueue.find(r => r.bookingId === parseInt(bookingId));
      if (!refundEntry) {
        return res.status(404).json({
          success: false,
          error: 'Reembolso no encontrado en cola',
          bookingId: bookingId,
          nodeId: this.nodeId
        });
      }

      if (refundEntry.status === 'COMPLETED') {
        return res.status(409).json({
          success: false,
          error: 'Este reembolso ya ha sido procesado',
          bookingId: bookingId,
          nodeId: this.nodeId
        });
      }

      // Cancelar timeout si existe
      if (this.refundTimeouts[bookingId]) {
        clearTimeout(this.refundTimeouts[bookingId]);
        delete this.refundTimeouts[bookingId];
      }

      // Procesar reembolso inmediatamente
      this._processRefund(parseInt(bookingId), refundEntry.flightId, refundEntry.seatNumber);

      return res.status(200).json({
        success: true,
        message: 'Reembolso procesado inmediatamente',
        data: {
          bookingId: bookingId,
          seatNumber: refundEntry.seatNumber,
          newStatus: 'AVAILABLE',
          processedAt: new Date().toISOString(),
          nodeId: this.nodeId
        }
      });
    } catch (error) {
      logger.error('Error forzando liberación', { error: error.message });
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        nodeId: this.nodeId
      });
    }
  }

  /**
   * Estadísticas de cancelaciones
   * GET /cancelar/stats
   */
  async getStats(req, res) {
    try {
      const stats = {
        nodeId: this.nodeId,
        timestamp: new Date().toISOString(),
        cancellations: {
          totalCancelledTickets: this.cancellationLog
            .filter(e => e.action === 'CANCEL').length,
          totalRefundedAmount: this.cancellationLog
            .filter(e => e.action === 'CANCEL')
            .reduce((sum, e) => sum + (e.refundAmount || 0), 0),
          totalReleasedToAvailable: this.cancellationLog
            .filter(e => e.action === 'RELEASE_REFUND').length
        },
        consistency: {
          pendingRefunds: this.refundQueue.filter(r => r.status === 'PENDING').length,
          completedRefunds: this.refundQueue.filter(r => r.status === 'COMPLETED').length,
          activeRefundProcesses: Object.keys(this.refundTimeouts).length
        },
        avgRefundDelay: this._calculateAvgRefundDelay()
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

  /**
   * Calcula el retraso promedio de reembolso
   * @private
   */
  _calculateAvgRefundDelay() {
    const refunds = this.refundQueue.filter(r => r.status === 'COMPLETED');
    if (refunds.length === 0) return 0;

    const totalDelay = refunds.reduce((sum, r) => {
      const created = new Date(r.createdAt).getTime();
      const completed = new Date(r.completedAt).getTime();
      return sum + (completed - created);
    }, 0);

    return Math.round(totalDelay / refunds.length / 1000); // En segundos
  }
}

export default CancellationController;
