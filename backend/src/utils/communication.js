/**
 * Utilidades de comunicación entre nodos
 */

import axios from 'axios';
import Logger from './logger.js';

const logger = new Logger(process.env.LOG_LEVEL || 'info');

/**
 * Realiza una petición HTTP a otro nodo
 * @param {string} nodeUrl - URL del nodo a contactar
 * @param {string} endpoint - Endpoint del servicio
 * @param {string} method - Método HTTP
 * @param {Object} data - Datos a enviar
 * @returns {Promise<Object>} Respuesta del nodo
 */
export const sendNodeRequest = async (nodeUrl, endpoint, method = 'GET', data = null) => {
  try {
    const url = `${nodeUrl}${endpoint}`;
    const config = {
      method,
      url,
      timeout: 5000
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.data = data;
    }

    const response = await axios(config);
    logger.debug(`Request exitoso a ${url}`, { status: response.status });
    return response.data;
  } catch (error) {
    logger.error(`Error en request a ${nodeUrl}${endpoint}`, {
      error: error.message
    });
    throw error;
  }
};

/**
 * Verifica si un nodo está activo
 * @param {string} nodeUrl - URL del nodo
 * @returns {Promise<boolean>} True si el nodo responde
 */
export const isNodeAlive = async (nodeUrl) => {
  try {
    const response = await axios.get(`${nodeUrl}/health`, {
      timeout: 2000
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

export default {
  sendNodeRequest,
  isNodeAlive
};
