/**
 * Controlador de Auditoría
 * Proporciona endpoints para consultar logs y auditoría
 */

import Logger from '../utils/logger.js';

const logger = new Logger(process.env.LOG_LEVEL || 'info');

export class AuditController {
  constructor(auditService) {
    this.auditService = auditService;
  }

  /**
   * Obtener logs con filtros
   * GET /audit/logs?operationType=RESERVATION_CREATE&status=SUCCESS&limit=50&offset=0
   */
  getLogs(req, res) {
    try {
      const {
        limit = 100,
        offset = 0,
        operationType,
        status,
        nodeId,
        resourceId,
        flightId,
        userId,
        conflictsOnly = false
      } = req.query;

      const filters = {
        limit: parseInt(limit),
        offset: parseInt(offset),
        operationType,
        status,
        nodeId: nodeId ? parseInt(nodeId) : undefined,
        resourceId,
        flightId,
        userId,
        conflictsOnly: conflictsOnly === 'true'
      };

      const logs = this.auditService.searchLogs(filters);

      res.status(200).json({
        success: true,
        data: {
          total: this.auditService.auditLog.length,
          limit: filters.limit,
          offset: filters.offset,
          returned: logs.length,
          logs
        }
      });
    } catch (error) {
      logger.error('Error getting audit logs', error);
      res.status(500).json({
        success: false,
        error: 'Error retrieving audit logs',
        details: error.message
      });
    }
  }

  /**
   * Obtener todos los logs (con límite razonable)
   * GET /audit/all?limit=1000
   */
  getAllLogs(req, res) {
    try {
      const { limit = 1000, offset = 0 } = req.query;
      const logs = this.auditService.getAllLogs(parseInt(limit), parseInt(offset));

      res.status(200).json({
        success: true,
        data: {
          total: this.auditService.auditLog.length,
          limit,
          offset,
          returned: logs.length,
          logs
        }
      });
    } catch (error) {
      logger.error('Error getting all audit logs', error);
      res.status(500).json({
        success: false,
        error: 'Error retrieving audit logs'
      });
    }
  }

  /**
   * Obtener detalle de una operación específica
   * GET /audit/operation/:operationId
   */
  getOperation(req, res) {
    try {
      const { operationId } = req.params;
      const operation = this.auditService.operationIndex[operationId];

      if (!operation) {
        return res.status(404).json({
          success: false,
          error: `Operation ${operationId} not found`
        });
      }

      res.status(200).json({
        success: true,
        data: operation
      });
    } catch (error) {
      logger.error('Error getting operation', error);
      res.status(500).json({
        success: false,
        error: 'Error retrieving operation'
      });
    }
  }

  /**
   * Obtener traza completa de un recurso
   * GET /audit/trace/:flightId/:seatNumber
   */
  getResourceTrace(req, res) {
    try {
      const { flightId, seatNumber } = req.params;
      const trace = this.auditService.getResourceTrace(flightId, parseInt(seatNumber));

      res.status(200).json({
        success: true,
        data: {
          resourceId: `${flightId}:${seatNumber}`,
          operationCount: trace.length,
          trace
        }
      });
    } catch (error) {
      logger.error('Error getting resource trace', error);
      res.status(500).json({
        success: false,
        error: 'Error retrieving resource trace'
      });
    }
  }

  /**
   * Obtener línea temporal de usuario
   * GET /audit/user/:userId?limit=50
   */
  getUserTimeline(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 50 } = req.query;
      const timeline = this.auditService.getUserTimeline(userId, parseInt(limit));

      res.status(200).json({
        success: true,
        data: {
          userId,
          operationCount: timeline.length,
          timeline
        }
      });
    } catch (error) {
      logger.error('Error getting user timeline', error);
      res.status(500).json({
        success: false,
        error: 'Error retrieving user timeline'
      });
    }
  }

  /**
   * Obtener solo conflictos
   * GET /audit/conflicts?limit=50
   */
  getConflicts(req, res) {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const conflicts = this.auditService.searchLogs({
        conflictsOnly: true,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.status(200).json({
        success: true,
        data: {
          total: conflicts.filter(c => c.status === 'CONFLICT').length,
          limit,
          offset,
          returned: conflicts.length,
          conflicts
        }
      });
    } catch (error) {
      logger.error('Error getting conflicts', error);
      res.status(500).json({
        success: false,
        error: 'Error retrieving conflicts'
      });
    }
  }

  /**
   * Obtener estadísticas de auditoría
   * GET /audit/stats
   */
  getStatistics(req, res) {
    try {
      const stats = this.auditService.getStatistics();

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error getting audit statistics', error);
      res.status(500).json({
        success: false,
        error: 'Error retrieving statistics'
      });
    }
  }

  /**
   * Generar reporte de trazabilidad de un asiento
   * GET /audit/report/seat/:flightId/:seatNumber
   */
  generateSeatTraceReport(req, res) {
    try {
      const { flightId, seatNumber } = req.params;
      const report = this.auditService.generateSeatTraceReport(flightId, parseInt(seatNumber));

      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      logger.error('Error generating seat trace report', error);
      res.status(500).json({
        success: false,
        error: 'Error generating seat trace report'
      });
    }
  }

  /**
   * Generar reporte de sincronización
   * GET /audit/report/sync
   */
  generateSyncReport(req, res) {
    try {
      const report = this.auditService.generateSyncReport();

      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      logger.error('Error generating sync report', error);
      res.status(500).json({
        success: false,
        error: 'Error generating sync report'
      });
    }
  }

  /**
   * Exportar logs a JSON
   * GET /audit/export/json?operationType=RESERVATION_CREATE
   */
  exportJSON(req, res) {
    try {
      const { operationType, status, flightId, userId, limit = 1000 } = req.query;

      const filters = {
        operationType,
        status,
        flightId,
        userId,
        limit: parseInt(limit)
      };

      const jsonData = this.auditService.exportToJSON(filters);

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="audit_${new Date().getTime()}.json"`);
      res.status(200).json(jsonData);
    } catch (error) {
      logger.error('Error exporting JSON', error);
      res.status(500).json({
        success: false,
        error: 'Error exporting logs'
      });
    }
  }

  /**
   * Exportar logs a CSV
   * GET /audit/export/csv?operationType=RESERVATION_CREATE
   */
  exportCSV(req, res) {
    try {
      const { operationType, status, flightId, userId, limit = 1000 } = req.query;

      const filters = {
        operationType,
        status,
        flightId,
        userId,
        limit: parseInt(limit)
      };

      const csvData = this.auditService.exportToCSV(filters);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="audit_${new Date().getTime()}.csv"`);
      res.status(200).send(csvData);
    } catch (error) {
      logger.error('Error exporting CSV', error);
      res.status(500).json({
        success: false,
        error: 'Error exporting logs'
      });
    }
  }

  /**
   * Limpiar logs antiguos
   * POST /audit/cleanup
   * Body: { ageSeconds: 3600 }
   */
  cleanupLogs(req, res) {
    try {
      const { ageSeconds = 3600 } = req.body;
      const deletedCount = this.auditService.clearOldRecords(ageSeconds);

      res.status(200).json({
        success: true,
        data: {
          deletedCount,
          remainingRecords: this.auditService.auditLog.length,
          ageSeconds
        }
      });
    } catch (error) {
      logger.error('Error cleaning up logs', error);
      res.status(500).json({
        success: false,
        error: 'Error cleaning up logs'
      });
    }
  }

  /**
   * Limpiar todos los logs
   * POST /audit/clear-all (con confirmación)
   */
  clearAllLogs(req, res) {
    try {
      const { confirm = false } = req.body;

      if (!confirm) {
        return res.status(400).json({
          success: false,
          error: 'This operation requires confirmation. Send { confirm: true }'
        });
      }

      const deletedCount = this.auditService.clearAll();

      res.status(200).json({
        success: true,
        data: {
          message: 'All audit logs cleared',
          deletedCount
        }
      });
    } catch (error) {
      logger.error('Error clearing all logs', error);
      res.status(500).json({
        success: false,
        error: 'Error clearing logs'
      });
    }
  }

  /**
   * Obtener resumen rápido
   * GET /audit/summary
   */
  getSummary(req, res) {
    try {
      const stats = this.auditService.getStatistics();
      const recentLogs = this.auditService.getAllLogs(5, 0);

      res.status(200).json({
        success: true,
        data: {
          summary: {
            totalOperations: stats.totalOperations,
            successRate: stats.successRate,
            conflictRate: stats.conflictRate,
            nodeId: stats.nodeId
          },
          recentOperations: recentLogs,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error getting summary', error);
      res.status(500).json({
        success: false,
        error: 'Error retrieving summary'
      });
    }
  }
}

export default AuditController;
