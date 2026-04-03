/**
 * Estados posibles de un vuelo
 */

export const FLIGHT_STATES = {
  SCHEDULED: 'SCHEDULED',      // Programado
  BOARDING: 'BOARDING',        // Abordaje en progreso
  DEPARTED: 'DEPARTED',        // Despegó
  IN_FLIGHT: 'IN_FLIGHT',      // En vuelo
  LANDED: 'LANDED',            // Aterrizó
  ARRIVED: 'ARRIVED',          // Llegó al destino
  DELAYED: 'DELAYED',          // Retrasado
  CANCELLED: 'CANCELLED'       // Cancelado
};

/**
 * Transiciones válidas entre estados
 */
export const VALID_STATE_TRANSITIONS = {
  SCHEDULED: ['BOARDING', 'DELAYED', 'CANCELLED'],
  BOARDING: ['DEPARTED', 'DELAYED', 'CANCELLED'],
  DEPARTED: ['IN_FLIGHT', 'DELAYED'],
  IN_FLIGHT: ['LANDED', 'DELAYED'],
  LANDED: ['ARRIVED'],
  ARRIVED: [],
  DELAYED: ['BOARDING', 'DEPARTED', 'IN_FLIGHT', 'LANDED', 'ARRIVED', 'CANCELLED'],
  CANCELLED: []
};

/**
 * Verifica si una transición de estado es válida
 * @param {string} fromState - Estado actual
 * @param {string} toState - Estado destino
 * @returns {boolean} True si la transición es válida
 */
export const isValidTransition = (fromState, toState) => {
  if (fromState === toState) return true;
  return VALID_STATE_TRANSITIONS[fromState]?.includes(toState) ?? false;
};

export default FLIGHT_STATES;
