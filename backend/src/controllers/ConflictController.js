/**
 * Controlador de Conflictos
 * Proporciona endpoints para consultar el historial de conflictos detectados
 */

import Logger from '../utils/logger.js';

const logger = new Logger(process.env.LOG_LEVEL || 'info');

export class ConflictController {
  constructor(conflictDetectionService) {
    this.conflictDetectionService = conflictDetectionService;
    this.nodeId = conflictDetectionService ? conflictDetectionService.nodeId : 1;
  }

  /**
   * Obtener historial de conflictos
   * GET /conflictos/historial
   */
  async getConflictHistory(req, res) {
    try {
      if (!this.conflictDetectionService) {
        return res.status(503).json({
          success: false,
          error: 'Servicio de detección de conflictos no disponible',
          nodeId: this.nodeId
        });
      }

      const { limit = 50 } = req.query;
      const history = this.conflictDetectionService.getConflictHistory(parseInt(limit) || 50);

      return res.status(200).json({
        success: true,
        nodeId: this.nodeId,
        totalConflicts: history.length,
        conflicts: history.map(c => ({
          timestamp: c.timestamp,
          resourceKey: c.resourceKey,
          flightId: c.flightId,
          seatNumber: c.seatNumber,
          newEventId: c.newEventId,
          newEventNode: c.newEventNode,
          conflictingEventsCount: c.conflictingEvents.length,
          conflictingNodes: c.conflictingEvents.map(e => e.nodeId),
          winner: c.winnerNodeId,
          resolution: c.resolution,
          reason: c.reason
        }))
      });
    } catch (error) {
      logger.error('Error obteniendo historial de conflictos', {
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
   * Obtener estadísticas de conflictos
   * GET /conflictos/stats
   */
  async getConflictStats(req, res) {
    try {
      if (!this.conflictDetectionService) {
        return res.status(503).json({
          success: false,
          error: 'Servicio de detección de conflictos no disponible',
          nodeId: this.nodeId
        });
      }

      const stats = this.conflictDetectionService.getStats();

      return res.status(200).json({
        success: true,
        nodeId: this.nodeId,
        data: stats
      });
    } catch (error) {
      logger.error('Error obteniendo estadísticas de conflictos', {
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
   * Obtener conflictos de un asiento específico
   * GET /conflictos/asiento/:flightId/:seatNumber
   */
  async getConflictsForSeat(req, res) {
    try {
      if (!this.conflictDetectionService) {
        return res.status(503).json({
          success: false,
          error: 'Servicio de detección de conflictos no disponible',
          nodeId: this.nodeId
        });
      }

      const { flightId, seatNumber } = req.params;

      if (!flightId || !seatNumber) {
        return res.status(400).json({
          success: false,
          error: 'Parámetros requeridos: flightId, seatNumber',
          nodeId: this.nodeId
        });
      }

      const conflicts = this.conflictDetectionService.getConflictsForSeat(flightId, seatNumber);

      return res.status(200).json({
        success: true,
        nodeId: this.nodeId,
        flightId,
        seatNumber,
        totalConflicts: conflicts.length,
        conflicts: conflicts.map(c => ({
          timestamp: c.timestamp,
          newEventId: c.newEventId,
          newEventNode: c.newEventNode,
          conflictingEventsCount: c.conflictingEvents.length,
          conflictingNodes: c.conflictingEvents.map(e => e.nodeId),
          winner: c.winnerNodeId,
          resolution: c.resolution,
          reason: c.reason
        }))
      });
    } catch (error) {
      logger.error('Error obteniendo conflictos del asiento', {
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
   * Obtener resumen de conflictos por razón de resolución
   * GET /conflictos/resumen
   */
  async getConflictSummary(req, res) {
    try {
      if (!this.conflictDetectionService) {
        return res.status(503).json({
          success: false,
          error: 'Servicio de detección de conflictos no disponible',
          nodeId: this.nodeId
        });
      }

      const stats = this.conflictDetectionService.getStats();
      const history = this.conflictDetectionService.conflictHistory || [];

      // Agrupar por razón y estado
      const bySeat = {};
      history.forEach(conflict => {
        const key = `${conflict.flightId}:${conflict.seatNumber}`;
        if (!bySeat[key]) {
          bySeat[key] = {
            flightId: conflict.flightId,
            seatNumber: conflict.seatNumber,
            totalConflicts: 0,
            won: 0,
            lost: 0
          };
        }
        bySeat[key].totalConflicts++;
        if (conflict.resolution === 'WON') {
          bySeat[key].won++;
        } else {
          bySeat[key].lost++;
        }
      });

      return res.status(200).json({
        success: true,
        nodeId: this.nodeId,
        summary: {
          totalConflicts: stats.totalConflicts,
          conflictsWon: stats.conflictsWon,
          conflictsLost: stats.conflictsLost,
          winRate: stats.winRate,
          resolutionReasons: stats.resolutionReasons,
          mostConflictedSeats: Object.values(bySeat)
            .sort((a, b) => b.totalConflicts - a.totalConflicts)
            .slice(0, 10)
        }
      });
    } catch (error) {
      logger.error('Error obteniendo resumen de conflictos', {
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
   * Limpiar histórico de conflictos antiguos
   * POST /conflictos/cleanup
   */
  async cleanupOldConflicts(req, res) {
    try {
      if (!this.conflictDetectionService) {
        return res.status(503).json({
          success: false,
          error: 'Servicio de detección de conflictos no disponible',
          nodeId: this.nodeId
        });
      }

      const { maxAgeSeconds = 3600 } = req.body;

      const beforeCount = this.conflictDetectionService.conflictHistory.length;
      this.conflictDetectionService.cleanupOldOperations(maxAgeSeconds);
      const afterCount = this.conflictDetectionService.conflictHistory.length;

      logger.info('Limpieza de conflictos antiguos completada', {
        nodeId: this.nodeId,
        maxAgeSeconds,
        removed: beforeCount - afterCount
      });

      return res.status(200).json({
        success: true,
        nodeId: this.nodeId,
        data: {
          maxAgeSeconds,
          beforeCount,
          afterCount,
          removed: beforeCount - afterCount
        }
      });
    } catch (error) {
      logger.error('Error limpiando conflictos antiguos', {
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

export default ConflictController;
