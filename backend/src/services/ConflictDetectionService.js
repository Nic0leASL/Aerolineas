/**
 * Servicio de Detección y Resolución de Conflictos
 * Previene doble reserva/compra del mismo asiento detectando operaciones concurrentes
 * 
 * Utiliza Vector Clocks para:
 * - Detectar eventos concurrentes del mismo recurso (asiento)
 * - Resolver conflictos aplicando criterios consistentes
 * - Registrar todos los conflictos detectados
 */

import Logger from '../utils/logger.js';

const logger = new Logger(process.env.LOG_LEVEL || 'info');

export class ConflictDetectionService {
  /**
   * Constructor
   * @param {VectorClockService} vectorClock - Servicio de Vector Clock
   * @param {LamportClockService} lamportClock - Servicio de Lamport Clock
   * @param {number} nodeId - ID del nodo actual
   */
  constructor(vectorClock = null, lamportClock = null, nodeId = 1) {
    this.vectorClock = vectorClock;
    this.lamportClock = lamportClock;
    this.nodeId = nodeId;
    
    // Historial de conflictos detectados
    this.conflictHistory = [];
    
    // Registro de operaciones activas por recurso (asiento)
    // Estructura: { "flightId:seatNumber": [event1, event2, ...] }
    this.operationRegistry = {};
    
    logger.info('ConflictDetectionService inicializado', {
      nodeId: this.nodeId,
      hasVectorClock: !!vectorClock,
      hasLamportClock: !!lamportClock
    });
  }

  /**
   * Detectar conflicto para un nuevo evento
   * Verifica si hay operaciones concurrentes del mismo asiento
   * 
   * @param {Object} newEvent - Nuevo evento de RESERVE o PURCHASE
   * @returns {Object} { isConflict: boolean, conflictingEvent: object, resolution: string, winner: number }
   */
  detectConflict(newEvent) {
    const { flightId, seatNumber, action, nodeId, timestamp, vectorClock, id } = newEvent;
    
    if (!flightId || !seatNumber) {
      return {
        isConflict: false,
        error: 'Evento sin flightId o seatNumber'
      };
    }

    const resourceKey = `${flightId}:${seatNumber}`;
    const operations = this.operationRegistry[resourceKey] || [];

    // Buscar operaciones concurrentes
    const conflictingOps = operations.filter(op => {
      // Ignorar el mismo evento
      if (op.id === id) return false;
      
      // Solo considerar conflicto si es la misma acción o ambos son de asignación
      if (op.action !== action) return false;
      
      // Detectar concurrencia usando Vector Clocks
      if (vectorClock && op.vectorClock) {
        const relation = this.compareVectorClocks(vectorClock, op.vectorClock);
        
        // Conflicto si son concurrentes
        if (relation === 'concurrent') {
          return true;
        }
        
        // Si uno precede al otro, no es conflicto
        if (relation === 'less' || relation === 'greater') {
          return false;
        }
      }
      
      // Fallback: usar timestamp si Vector Clock no está disponible
      const timeDiff = Math.abs(new Date(timestamp) - new Date(op.timestamp));
      return timeDiff < 1000; // 1 segundo de ventana
    });

    if (conflictingOps.length === 0) {
      return {
        isConflict: false,
        conflictingEvents: []
      };
    }

    // Hay conflicto(s)
    const resolution = this.resolveConflict(newEvent, conflictingOps);

    // Registrar conflicto
    this.conflictHistory.push({
      timestamp: new Date().toISOString(),
      resourceKey,
      flightId,
      seatNumber,
      newEventId: id,
      newEventNode: nodeId,
      conflictingEvents: conflictingOps.map(e => ({
        eventId: e.id,
        nodeId: e.nodeId,
        timestamp: e.timestamp
      })),
      resolution: resolution.winner === nodeId ? 'WON' : 'LOST',
      winnerNodeId: resolution.winner,
      reason: resolution.reason
    });

    logger.warn('Conflicto detectado', {
      nodeId: this.nodeId,
      resourceKey,
      action,
      newEventNode: nodeId,
      conflictingCount: conflictingOps.length,
      winner: resolution.winner,
      reason: resolution.reason
    });

    return {
      isConflict: true,
      conflictingEvents: conflictingOps,
      resolution: resolution.winner === nodeId ? 'ACCEPT' : 'REJECT',
      winner: resolution.winner,
      winnerNodeId: resolution.winner === nodeId ? this.nodeId : conflictingOps[0].nodeId,
      reason: resolution.reason
    };
  }

  /**
   * Comparar dos Vector Clocks
   * @param {Array} vc1 - Primer vector
   * @param {Array} vc2 - Segundo vector
   * @returns {string} 'less', 'greater', 'equal', 'concurrent'
   */
  compareVectorClocks(vc1, vc2) {
    if (!vc1 || !vc2 || !Array.isArray(vc1) || !Array.isArray(vc2)) {
      return 'unknown';
    }

    let isLess = true;
    let isGreater = true;

    for (let i = 0; i < Math.max(vc1.length, vc2.length); i++) {
      const v1 = vc1[i] || 0;
      const v2 = vc2[i] || 0;

      if (v1 > v2) isLess = false;
      if (v1 < v2) isGreater = false;
    }

    if (isLess && !isGreater) return 'less';
    if (isGreater && !isLess) return 'greater';
    if (isLess && isGreater) return 'equal';
    return 'concurrent';
  }

  /**
   * Resolver conflicto aplicando criterios consistentes
   * 
   * Criterios (en orden):
   * 1. Vector Clock: El que tiene vector mayor gana
   * 2. Timestamp: El que llegó primero gana
   * 3. Node ID: El nodo con ID menor gana (tiebreaker)
   * 
   * @private
   */
  resolveConflict(newEvent, conflictingOps) {
    if (conflictingOps.length === 0) {
      return { winner: newEvent.nodeId, reason: 'no conflicts' };
    }

    const candidates = [newEvent, ...conflictingOps];
    let winner = newEvent;
    let reason = 'initial';

    // Criterio 1: Vector Clock
    if (newEvent.vectorClock && conflictingOps[0].vectorClock) {
      let maxVectorEvent = newEvent;
      let maxVector = newEvent.vectorClock;

      for (const event of conflictingOps) {
        const relation = this.compareVectorClocks(maxVector, event.vectorClock);
        if (relation === 'less') {
          maxVectorEvent = event;
          maxVector = event.vectorClock;
        }
      }

      winner = maxVectorEvent;
      reason = 'vector_clock_greater';
    } 
    // Criterio 2: Timestamp
    else if (newEvent.timestamp && conflictingOps[0].timestamp) {
      let earliestEvent = newEvent;
      let earliestTime = new Date(newEvent.timestamp);

      for (const event of conflictingOps) {
        const eventTime = new Date(event.timestamp);
        if (eventTime < earliestTime) {
          earliestEvent = event;
          earliestTime = eventTime;
        }
      }

      winner = earliestEvent;
      reason = 'timestamp_earlier';
    }
    // Criterio 3: Node ID (ultimo recurso)
    else {
      let winnerNodeId = newEvent.nodeId;
      winner = newEvent;

      for (const event of conflictingOps) {
        if (event.nodeId < winnerNodeId) {
          winnerNodeId = event.nodeId;
          winner = event;
        }
      }

      reason = 'node_id_lower';
    }

    logger.debug('Conflicto resuelto', {
      reason,
      winnerNodeId: winner.nodeId,
      winnerEventId: winner.id
    });

    return { winner: winner.nodeId, reason };
  }

  /**
   * Registrar una operación en el registro
   * Se usa para rastrear operaciones activas en cada recurso
   * 
   * @param {Object} event - Evento a registrar
   */
  registerOperation(event) {
    if (!event.flightId || !event.seatNumber) {
      return;
    }

    const resourceKey = `${event.flightId}:${event.seatNumber}`;
    
    if (!this.operationRegistry[resourceKey]) {
      this.operationRegistry[resourceKey] = [];
    }

    this.operationRegistry[resourceKey].push({
      id: event.id,
      nodeId: event.nodeId,
      action: event.action,
      timestamp: event.timestamp,
      vectorClock: event.vectorClock,
      lamportClock: event.lamportClock,
      registeredAt: new Date().toISOString()
    });

    // Mantener solo los últimos 100 eventos por recurso
    if (this.operationRegistry[resourceKey].length > 100) {
      this.operationRegistry[resourceKey] = this.operationRegistry[resourceKey].slice(-100);
    }

    logger.debug('Operación registrada', {
      resourceKey,
      eventId: event.id,
      action: event.action
    });
  }

  /**
   * Limpiar operaciones antiguas del registro
   * Llamar periódicamente para evitar memory leak
   * 
   * @param {number} maxAgeSeconds - Operaciones más antiguas que esto se eliminan
   */
  cleanupOldOperations(maxAgeSeconds = 3600) {
    const cutoffTime = new Date(Date.now() - maxAgeSeconds * 1000);
    let cleanedCount = 0;

    for (const resourceKey in this.operationRegistry) {
      const operations = this.operationRegistry[resourceKey];
      const beforeCount = operations.length;

      this.operationRegistry[resourceKey] = operations.filter(op => {
        return new Date(op.registeredAt) > cutoffTime;
      });

      cleanedCount += beforeCount - this.operationRegistry[resourceKey].length;
    }

    if (cleanedCount > 0) {
      logger.info('Operaciones antiguas limpiadas', {
        cleanedCount,
        maxAgeSeconds
      });
    }
  }

  /**
   * Obtener historial de conflictos
   * @param {number} limit - Máximo número de conflictos a retornar
   * @returns {Array} Conflictos más recientes
   */
  getConflictHistory(limit = 50) {
    return this.conflictHistory.slice(-limit);
  }

  /**
   * Obtener estadísticas de conflictos
   * @returns {Object} Estadísticas
   */
  getStats() {
    // Contar conflictos ganados/perdidos
    const winCount = this.conflictHistory.filter(c => c.resolution === 'WON').length;
    const lossCount = this.conflictHistory.filter(c => c.resolution === 'LOST').length;

    // Agrupar conflictos por razón
    const reasonCounts = {};
    this.conflictHistory.forEach(c => {
      reasonCounts[c.reason] = (reasonCounts[c.reason] || 0) + 1;
    });

    // Contar operaciones activas
    const activeOperations = Object.values(this.operationRegistry)
      .reduce((sum, ops) => sum + ops.length, 0);

    return {
      nodeId: this.nodeId,
      totalConflicts: this.conflictHistory.length,
      conflictsWon: winCount,
      conflictsLost: lossCount,
      winRate: this.conflictHistory.length > 0 ? (winCount / this.conflictHistory.length * 100).toFixed(2) + '%' : 'N/A',
      resolutionReasons: reasonCounts,
      activeTrackedResources: Object.keys(this.operationRegistry).length,
      activeOperations: activeOperations,
      lastConflict: this.conflictHistory.length > 0 ? this.conflictHistory[this.conflictHistory.length - 1] : null
    };
  }

  /**
   * Obtener conflictos para un recurso específico
   * @param {string} flightId - ID del vuelo
   * @param {number} seatNumber - Número del asiento
   * @returns {Array} Conflictos de ese asiento
   */
  getConflictsForSeat(flightId, seatNumber) {
    const resourceKey = `${flightId}:${seatNumber}`;
    return this.conflictHistory.filter(c => c.resourceKey === resourceKey);
  }

  /**
   * Resetear servicio
   */
  reset() {
    this.conflictHistory = [];
    this.operationRegistry = {};
    logger.info('ConflictDetectionService reseteado', { nodeId: this.nodeId });
  }
}

export default ConflictDetectionService;
