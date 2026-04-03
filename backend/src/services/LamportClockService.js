/**
 * Servicio de Reloj Lógico de Lamport
 * Proporciona un contador lógico para ordenar eventos distribuidos
 * 
 * Algoritmo de Lamport:
 * - Cada nodo mantiene un contador (iniciado en nodeId * 1000)
 * - En evento local: L = L + 1, luego adjuntar L al evento
 * - Al recibir evento remoto con marca L': L = max(L, L') + 1
 */

import Logger from '../utils/logger.js';

const logger = new Logger(process.env.LOG_LEVEL || 'info');

export class LamportClockService {
  /**
   * Constructor
   * @param {number} nodeId - Identificador único del nodo (1, 2, 3, etc)
   */
  constructor(nodeId) {
    this.nodeId = nodeId;
    // Iniciar con valor único por nodo para evitar colisiones
    this.clock = nodeId * 10000;
    this.eventHistory = [];
    
    logger.info(`LamportClock inicializado`, { 
      nodeId: this.nodeId, 
      initialClock: this.clock 
    });
  }

  /**
   * Incrementar reloj local (evento local)
   * @returns {number} Nueva marca Lamport
   */
  increment() {
    this.clock++;
    return this.clock;
  }

  /**
   * Actualizar reloj recibiendo evento remoto
   * @param {number} remoteLamportClock - Marca recibida de nodo remoto
   * @returns {number} Nueva marca Lamport local
   */
  update(remoteLamportClock) {
    if (!Number.isInteger(remoteLamportClock)) {
      logger.warn('Marca Lamport remota inválida', { remoteLamportClock });
      return this.increment();
    }

    this.clock = Math.max(this.clock, remoteLamportClock) + 1;
    return this.clock;
  }

  /**
   * Obtener marca actual sin incrementar
   * @returns {number} Marca Lamport actual
   */
  getClock() {
    return this.clock;
  }

  /**
   * Obtener marca Lamport para evento local
   * Incrementa y retorna
   * @returns {number} Marca Lamport
   */
  getLocalMark() {
    return this.increment();
  }

  /**
   * Registrar evento en historial
   * @param {Object} event - Evento a registrar
   * @param {number} lamportMark - Marca Lamport del evento
   * @param {string} source - Fuente: 'LOCAL' o 'REMOTE'
   */
  recordEvent(event, lamportMark, source = 'LOCAL') {
    const record = {
      lamportMark,
      nodeId: this.nodeId,
      source,
      timestamp: new Date().toISOString(),
      eventId: event.id || 'unknown',
      eventAction: event.action || 'unknown',
      eventNodeId: event.nodeId || null,
      flightId: event.flightId || null,
      seatNumber: event.seatNumber || null
    };

    this.eventHistory.push(record);

    logger.debug(`Evento registrado en LamportClock`, {
      lamportMark,
      source,
      eventAction: event.action,
      nodeId: this.nodeId
    });
  }

  /**
   * Obtener historial de eventos ordenados por Lamport
   * @param {number} limit - Número máximo de eventos a retornar
   * @returns {Array} Eventos ordenados por marca Lamport
   */
  getOrderedHistory(limit = 50) {
    return this.eventHistory
      .slice(-limit)
      .sort((a, b) => a.lamportMark - b.lamportMark);
  }

  /**
   * Buscar relación causal entre dos eventos
   * @param {number} mark1 - Primera marca Lamport
   * @param {number} mark2 - Segunda marca Lamport
   * @returns {string} 'before', 'after', o 'concurrent'
   */
  determineCausality(mark1, mark2) {
    if (mark1 < mark2) return 'before';
    if (mark1 > mark2) return 'after';
    return 'concurrent'; // Mismo reloj = events concurrentes o en mismo nodo
  }

  /**
   * Obtener estadísticas del reloj
   * @returns {Object} Estadísticas
   */
  getStats() {
    return {
      nodeId: this.nodeId,
      currentClock: this.clock,
      totalEventsRecorded: this.eventHistory.length,
      localEvents: this.eventHistory.filter(e => e.source === 'LOCAL').length,
      remoteEvents: this.eventHistory.filter(e => e.source === 'REMOTE').length,
      timeSpan: this.eventHistory.length > 0 ? {
        minMark: Math.min(...this.eventHistory.map(e => e.lamportMark)),
        maxMark: Math.max(...this.eventHistory.map(e => e.lamportMark))
      } : null
    };
  }

  /**
   * Obtener relaciones de causalidad entre todos los eventos
   * @returns {Array} Array de tuplas de causalidad
   */
  getCausalityMatrix() {
    const sorted = this.getOrderedHistory();
    const relations = [];

    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const causality = this.determineCausality(
          sorted[i].lamportMark,
          sorted[j].lamportMark
        );

        relations.push({
          event1: {
            lamportMark: sorted[i].lamportMark,
            action: sorted[i].eventAction,
            nodeId: sorted[i].nodeId
          },
          event2: {
            lamportMark: sorted[j].lamportMark,
            action: sorted[j].eventAction,
            nodeId: sorted[j].nodeId
          },
          relation: causality,
          sequence: `${sorted[i].lamportMark} → ${sorted[j].lamportMark}`
        });
      }
    }

    return relations;
  }

  /**
   * Resetear reloj (útil para pruebas)
   */
  reset() {
    this.clock = this.nodeId * 10000;
    this.eventHistory = [];
    logger.info('LamportClock reseteado', { nodeId: this.nodeId });
  }
}

export default LamportClockService;
