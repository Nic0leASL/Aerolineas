/**
 * Servicio de Reloj Vectorial
 * Proporciona información de causalidad más precisa que Lamport Clock
 * 
 * Vector Clock Algorithm:
 * - Cada nodo mantiene vector V[1..n] donde n = número de nodos
 * - En evento local: V[nodeId] = V[nodeId] + 1
 * - Al recibir evento remoto con vector V':
 *   V[j] = max(V[j], V'[j]) para todo j
 *   Luego V[nodeId] = V[nodeId] + 1
 * 
 * Comparación:
 * - V1 < V2 (V1 happened-before V2) si V1[j] <= V2[j] para todo j
 *   y existe k donde V1[k] < V2[k]
 * - V1 || V2 (concurrente) si no V1 < V2 y no V2 < V1
 */

import Logger from '../utils/logger.js';

const logger = new Logger(process.env.LOG_LEVEL || 'info');

export class VectorClockService {
  /**
   * Constructor
   * @param {number} nodeId - Identificador del nodo (1, 2, 3)
   * @param {number} totalNodes - Número total de nodos en el sistema
   */
  constructor(nodeId, totalNodes = 3) {
    this.nodeId = nodeId;
    this.totalNodes = totalNodes;
    
    // Inicializar vector: [0, 0, 0] para 3 nodos
    this.vector = new Array(totalNodes + 1).fill(0); // índice 0 no usado
    
    // Historial de eventos con sus vectores
    this.eventHistory = [];
    
    // Pares de eventos concurrentes detectados
    this.concurrentEvents = [];
    
    logger.info(`VectorClock inicializado`, {
      nodeId: this.nodeId,
      totalNodes: this.totalNodes,
      initialVector: this.getVector()
    });
  }

  /**
   * Obtener copia del vector actual
   * @returns {Array} Vector actual
   */
  getVector() {
    return [...this.vector];
  }

  /**
   * Incrementar la posición propia en evento local
   * @returns {Array} Nuevo vector después del incremento
   */
  increment() {
    this.vector[this.nodeId]++;
    return this.getVector();
  }

  /**
   * Obtener marca vectorial para evento local
   * Incrementa y retorna
   * @returns {Array} Vector después del incremento
   */
  getLocalMark() {
    return this.increment();
  }

  /**
   * Fusionar vector recibido de nodo remoto
   * Implementa: V[j] = max(V[j], V'[j]) para todo j
   * @param {Array} remoteVector - Vector recibido del evento remoto
   * @returns {Array} Nuevo vector después de la fusión
   */
  update(remoteVector) {
    if (!remoteVector || !Array.isArray(remoteVector)) {
      logger.warn('Vector remoto inválido', { remoteVector });
      return this.getVector();
    }

    // Fusionar posición por posición
    for (let i = 1; i <= this.totalNodes; i++) {
      this.vector[i] = Math.max(this.vector[i], remoteVector[i] || 0);
    }

    // Luego incrementar la posición propia
    this.vector[this.nodeId]++;
    
    return this.getVector();
  }

  /**
   * Registrar evento con su vector
   * @param {Object} event - Evento a registrar
   * @param {Array} vector - Vector del evento
   * @param {string} source - 'LOCAL' o 'REMOTE'
   */
  recordEvent(event, vector, source = 'LOCAL') {
    const record = {
      id: event.id || 'unknown',
      action: event.action || 'unknown',
      nodeId: event.nodeId || this.nodeId,
      vector: [...vector],
      source: source,
      timestamp: new Date().toISOString(),
      flightId: event.flightId || null,
      seatNumber: event.seatNumber || null,
      lamportClock: event.lamportClock || null
    };

    this.eventHistory.push(record);

    logger.debug(`Evento registrado con vector`, {
      action: event.action,
      vector: this.vectorToString(vector),
      source,
      nodeId: this.nodeId
    });
  }

  /**
   * Comparar dos vectores para detectar relación de causalidad
   * @param {Array} v1 - Primer vector
   * @param {Array} v2 - Segundo vector
   * @returns {string} 'happens-before', 'happened-after', 'concurrent', o 'equal'
   */
  compareVectors(v1, v2) {
    if (!v1 || !v2) return 'invalid';

    // Verificar igualdad
    if (this.vectorsEqual(v1, v2)) {
      return 'equal';
    }

    // Verificar si v1 < v2 (happened-before)
    let v1LessOrEqual = true;
    let v1StrictlyLess = false;

    for (let i = 1; i <= this.totalNodes; i++) {
      const val1 = v1[i] || 0;
      const val2 = v2[i] || 0;

      if (val1 > val2) {
        v1LessOrEqual = false;
        break;
      }
      if (val1 < val2) {
        v1StrictlyLess = true;
      }
    }

    if (v1LessOrEqual && v1StrictlyLess) {
      return 'happens-before';
    }

    // Verificar si v2 < v1 (happened-after)
    let v2LessOrEqual = true;
    let v2StrictlyLess = false;

    for (let i = 1; i <= this.totalNodes; i++) {
      const val1 = v1[i] || 0;
      const val2 = v2[i] || 0;

      if (val2 > val1) {
        v2LessOrEqual = false;
        break;
      }
      if (val2 < val1) {
        v2StrictlyLess = true;
      }
    }

    if (v2LessOrEqual && v2StrictlyLess) {
      return 'happened-after';
    }

    // Si no es ni antes ni después, son concurrentes
    return 'concurrent';
  }

  /**
   * Verificar si dos vectores son iguales
   * @param {Array} v1 - Primer vector
   * @param {Array} v2 - Segundo vector
   * @returns {boolean} true si son iguales
   */
  vectorsEqual(v1, v2) {
    if (!v1 || !v2) return false;
    for (let i = 1; i <= this.totalNodes; i++) {
      if ((v1[i] || 0) !== (v2[i] || 0)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Detectar todos los pares concurrentes en el historial
   * @returns {Array} Array de pares concurrentes
   */
  detectConcurrentEvents() {
    this.concurrentEvents = [];

    for (let i = 0; i < this.eventHistory.length; i++) {
      for (let j = i + 1; j < this.eventHistory.length; j++) {
        const comparison = this.compareVectors(
          this.eventHistory[i].vector,
          this.eventHistory[j].vector
        );

        if (comparison === 'concurrent') {
          this.concurrentEvents.push({
            event1: {
              id: this.eventHistory[i].id,
              action: this.eventHistory[i].action,
              nodeId: this.eventHistory[i].nodeId,
              vector: this.vectorToString(this.eventHistory[i].vector)
            },
            event2: {
              id: this.eventHistory[j].id,
              action: this.eventHistory[j].action,
              nodeId: this.eventHistory[j].nodeId,
              vector: this.vectorToString(this.eventHistory[j].vector)
            },
            relation: 'concurrent'
          });
        }
      }
    }

    return this.concurrentEvents;
  }

  /**
   * Obtener historial de eventos ordenado por vector
   * @param {number} limit - Máximo número de eventos
   * @returns {Array} Eventos ordenados
   */
  getOrderedHistory(limit = 50) {
    return this.eventHistory
      .slice(-limit)
      .map(e => ({
        ...e,
        vectorString: this.vectorToString(e.vector)
      }));
  }

  /**
   * Convertir vector a string para visualización
   * @param {Array} vector - Vector a convertir
   * @returns {string} Representación en string
   */
  vectorToString(vector) {
    if (!vector) return 'null';
    const parts = [];
    for (let i = 1; i <= this.totalNodes; i++) {
      parts.push(vector[i] || 0);
    }
    return `[${parts.join(',')}]`;
  }

  /**
   * Obtener estadísticas del vector clock
   * @returns {Object} Estadísticas
   */
  getStats() {
    const concurrent = this.detectConcurrentEvents();

    return {
      nodeId: this.nodeId,
      totalNodes: this.totalNodes,
      currentVector: this.vectorToString(this.vector),
      totalEventsRecorded: this.eventHistory.length,
      localEvents: this.eventHistory.filter(e => e.source === 'LOCAL').length,
      remoteEvents: this.eventHistory.filter(e => e.source === 'REMOTE').length,
      concurrentEventPairs: concurrent.length,
      statistics: {
        eventsByNode: this.getEventsByNode(),
        maxVectorValues: this.getMaxVectorValues()
      }
    };
  }

  /**
   * Contar eventos por nodo
   * @returns {Object} Eventos por nodo
   */
  getEventsByNode() {
    const result = {};
    for (let i = 1; i <= this.totalNodes; i++) {
      result[`node_${i}`] = this.eventHistory.filter(e => e.nodeId === i).length;
    }
    return result;
  }

  /**
   * Obtener máximo valor en cada posición del vector
   * @returns {Array} Máximos por posición
   */
  getMaxVectorValues() {
    const maxValues = new Array(this.totalNodes + 1).fill(0);
    for (const event of this.eventHistory) {
      for (let i = 1; i <= this.totalNodes; i++) {
        maxValues[i] = Math.max(maxValues[i], event.vector[i] || 0);
      }
    }
    return maxValues.slice(1);
  }

  /**
   * Resetear vector clock
   */
  reset() {
    this.vector = new Array(this.totalNodes + 1).fill(0);
    this.eventHistory = [];
    this.concurrentEvents = [];
    logger.info('VectorClock reseteado', { nodeId: this.nodeId });
  }
}

export default VectorClockService;
