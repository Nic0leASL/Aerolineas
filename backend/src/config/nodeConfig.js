/**
 * Configuración de los 3 nodos distribuidos
 * Cada nodo representa una instancia del servidor
 */

const nodeConfig = {
  1: {
    id: 1,
    port: process.env.NODE_1_PORT || 3001,
    url: process.env.NODE_1_URL || 'http://localhost:3001',
    name: 'Servidor Nodo 1'
  },
  2: {
    id: 2,
    port: process.env.NODE_2_PORT || 3002,
    url: process.env.NODE_2_URL || 'http://localhost:3002',
    name: 'Servidor Nodo 2'
  },
  3: {
    id: 3,
    port: process.env.NODE_3_PORT || 3003,
    url: process.env.NODE_3_URL || 'http://localhost:3003',
    name: 'Servidor Nodo 3'
  }
};

/**
 * Obtiene los todos los nodos excepto el nodo actual
 * @param {number} currentNodeId - ID del nodo actual
 * @returns {Object[]} Array de configuración de otros nodos
 */
export const getOtherNodes = (currentNodeId) => {
  return Object.values(nodeConfig).filter(node => node.id !== currentNodeId);
};

/**
 * Obtiene la configuración de un nodo específico
 * @param {number} nodeId - ID del nodo
 * @returns {Object} Configuración del nodo
 */
export const getNodeConfig = (nodeId) => {
  return nodeConfig[nodeId];
};

/**
 * Obtiene todos los nodos
 * @returns {Object} Configuración de todos los nodos
 */
export const getAllNodes = () => {
  return nodeConfig;
};

export default nodeConfig;
