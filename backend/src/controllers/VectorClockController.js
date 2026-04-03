/**
 * Controlador de Vector Clock
 * Endpoints para consultar estado y relaciones de vector clocks
 */

import Logger from '../utils/logger.js';

const logger = new Logger(process.env.LOG_LEVEL || 'info');

export class VectorClockController {
  constructor(vectorClock, lamportClock) {
    this.vectorClock = vectorClock;
    this.lamportClock = lamportClock;
    this.nodeId = vectorClock.nodeId;
  }

  /**
   * Obtener información del vector clock actual
   * GET /sync/vector-clock
   */
  async getVectorClockInfo(req, res) {
    try {
      const stats = this.vectorClock.getStats();

      return res.status(200).json({
        success: true,
        data: {
          nodeId: this.nodeId,
          currentVector: this.vectorClock.vectorToString(this.vectorClock.getVector()),
          vector: this.vectorClock.getVector(),
          stats
        }
      });
    } catch (error) {
      logger.error('Error obteniendo información de vector clock', {
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
   * Obtener eventos ordenados por vector clock
   * GET /sync/ordered-by-vector
   */
  async getOrderedByVector(req, res) {
    try {
      const { limit = 50 } = req.query;

      const ordered = this.vectorClock.getOrderedHistory(parseInt(limit) || 50);

      return res.status(200).json({
        success: true,
        nodeId: this.nodeId,
        count: ordered.length,
        orderedByVector: ordered.map(e => ({
          id: e.id,
          action: e.action,
          nodeId: e.nodeId,
          vector: e.vector,
          vectorString: e.vectorString,
          source: e.source,
          timestamp: e.timestamp
        }))
      });
    } catch (error) {
      logger.error('Error obteniendo eventos ordenados por vector', {
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
   * GET /sync/concurrency-detection
   */
  async detectConcurrency(req, res) {
    try {
      const concurrent = this.vectorClock.detectConcurrentEvents();

      return res.status(200).json({
        success: true,
        nodeId: this.nodeId,
        concurrentPairs: concurrent.length,
        concurrentEvents: concurrent
      });
    } catch (error) {
      logger.error('Error detectando concurrencia', {
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
   * Comparar dos vectores
   * GET /sync/compare-vectors?v1=0,0,1&v2=1,0,0
   */
  async compareVectors(req, res) {
    try {
      const { v1, v2 } = req.query;

      if (!v1 || !v2) {
        return res.status(400).json({
          success: false,
          error: 'Parámetros requeridos: v1 y v2 (formato: "1,2,3")',
          nodeId: this.nodeId
        });
      }

      // Parsear vectores
      const parseVector = (str) => {
        const parts = str.split(',').map(p => parseInt(p.trim()));
        const vec = new Array(this.vectorClock.totalNodes + 1).fill(0);
        for (let i = 0; i < parts.length; i++) {
          vec[i + 1] = parts[i];
        }
        return vec;
      };

      const vector1 = parseVector(v1);
      const vector2 = parseVector(v2);

      const relation = this.vectorClock.compareVectors(vector1, vector2);

      return res.status(200).json({
        success: true,
        data: {
          nodeId: this.nodeId,
          vector1: this.vectorClock.vectorToString(vector1),
          vector2: this.vectorClock.vectorToString(vector2),
          relation: relation,
          explanation: this.getRelationExplanation(relation)
        }
      });
    } catch (error) {
      logger.error('Error comparando vectores', {
        error: error.message,
        nodeId: this.nodeId
      });

      return res.status(500).json({
        success: false,
        error: 'Error al parsear vectores',
        nodeId: this.nodeId
      });
    }
  }

  /**
   * Obtener explicación de la relación entre vectores
   * @private
   */
  getRelationExplanation(relation) {
    const explanations = {
      'happens-before': 'El primer evento sucedió antes que el segundo',
      'happened-after': 'El primer evento sucedió después que el segundo',
      'concurrent': 'Los eventos son concurrentes (sin relación causal)',
      'equal': 'Los vectores son idénticos',
      'invalid': 'Vectores inválidos'
    };
    return explanations[relation] || 'Relación desconocida';
  }

  /**
   * Obtener estadísticas completas de vector clocks
   * GET /sync/vector-stats
   */
  async getVectorStats(req, res) {
    try {
      const stats = this.vectorClock.getStats();

      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error obteniendo estadísticas de vector', {
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
   * Comparar sistemas (Lamport vs Vector Clock)
   * GET /sync/comparison
   */
  async compareClockSystems(req, res) {
    try {
      const lamportStats = this.lamportClock ? this.lamportClock.getStats() : null;
      const vectorStats = this.vectorClock.getStats();

      return res.status(200).json({
        success: true,
        data: {
          nodeId: this.nodeId,
          lamportClock: lamportStats,
          vectorClock: vectorStats,
          comparison: {
            description: 'Vector Clock proporciona información más precisa de causalidad',
            lamportAdvantages: ['Menor overhead de memoria', 'Más simple de implementar'],
            vectorAdvantages: ['Detecta concurrencia real', 'Más información de causalidad', 'Mejor para resolver conflictos']
          }
        }
      });
    } catch (error) {
      logger.error('Error en comparación de relojes', {
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

export default VectorClockController;
