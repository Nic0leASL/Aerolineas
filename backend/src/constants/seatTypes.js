/**
 * Tipos de asiento disponibles en los vuelos
 */

export const SEAT_TYPES = {
  FIRST_CLASS: 'FIRST_CLASS',           // Primera Clase
  BUSINESS_CLASS: 'BUSINESS_CLASS',     // Clase Ejecutiva
  ECONOMY_CLASS: 'ECONOMY_CLASS'        // Clase Turística
};

/**
 * Configuración de precios relativos por tipo de asiento
 */
export const SEAT_PRICES = {
  FIRST_CLASS: 1.5,       // 150% del precio base
  BUSINESS_CLASS: 1.2,    // 120% del precio base
  ECONOMY_CLASS: 1.0      // 100% del precio base
};

/**
 * Estados posibles de un asiento
 */
export const SEAT_STATUS = {
  AVAILABLE: 'AVAILABLE',       // Disponible
  RESERVED: 'RESERVED',         // Reservado
  BOOKED: 'BOOKED',             // Comprado
  REFUNDED: 'REFUNDED',         // Devolvido (pendiente de liberar)
  BLOCKED: 'BLOCKED',           // Bloqueado (mantenimiento)
  UNAVAILABLE: 'UNAVAILABLE'    // No disponible
};

/**
 * Configuración de cantidad de asientos por tipo
 */
export const SEATS_PER_TYPE = {
  FIRST_CLASS: 10,
  BUSINESS_CLASS: 30,
  ECONOMY_CLASS: 150
};

/**
 * Total de asientos por vuelo
 */
export const TOTAL_SEATS = 
  SEATS_PER_TYPE.FIRST_CLASS + 
  SEATS_PER_TYPE.BUSINESS_CLASS + 
  SEATS_PER_TYPE.ECONOMY_CLASS;

export default { SEAT_TYPES, SEAT_STATUS, SEAT_PRICES, SEATS_PER_TYPE, TOTAL_SEATS };
