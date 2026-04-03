/**
 * Audit Service - Auditoría y logging centralizado
 * 
 * Registra todas las operaciones críticas del sistema distribuido
 * para trazabilidad y validación de comportamiento concurrente
 */

import Logger from '../utils/logger.js';

const logger = new Logger(process.env.LOG_LEVEL || 'info');

/**
 * Tipos de operaciones auditadas
 */
export const OperationTypes = {
  RESERVATION_CREATE: 'RESERVATION_CREATE',      // Crear reserva
  RESERVATION_CANCEL: 'RESERVATION_CANCEL',      // Cancelar reserva
  PURCHASE_CREATE: 'PURCHASE_CREATE',            // Crear compra
  PURCHASE_CANCEL: 'PURCHASE_CANCEL',            // Cancelar compra
  CONFLICT_DETECTED: 'CONFLICT_DETECTED',   // Conflicto detectado
  CONFLICT_RESOLVED: 'CONFLICT_RESOLVED',   // Conflicto resuelto
  EVENT_SYNC_SENT: 'EVENT_SYNC_SENT',            // Evento enviado
  EVENT_SYNC_RECEIVED: 'EVENT_SYNC_RECEIVED',    // Evento recibido
  FLIGHT_CREATED: 'FLIGHT_CREATED',              // Vuelo creado
  SEARCH_EXECUTED: 'SEARCH_EXECUTED',            // Búsqueda ejecutada
  ERROR_OCCURRED: 'ERROR_OCCURRED'                // Error ocurrido
};

/**
 * Estados de operación
 */
export const OperationStatus = {
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  CONFLICT: 'CONFLICT',
  PENDING: 'PENDING',
  REJECTED: 'REJECTED'
};

class AuditService {
  constructor(nodeId = 1) {
    this.nodeId = nodeId;
    this.auditLog = [];        // Log centralizado
    this.operationIndex = {};  // Índice por operationId
    this.resourceIndex = {};   // Índice por recurso (flightId:seatNumber)
    this.maxLogSize = parseInt(process.env.MAX_AUDIT_LOG_SIZE || 10000);
    this.operationCounter = 0;
    
    logger.info(`AuditService initialized for Node ${nodeId}`);
  }

  /**
   * Generar ID único para operación
   */
  generateOperationId() {
    const timestamp = Date.now();
    const counter = ++this.operationCounter;
    return `OP_${this.nodeId}_${timestamp}_${counter}`;
  }

  /**
   * Registrar operación crítica
   * 
   * @param {string} operationType - Tipo de operación (OperationTypes.*)
   * @param {object} details - Detalles de la operación
   * @param {string} status - Estado de la operación (OperationStatus.*)
   * @returns {object} Registro de auditoría creado
   */
  logOperation(operationType, details, status = OperationStatus.SUCCESS) {
    const operationId = this.generateOperationId();
    const now = new Date();
    
    const auditRecord = {
      operationId,
      timestamp: now.toISOString(),
      timestampMs: now.getTime(),
      nodeId: this.nodeId,
      
      // Información de operación
      operationType,
      status,
      
      // Detalles específicos
      resourceId: `${details.flightId}:${details.seatNumber || 'N/A'}`,
      flightId: details.flightId,
      seatNumber: details.seatNumber,
      userId: details.userId,
      
      // Relojes distribuidos
      lamportMark: details.lamportMark || null,
      vectorClock: details.vectorClock ? [...details.vectorClock] : null,
      
      // Información de sincronización
      sourceNode: details.sourceNode || this.nodeId,
      targetNodes: details.targetNodes || [],
      syncStatus: details.syncStatus || null,
      
      // Información de conflicto
      conflictWith: details.conflictWith || null,
      conflictReason: details.conflictReason || null,
      resolution: details.resolution || null,
      
      // Resultado y errores
      result: details.result || null,
      error: details.error || null,
      errorDetails: details.errorDetails || null,
      
      // Contexto adicional
      metadata: details.metadata || {},
      
      // Duración de operación
      duration: details.duration || null
    };

    // Agregar al log
    this.auditLog.push(auditRecord);
    
    // Mantener índice por operationId
    this.operationIndex[operationId] = auditRecord;
    
    // Mantener índice por recurso
    const resourceId = auditRecord.resourceId;
    if (!this.resourceIndex[resourceId]) {
      this.resourceIndex[resourceId] = [];
    }
    this.resourceIndex[resourceId].push(operationId);
    
    // Limpiar si superamos límite
    if (this.auditLog.length > this.maxLogSize) {
      this._cleanOldestRecords(Math.floor(this.maxLogSize * 0.1));
    }

    logger.debug(`Audit: ${operationType}/${status} on ${resourceId}`, {
      operationId,
      lamportMark: auditRecord.lamportMark,
      vectorClock: auditRecord.vectorClock
    });

    return auditRecord;
  }

  /**
   * Registrar reserva creada
   */
  logReservationCreated(flightId, seatNumber, userId, lamportMark, vectorClock, duration) {
    return this.logOperation(
      OperationTypes.RESERVATION_CREATE,
      {
        flightId,
        seatNumber,
        userId,
        lamportMark,
        vectorClock,
        result: 'RESERVED'
      },
      OperationStatus.SUCCESS
    );
  }

  /**
   * Registrar reserva cancelada
   */
  logReservationCancelled(flightId, seatNumber, userId, lamportMark, vectorClock) {
    return this.logOperation(
      OperationTypes.RESERVATION_CANCEL,
      {
        flightId,
        seatNumber,
        userId,
        lamportMark,
        vectorClock,
        result: 'CANCELLED'
      },
      OperationStatus.SUCCESS
    );
  }

  /**
   * Registrar compra creada
   */
  logPurchaseCreated(flightId, seatNumber, userId, lamportMark, vectorClock) {
    return this.logOperation(
      OperationTypes.PURCHASE_CREATE,
      {
        flightId,
        seatNumber,
        userId,
        lamportMark,
        vectorClock,
        result: 'BOOKED'
      },
      OperationStatus.SUCCESS
    );
  }

  /**
   * Registrar compra cancelada (reembolso)
   */
  logPurchaseCancelled(flightId, seatNumber, userId, lamportMark, vectorClock) {
    return this.logOperation(
      OperationTypes.PURCHASE_CANCEL,
      {
        flightId,
        seatNumber,
        userId,
        lamportMark,
        vectorClock,
        result: 'REFUNDED'
      },
      OperationStatus.SUCCESS
    );
  }

  /**
   * Registrar conflicto detectado
   */
  logConflictDetected(flightId, seatNumber, conflictingNode, reason, lamportMark, vectorClock) {
    return this.logOperation(
      OperationTypes.CONFLICT_DETECTED,
      {
        flightId,
        seatNumber,
        lamportMark,
        vectorClock,
        conflictWith: conflictingNode,
        conflictReason: reason,
        result: 'CONFLICT_FOUND'
      },
      OperationStatus.CONFLICT
    );
  }

  /**
   * Registrar conflicto resuelto
   */
  logConflictResolved(flightId, seatNumber, winnerNode, resolution, reason, lamportMark, vectorClock) {
    return this.logOperation(
      OperationTypes.CONFLICT_RESOLVED,
      {
        flightId,
        seatNumber,
        lamportMark,
        vectorClock,
        conflictWith: winnerNode,
        resolution,
        conflictReason: reason,
        result: 'RESOLVED'
      },
      OperationStatus.SUCCESS
    );
  }

  /**
   * Registrar evento sincronizado enviado
   */
  logEventSyncSent(eventType, flightId, seatNumber, targetNodes, eventData, lamportMark, vectorClock) {
    return this.logOperation(
      OperationTypes.EVENT_SYNC_SENT,
      {
        flightId,
        seatNumber,
        lamportMark,
        vectorClock,
        sourceNode: this.nodeId,
        targetNodes,
        syncStatus: 'SENT',
        result: `Sent ${eventType} to ${targetNodes.length} nodes`,
        metadata: { eventType, eventDataSize: JSON.stringify(eventData).length }
      },
      OperationStatus.SUCCESS
    );
  }

  /**
   * Registrar evento sincronizado recibido
   */
  logEventSyncReceived(eventType, flightId, seatNumber, remoteNodeId, lamportMark, vectorClock) {
    return this.logOperation(
      OperationTypes.EVENT_SYNC_RECEIVED,
      {
        flightId,
        seatNumber,
        lamportMark,
        vectorClock,
        sourceNode: remoteNodeId,
        syncStatus: 'RECEIVED',
        result: `Received ${eventType} from Node ${remoteNodeId}`,
        metadata: { eventType, remoteNodeId }
      },
      OperationStatus.SUCCESS
    );
  }

  /**
   * Registrar error
   */
  logError(operationType, flightId, seatNumber, errorMessage, errorDetails = null, lamportMark = null, vectorClock = null) {
    return this.logOperation(
      OperationTypes.ERROR_OCCURRED,
      {
        flightId,
        seatNumber,
        lamportMark,
        vectorClock,
        error: errorMessage,
        errorDetails,
        result: 'ERROR'
      },
      OperationStatus.FAILED
    );
  }

  /**
   * Obtener log completo
   */
  getAllLogs(limit = 100, offset = 0) {
    const sorted = [...this.auditLog].sort((a, b) => b.timestampMs - a.timestampMs);
    return sorted.slice(offset, offset + limit);
  }

  /**
   * Buscar logs por filtros
   */
  searchLogs(filters = {}) {
    let results = [...this.auditLog];

    // Filtrar por tipo de operación
    if (filters.operationType) {
      results = results.filter(r => r.operationType === filters.operationType);
    }

    // Filtrar por estado
    if (filters.status) {
      results = results.filter(r => r.status === filters.status);
    }

    // Filtrar por nodo
    if (filters.nodeId) {
      results = results.filter(r => r.nodeId === filters.nodeId);
    }

    // Filtrar por recurso (flightId:seatNumber)
    if (filters.resourceId) {
      results = results.filter(r => r.resourceId === filters.resourceId);
    }

    // Filtrar por flight
    if (filters.flightId) {
      results = results.filter(r => r.flightId === filters.flightId);
    }

    // Filtrar por usuario
    if (filters.userId) {
      results = results.filter(r => r.userId === filters.userId);
    }

    // Filtrar por rango de tiempo
    if (filters.startTime && filters.endTime) {
      const start = new Date(filters.startTime).getTime();
      const end = new Date(filters.endTime).getTime();
      results = results.filter(r => r.timestampMs >= start && r.timestampMs <= end);
    }

    // Filtrar por conflictos
    if (filters.conflictsOnly) {
      results = results.filter(r => r.status === OperationStatus.CONFLICT);
    }

    // Ordenar por timestamp descendente
    results.sort((a, b) => b.timestampMs - a.timestampMs);

    // Limitar resultados
    const limit = filters.limit || 100;
    const offset = filters.offset || 0;
    return results.slice(offset, offset + limit);
  }

  /**
   * Obtener traza completa de un recurso
   */
  getResourceTrace(flightId, seatNumber) {
    const resourceId = `${flightId}:${seatNumber}`;
    const operationIds = this.resourceIndex[resourceId] || [];
    
    return operationIds
      .map(opId => this.operationIndex[opId])
      .sort((a, b) => a.timestampMs - b.timestampMs);
  }

  /**
   * Obtener línea temporal de evento para un usuario
   */
  getUserTimeline(userId, limit = 50) {
    return this.auditLog
      .filter(r => r.userId === userId)
      .sort((a, b) => b.timestampMs - a.timestampMs)
      .slice(0, limit);
  }

  /**
   * Obtener estadísticas de auditoría
   */
  getStatistics() {
    const stats = {
      totalOperations: this.auditLog.length,
      nodeId: this.nodeId,
      operationsByType: {},
      operationsByStatus: {},
      successRate: 0,
      conflictRate: 0,
      averageLatency: 0,
      recentLogs: this.auditLog.slice(-10)
    };

    // Contar por tipo y estado
    let totalDuration = 0;
    let operationsWithDuration = 0;

    for (const record of this.auditLog) {
      // Por tipo
      if (!stats.operationsByType[record.operationType]) {
        stats.operationsByType[record.operationType] = 0;
      }
      stats.operationsByType[record.operationType]++;

      // Por estado
      if (!stats.operationsByStatus[record.status]) {
        stats.operationsByStatus[record.status] = 0;
      }
      stats.operationsByStatus[record.status]++;

      // Latencia
      if (record.duration) {
        totalDuration += record.duration;
        operationsWithDuration++;
      }
    }

    // Calcular tasas
    const successCount = stats.operationsByStatus[OperationStatus.SUCCESS] || 0;
    const conflictCount = stats.operationsByStatus[OperationStatus.CONFLICT] || 0;

    stats.successRate = stats.totalOperations > 0 ? ((successCount / stats.totalOperations) * 100).toFixed(2) : 0;
    stats.conflictRate = stats.totalOperations > 0 ? ((conflictCount / stats.totalOperations) * 100).toFixed(2) : 0;
    stats.averageLatency = operationsWithDuration > 0 ? (totalDuration / operationsWithDuration).toFixed(2) : 0;

    return stats;
  }

  /**
   * Exportar logs a JSON
   */
  exportToJSON(filters = {}) {
    const records = this.searchLogs(filters);
    return {
      timestamp: new Date().toISOString(),
      nodeId: this.nodeId,
      totalRecords: records.length,
      records
    };
  }

  /**
   * Exportar logs a CSV
   */
  exportToCSV(filters = {}) {
    const records = this.searchLogs(filters);
    
    if (records.length === 0) {
      return 'No records found';
    }

    // Headers
    const headers = [
      'operationId',
      'timestamp',
      'nodeId',
      'operationType',
      'status',
      'resourceId',
      'userId',
      'lamportMark',
      'vectorClock',
      'sourceNode',
      'conflictWith',
      'resolution',
      'result',
      'error'
    ];

    // Body
    const rows = records.map(r => [
      r.operationId,
      r.timestamp,
      r.nodeId,
      r.operationType,
      r.status,
      r.resourceId,
      r.userId || '',
      r.lamportMark || '',
      r.vectorClock ? r.vectorClock.join(',') : '',
      r.sourceNode,
      r.conflictWith || '',
      r.resolution || '',
      r.result || '',
      r.error || ''
    ]);

    // Crear CSV
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    return csv;
  }

  /**
   * Limpiar registros antiguos
   */
  clearOldRecords(ageSeconds = 3600) {
    const cutoffTime = Date.now() - (ageSeconds * 1000);
    const initialLength = this.auditLog.length;

    this.auditLog = this.auditLog.filter(r => r.timestampMs > cutoffTime);

    // Reconstruir índices
    this.operationIndex = {};
    this.resourceIndex = {};

    for (const record of this.auditLog) {
      this.operationIndex[record.operationId] = record;
      
      const resourceId = record.resourceId;
      if (!this.resourceIndex[resourceId]) {
        this.resourceIndex[resourceId] = [];
      }
      this.resourceIndex[resourceId].push(record.operationId);
    }

    const deletedCount = initialLength - this.auditLog.length;
    logger.info(`Audit cleanup: deleted ${deletedCount} old records`, { ageSeconds });

    return deletedCount;
  }

  /**
   * Limpiar registros más antiguos (interno)
   */
  _cleanOldestRecords(count) {
    if (this.auditLog.length <= count) {
      return;
    }

    const sorted = this.auditLog.sort((a, b) => a.timestampMs - b.timestampMs);
    const toDelete = sorted.slice(0, count);
    const deleteIds = new Set(toDelete.map(r => r.operationId));

    this.auditLog = this.auditLog.filter(r => !deleteIds.has(r.operationId));

    // Actualizar índices
    for (const opId of deleteIds) {
      delete this.operationIndex[opId];
    }

    // Reconstruir resourceIndex
    this.resourceIndex = {};
    for (const record of this.auditLog) {
      const resourceId = record.resourceId;
      if (!this.resourceIndex[resourceId]) {
        this.resourceIndex[resourceId] = [];
      }
      this.resourceIndex[resourceId].push(record.operationId);
    }

    logger.debug(`Cleaned ${count} oldest audit records`);
  }

  /**
   * Limpiar todos los logs
   */
  clearAll() {
    const count = this.auditLog.length;
    this.auditLog = [];
    this.operationIndex = {};
    this.resourceIndex = {};
    logger.info(`Audit logs cleared: ${count} records deleted`);
    return count;
  }

  /**
   * Generar reporte de trazabilidad para un asiento
   */
  generateSeatTraceReport(flightId, seatNumber) {
    const trace = this.getResourceTrace(flightId, seatNumber);
    
    if (trace.length === 0) {
      return {
        flightId,
        seatNumber,
        status: 'NO_ACTIVITY',
        message: 'No operations found for this seat'
      };
    }

    const report = {
      flightId,
      seatNumber,
      resourceId: `${flightId}:${seatNumber}`,
      totalOperations: trace.length,
      timeline: trace.map(r => ({
        timestamp: r.timestamp,
        operation: r.operationType,
        status: r.status,
        node: r.nodeId,
        userId: r.userId,
        lamportMark: r.lamportMark,
        vectorClock: r.vectorClock,
        result: r.result,
        conflict: r.status === OperationStatus.CONFLICT ? {
          conflictWith: r.conflictWith,
          reason: r.conflictReason,
          resolution: r.resolution
        } : null
      })),
      summary: {
        reservations: trace.filter(r => r.operationType === OperationTypes.RESERVATION_CREATE).length,
        purchases: trace.filter(r => r.operationType === OperationTypes.PURCHASE_CREATE).length,
        conflicts: trace.filter(r => r.status === OperationStatus.CONFLICT).length,
        nodes: [...new Set(trace.map(r => r.nodeId))].sort()
      }
    };

    return report;
  }

  /**
   * Generar reporte de sincronización
   */
  generateSyncReport() {
    const syncSent = this.auditLog.filter(r => r.operationType === OperationTypes.EVENT_SYNC_SENT);
    const syncReceived = this.auditLog.filter(r => r.operationType === OperationTypes.EVENT_SYNC_RECEIVED);
    const conflicts = this.auditLog.filter(r => r.status === OperationStatus.CONFLICT);

    return {
      timestamp: new Date().toISOString(),
      nodeId: this.nodeId,
      eventsSent: syncSent.length,
      eventsReceived: syncReceived.length,
      conflictsDetected: conflicts.length,
      successfulOperations: this.auditLog.filter(r => r.status === OperationStatus.SUCCESS).length,
      failedOperations: this.auditLog.filter(r => r.status === OperationStatus.FAILED).length,
      recentConflicts: conflicts.slice(-5),
      Summary: {
        totalOperations: this.auditLog.length,
        successRate: this.getStatistics().successRate,
        conflictRate: this.getStatistics().conflictRate
      }
    };
  }
}

export default AuditService;
