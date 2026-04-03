/**
 * Servicio de Sincronización de Eventos
 * Permite a los nodos comunicarse y sincronizar eventos con marca Lamport y Vector Clock
 * 
 * Proporciona:
 * - Envío de eventos a nodos remotos con Lamport Clock y Vector Clock
 * - Recepción de eventos remotos
 * - Actualización del reloj Lamport y Vector Clock al recibir eventos
 * - Detección de causalidad entre eventos
 */

import axios from 'axios';
import Logger from '../utils/logger.js';

const logger = new Logger(process.env.LOG_LEVEL || 'info');

export class EventSyncService {
  constructor(nodeId, otherNodesUrls = []) {
    this.nodeId = nodeId;
    this.otherNodesUrls = otherNodesUrls;
    this.lamportClock = null;
    this.vectorClock = null;
    this.eventBuffer = [];
    this.failedSends = [];
    this.useVectorClock = false; // Flag para usar Vector Clock
  }

  /**
   * Establecer referencia al reloj Lamport
   * @param {LamportClockService} lamportClock 
   */
  setLamportClock(lamportClock) {
    this.lamportClock = lamportClock;
  }

  /**
   * Establecer referencia al Vector Clock
   * @param {VectorClockService} vectorClock 
   */
  setVectorClock(vectorClock) {
    this.vectorClock = vectorClock;
    this.useVectorClock = true;
  }

  /**
   * Registrar URLs de nodos remotos
   * @param {Array<string>} urls - Array de URLs como ['http://localhost:3001', 'http://localhost:3002']
   */
  setRemoteNodes(urls) {
    this.otherNodesUrls = urls.filter(url => url); // Filtrar URLs válidas
    logger.info('Nodos remotos registrados', { 
      nodeId: this.nodeId,
      remoteNodes: this.otherNodesUrls 
    });
  }

  /**
   * Obtener lista de nodos remotos este nodo
   * @param {number} currentNodePort - Puerto del nodo actual
   * @returns {Array<string>} URLs de otros nodos
   */
  static getRemoteNodeUrls(currentNodePort) {
    const ports = [3001, 3002, 3003];
    return ports
      .filter(port => port !== currentNodePort)
      .map(port => `http://localhost:${port}`);
  }

  /**
   * Broadcast de evento a nodos remotos
   * @param {Object} event - Evento a enviar
   * @param {number} lamportMark - Marca Lamport del evento
   * @param {Array} vectorClock - Vector Clock del evento (opcional)
   * @param {boolean} retryOnFail - Reintentar si falla
   */
  async broadcastEvent(event, lamportMark, vectorClock = null, retryOnFail = true) {
    if (!this.otherNodesUrls || this.otherNodesUrls.length === 0) {
      logger.debug('Sin nodos remotos para broadcast', { nodeId: this.nodeId });
      return { success: true, sent: 0, failed: 0 };
    }

    const payload = {
      lamportMark,
      vectorClock: vectorClock || (this.vectorClock ? this.vectorClock.getVector() : null),
      event,
      sourceNodeId: this.nodeId,
      timestamp: new Date().toISOString(),
      useVectorClock: this.useVectorClock
    };

    let sent = 0;
    let failed = 0;

    for (const remoteUrl of this.otherNodesUrls) {
      try {
        await axios.post(`${remoteUrl}/sync/events`, payload, {
          timeout: 3000,
          validateStatus: () => true // No lanzar error en cualquier status
        });

        sent++;
        logger.debug('Evento enviado a nodo remoto', {
          nodeId: this.nodeId,
          targetNode: remoteUrl,
          eventAction: event.action,
          lamportMark,
          vectorClock: vectorClock ? `[${vectorClock.join(',')}]` : null
        });
      } catch (error) {
        failed++;
        logger.warn('Fallo al enviar evento a nodo remoto', {
          nodeId: this.nodeId,
          targetNode: remoteUrl,
          error: error.message
        });

        if (retryOnFail) {
          this.failedSends.push({
            timestamp: new Date().toISOString(),
            targetNode: remoteUrl,
            event,
            lamportMark,
            vectorClock
          });
        }
      }
    }

    return { success: true, sent, failed, totalRemoteNodes: this.otherNodesUrls.length };
  }

  /**
   * Procesar evento remoto recibido
   * Actualiza el reloj Lamport y Vector Clock, registra el evento
   * @param {Object} payload - { lamportMark, vectorClock, event, sourceNodeId, timestamp }
   * @returns {Object} Resultado del procesamiento
   */
  processRemoteEvent(payload) {
    if (!payload || !payload.lamportMark || !payload.event) {
      logger.warn('Payload de evento remoto inválido', { payload });
      return { success: false, error: 'Payload inválido' };
    }

    const { lamportMark, vectorClock, event, sourceNodeId, useVectorClock } = payload;

    try {
      let updatedLamportMark = null;
      let updatedVectorClock = null;

      // Actualizar reloj Lamport
      if (this.lamportClock) {
        updatedLamportMark = this.lamportClock.update(lamportMark);
        this.lamportClock.recordEvent(event, updatedLamportMark, 'REMOTE');
      }

      // Actualizar Vector Clock si está disponible
      if (this.vectorClock && vectorClock) {
        updatedVectorClock = this.vectorClock.update(vectorClock);
        this.vectorClock.recordEvent(event, updatedVectorClock, 'REMOTE');
      }

      logger.info('Evento remoto procesado', {
        nodeId: this.nodeId,
        sourceNodeId,
        remoteEventId: event.id,
        remoteLamportMark: lamportMark,
        updatedLocalMark: updatedLamportMark,
        remoteVectorClock: vectorClock ? `[${vectorClock.join(',')}]` : null,
        updatedVectorClock: updatedVectorClock ? `[${updatedVectorClock.join(',')}]` : null,
        eventAction: event.action
      });

      return {
        success: true,
        newLamportMark: updatedLamportMark,
        newVectorClock: updatedVectorClock,
        sourceNodeId,
        eventId: event.id,
        eventAction: event.action
      };
    } catch (error) {
      logger.error('Error procesando evento remoto', {
        nodeId: this.nodeId,
        error: error.message,
        eventId: event.id
      });

      return { success: false, error: error.message };
    }
  }

  /**
   * Reintentar eventos que fallaron
   * Intenta reenviar eventos que no se pudieron entregar
   */
  async retryFailedSends() {
    if (this.failedSends.length === 0) {
      logger.debug('Sin eventos fallidos para reintentar', { nodeId: this.nodeId });
      return { attempted: 0, succeeded: 0, failed: 0 };
    }

    let succeeded = 0;
    let failed = 0;
    const stillFailed = [];

    for (const attempt of this.failedSends) {
      try {
        const response = await axios.post(`${attempt.targetNode}/sync/events`, {
          lamportMark: attempt.lamportMark,
          event: attempt.event,
          sourceNodeId: this.nodeId,
          timestamp: new Date().toISOString(),
          isRetry: true
        }, {
          timeout: 3000
        });

        if (response.status === 200) {
          succeeded++;
        } else {
          stillFailed.push(attempt);
          failed++;
        }
      } catch (error) {
        stillFailed.push(attempt);
        failed++;
      }
    }

    this.failedSends = stillFailed;

    return {
      attempted: succeeded + failed,
      succeeded,
      failed,
      stillPending: this.failedSends.length
    };
  }

  /**
   * Obtener estadísticas de sincronización
   * @returns {Object} Estadísticas
   */
  getStats() {
    return {
      nodeId: this.nodeId,
      remoteNodes: this.otherNodesUrls.length,
      failedSendsBuffer: this.failedSends.length,
      nodeUrls: this.otherNodesUrls
    };
  }

  /**
   * Obtener estado de los eventos no enviados
   * @returns {Array} Buffer de eventos fallidos
   */
  getFailedSends() {
    return this.failedSends;
  }

  /**
   * Limpiar buffer de eventos no enviados
   */
  clearFailedSends() {
    this.failedSends = [];
    logger.info('Buffer de eventos fallidos limpiado', { nodeId: this.nodeId });
  }
}

export default EventSyncService;
