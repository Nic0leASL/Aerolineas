/**
 * Controlador de Sincronización de Eventos
 * Recibe eventos remotos de otros nodos y actualiza el reloj Lamport y Vector Clock local
 */

import Logger from '../utils/logger.js';
import { getConnection, sql } from '../config/db.js';
import { TicketModel } from '../models/TicketModel.js';

const logger = new Logger(process.env.LOG_LEVEL || 'info');

export class SyncController {
  constructor(lamportClock, eventSyncService, vectorClock = null) {
    this.lamportClock = lamportClock;
    this.eventSyncService = eventSyncService;
    this.vectorClock = vectorClock;
    this.receivedEvents = [];
    this.nodeId = lamportClock.nodeId;
  }

  /**
   * Recibir y procesar evento remoto
   * POST /sync/events
   */
  async receiveRemoteEvent(req, res) {
    try {
      const { lamportMark, vectorClock, event, sourceNodeId, timestamp, isRetry, useVectorClock } = req.body;

      // Validar payload
      if (!lamportMark || !event || sourceNodeId === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Campos requeridos: lamportMark, event, sourceNodeId',
          nodeId: this.nodeId
        });
      }

      // Procesar evento remoto
      const result = this.eventSyncService.processRemoteEvent({
        lamportMark,
        vectorClock,
        event,
        sourceNodeId,
        timestamp,
        useVectorClock
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          nodeId: this.nodeId
        });
      }

      // Registrar evento recibido
      this.receivedEvents.push({
        timestamp: new Date().toISOString(),
        sourceNodeId,
        remoteLamportMark: lamportMark,
        remoteVectorClock: vectorClock ? `[${vectorClock.join(',')}]` : null,
        updatedLamportMark: result.newLamportMark,
        updatedVectorClock: result.newVectorClock ? `[${result.newVectorClock.join(',')}]` : null,
        eventId: event.id,
        eventAction: event.action,
        isRetry: isRetry || false
      });

      logger.info('Evento remoto recibido y procesado', {
        sourceNodeId,
        localNodeId: this.nodeId,
        eventAction: event.action,
        remoteMark: lamportMark,
        remoteVector: vectorClock ? `[${vectorClock.join(',')}]` : null,
        newLocalMark: result.newLamportMark,
        newLocalVector: result.newVectorClock ? `[${result.newVectorClock.join(',')}]` : null
      });

      // Espejo Distribuido: Escribir físicamente en la Base de Datos Local
      if (event.action === 'PURCHASE') {
        try {
          if (this.nodeId === 3 || this.nodeId === '3') {
              const existingTicket = await TicketModel.findOne({ FlightId: event.flightId, SeatNumber: event.seatNumber });
              if (!existingTicket) {
                  await TicketModel.create({
                      FlightId: event.flightId,
                      PersonId: typeof event.passengerId === 'number' ? event.passengerId : 9999,
                      SeatNumber: event.seatNumber,
                      SeatClass: event.seatType || 'ECONOMY_CLASS',
                      PricePaid: event.ticketPrice || 0,
                      Status: 'BOOKED',
                      PurchaseNode: `SYNC_FROM_${sourceNodeId}`
                  });
              }
          } else {
              const pool = await getConnection();
              // Verificar si ya existe en la réplica
              const checkReplica = await pool.request().query(`
                  SELECT Status FROM Tickets WHERE FlightId = '${event.flightId}' AND SeatNumber = '${event.seatNumber}'
              `);
              if (checkReplica.recordset.length === 0) {
                  // Determinar PersonId basico si viene crudo
                  let personId = 9999;
                  if (event.passengerId && !isNaN(event.passengerId)) {
                      personId = parseInt(event.passengerId);
                  }
                  
                  await pool.request().query(`
                      INSERT INTO Tickets (FlightId, PersonId, SeatNumber, SeatClass, PricePaid, Status, PurchaseNode)
                      VALUES ('${event.flightId}', ${personId}, '${event.seatNumber}', '${event.seatType || 'ECONOMY_CLASS'}', ${event.ticketPrice || 0}, 'BOOKED', 'SYNC_FROM_${sourceNodeId}')
                  `);
              }
          }
          logger.info(`💾 [Replicación Física Exitosa] Boleto de ${sourceNodeId} insertado localmente en Nodo ${this.nodeId}`);
        } catch(dbErr) {
          logger.error(`⚠ Error escribiendo réplica física: ${dbErr.message}`);
        }
      }

      // Respuesta exitosa (202 Accepted indicando procesamiento asincrónico)
      return res.status(202).json({
        success: true,
        message: 'Evento remoto procesado',
        data: {
          nodeId: this.nodeId,
          updatedLamportMark: result.newLamportMark,
          updatedVectorClock: result.newVectorClock,
          sourceNodeId,
          eventId: event.id,
          clockDifference: result.newLamportMark - lamportMark
        }
      });
    } catch (error) {
      logger.error('Error recibiendo evento remoto', {
        error: error.message,
        nodeId: this.nodeId
      });

      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        nodeId: this.nodeId
      });
    }
  }

  /**
   * Obtener historial de eventos recibidos
   * GET /sync/received-events
   */
  async getReceivedEvents(req, res) {
    try {
      const { limit = 50, sourceNodeId } = req.query;

      let events = this.receivedEvents;

      if (sourceNodeId) {
        events = events.filter(e => e.sourceNodeId === parseInt(sourceNodeId));
      }

      const limitNum = Math.min(parseInt(limit) || 50, 1000);
      events = events.slice(-limitNum);

      return res.status(200).json({
        success: true,
        nodeId: this.nodeId,
        count: events.length,
        receivedEvents: events
      });
    } catch (error) {
      logger.error('Error obteniendo eventos recibidos', {
        error: error.message,
        nodeId: this.nodeId
      });

      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        nodeId: this.nodeId
      });
    }
  }

  /**
   * Obtener historial ordenado por marca Lamport
   * GET /sync/ordered-events
   */
  async getOrderedEvents(req, res) {
    try {
      const { limit = 50 } = req.query;

      const ordered = this.lamportClock.getOrderedHistory(parseInt(limit) || 50);

      return res.status(200).json({
        success: true,
        nodeId: this.nodeId,
        count: ordered.length,
        orderedByLamport: ordered.map(e => ({
          lamportMark: e.lamportMark,
          source: e.source,
          action: e.eventAction,
          sourceNode: e.eventNodeId,
          timestamp: e.timestamp,
          eventId: e.eventId
        }))
      });
    } catch (error) {
      logger.error('Error obteniendo eventos ordenados', {
        error: error.message,
        nodeId: this.nodeId
      });

      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        nodeId: this.nodeId
      });
    }
  }

  /**
   * Ver relaciones de causalidad entre eventos
   * GET /sync/causality-matrix
   */
  async getCausalityMatrix(req, res) {
    try {
      const matrix = this.lamportClock.getCausalityMatrix();

      return res.status(200).json({
        success: true,
        nodeId: this.nodeId,
        relationCount: matrix.length,
        causalityRelations: matrix
      });
    } catch (error) {
      logger.error('Error obteniendo matriz de causalidad', {
        error: error.message,
        nodeId: this.nodeId
      });

      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        nodeId: this.nodeId
      });
    }
  }

  /**
   * Obtener estadísticas de sincronización
   * GET /sync/stats
   */
  async getStats(req, res) {
    try {
      const stats = {
        nodeId: this.nodeId,
        lamportClock: this.lamportClock.getStats(),
        vectorClock: this.vectorClock ? this.vectorClock.getStats() : null,
        eventSync: this.eventSyncService.getStats(),
        receivedEventsCount: this.receivedEvents.length,
        lastReceivedEvent: this.receivedEvents.length > 0 
          ? this.receivedEvents[this.receivedEvents.length - 1] 
          : null
      };

      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error obteniendo estadísticas de sincronización', {
        error: error.message,
        nodeId: this.nodeId
      });

      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        nodeId: this.nodeId
      });
    }
  }

  /**
   * Obtener información del Vector Clock
   * GET /sync/vector-clock
   */
  async getVectorClockInfo(req, res) {
    try {
      if (!this.vectorClock) {
        return res.status(400).json({
          success: false,
          error: 'Vector Clock no está configurado en este nodo',
          nodeId: this.nodeId
        });
      }

      const stats = this.vectorClock.getStats();

      return res.status(200).json({
        success: true,
        data: {
          nodeId: this.nodeId,
          currentVector: this.vectorClock.vectorToString(this.vectorClock.getVector()),
          stats
        }
      });
    } catch (error) {
      logger.error('Error obteniendo información del Vector Clock', {
        error: error.message,
        nodeId: this.nodeId
      });

      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        nodeId: this.nodeId
      });
    }
  }

  /**
   * Obtener historial ordenado por Vector Clock
   * GET /sync/vector-history
   */
  async getVectorHistory(req, res) {
    try {
      if (!this.vectorClock) {
        return res.status(400).json({
          success: false,
          error: 'Vector Clock no está configurado en este nodo',
          nodeId: this.nodeId
        });
      }

      const { limit = 50 } = req.query;
      const history = this.vectorClock.getOrderedHistory(parseInt(limit) || 50);

      return res.status(200).json({
        success: true,
        nodeId: this.nodeId,
        count: history.length,
        vectorHistory: history
      });
    } catch (error) {
      logger.error('Error obteniendo historial de Vector Clock', {
        error: error.message,
        nodeId: this.nodeId
      });

      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        nodeId: this.nodeId
      });
    }
  }

  /**
   * Detectar eventos concurrentes
   * GET /sync/concurrent-events
   */
  async getConcurrentEvents(req, res) {
    try {
      if (!this.vectorClock) {
        return res.status(400).json({
          success: false,
          error: 'Vector Clock no está configurado en este nodo',
          nodeId: this.nodeId
        });
      }

      const concurrent = this.vectorClock.detectConcurrentEvents();

      return res.status(200).json({
        success: true,
        nodeId: this.nodeId,
        concurrentPairsCount: concurrent.length,
        concurrentEvents: concurrent
      });
    } catch (error) {
      logger.error('Error detectando eventos concurrentes', {
        error: error.message,
        nodeId: this.nodeId
      });

      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        nodeId: this.nodeId
      });
    }
  }

  /**
   * Ver detalles del reloj Lamport local
   * GET /sync/clock
   */
  async getClockInfo(req, res) {
    try {
      const stats = this.lamportClock.getStats();

      return res.status(200).json({
        success: true,
        data: {
          nodeId: this.nodeId,
          currentLamportClock: this.lamportClock.getClock(),
          stats
        }
      });
    } catch (error) {
      logger.error('Error obteniendo información del reloj', {
        error: error.message,
        nodeId: this.nodeId
      });

      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        nodeId: this.nodeId
      });
    }
  }

  /**
   * Reintentar eventos que fallaron
   * POST /sync/retry-failed
   */
  async retryFailedEvents(req, res) {
    try {
      const result = await this.eventSyncService.retryFailedSends();

      return res.status(200).json({
        success: true,
        nodeId: this.nodeId,
        retryResult: result
      });
    } catch (error) {
      logger.error('Error reintentando envíos fallidos', {
        error: error.message,
        nodeId: this.nodeId
      });

      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        nodeId: this.nodeId
      });
    }
  }
}

export default SyncController;
