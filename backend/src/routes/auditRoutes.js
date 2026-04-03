/**
 * Rutas de Auditoría
 * Endpoints para acceder a logs y reportes
 */

import express from 'express';
import AuditController from '../controllers/AuditController.js';

export function createAuditRoutes(auditService) {
  const router = express.Router();
  const auditController = new AuditController(auditService);

  // ========== CONSULTAS DE LOGS ==========
  
  /**
   * GET /audit/logs
   * Obtener logs con filtros
   */
  router.get('/logs', (req, res) => {
    auditController.getLogs(req, res);
  });

  /**
   * GET /audit/all
   * Obtener todos los logs
   */
  router.get('/all', (req, res) => {
    auditController.getAllLogs(req, res);
  });

  /**
   * GET /audit/summary
   * Obtener resumen rápido
   */
  router.get('/summary', (req, res) => {
    auditController.getSummary(req, res);
  });

  /**
   * GET /audit/operation/:operationId
   * Obtener detalle de operación
   */
  router.get('/operation/:operationId', (req, res) => {
    auditController.getOperation(req, res);
  });

  // ========== TRAZABILIDAD ==========

  /**
   * GET /audit/trace/:flightId/:seatNumber
   * Obtener traza completa de un asiento
   */
  router.get('/trace/:flightId/:seatNumber', (req, res) => {
    auditController.getResourceTrace(req, res);
  });

  /**
   * GET /audit/user/:userId
   * Obtener línea temporal de usuario
   */
  router.get('/user/:userId', (req, res) => {
    auditController.getUserTimeline(req, res);
  });

  // ========== CONFLICTOS ==========

  /**
   * GET /audit/conflicts
   * Obtener solo eventos de conflicto
   */
  router.get('/conflicts', (req, res) => {
    auditController.getConflicts(req, res);
  });

  // ========== ESTADÍSTICAS ==========

  /**
   * GET /audit/stats
   * Obtener estadísticas de auditoría
   */
  router.get('/stats', (req, res) => {
    auditController.getStatistics(req, res);
  });

  // ========== REPORTES ==========

  /**
   * GET /audit/report/seat/:flightId/:seatNumber
   * Generar reporte de trazabilidad de asiento
   */
  router.get('/report/seat/:flightId/:seatNumber', (req, res) => {
    auditController.generateSeatTraceReport(req, res);
  });

  /**
   * GET /audit/report/sync
   * Generar reporte de sincronización
   */
  router.get('/report/sync', (req, res) => {
    auditController.generateSyncReport(req, res);
  });

  // ========== EXPORTACIÓN ==========

  /**
   * GET /audit/export/json
   * Exportar logs a JSON
   */
  router.get('/export/json', (req, res) => {
    auditController.exportJSON(req, res);
  });

  /**
   * GET /audit/export/csv
   * Exportar logs a CSV
   */
  router.get('/export/csv', (req, res) => {
    auditController.exportCSV(req, res);
  });

  // ========== MANTENIMIENTO ==========

  /**
   * POST /audit/cleanup
   * Limpiar logs antiguos
   */
  router.post('/cleanup', (req, res) => {
    auditController.cleanupLogs(req, res);
  });

  /**
   * POST /audit/clear-all
   * Limpiar todos los logs (requiere confirmación)
   */
  router.post('/clear-all', (req, res) => {
    auditController.clearAllLogs(req, res);
  });

  return router;
}

export default createAuditRoutes;
