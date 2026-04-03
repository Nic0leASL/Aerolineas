# TICKET #5: API de Compra de Boletos

## Descripción
API REST para comprar boletos definitivamente, tanto desde asientos disponibles como desde reservas previas.

## Endpoints Implementados

### 1. POST /comprar
**Crear una nueva compra de boleto (transacción definitiva)**

**Request:**
```json
{
  "flightId": "FLIGHT_1775171109667_0.48898069706255676",
  "seatNumber": "1A",
  "passengerId": "passenger001",
  "passengerName": "Juan Pérez",
  "email": "juan@example.com",
  "phoneNumber": "+1-555-0123"
}
```

**Parámetros:**
- `flightId` (string, requerido): ID del vuelo
- `seatNumber` (string, requerido): Número del asiento (ej: "1A", "12B")
- `passengerId` (string, requerido): ID único del pasajero
- `passengerName` (string, requerido): Nombre completo del pasajero
- `email` (string, requerido): Email válido de contacto
- `phoneNumber` (string, opcional): Teléfono de contacto

**Response - Éxito (201):**
```json
{
  "success": true,
  "message": "Boleto comprado exitosamente",
  "data": {
    "bookingId": 1,
    "confirmationCode": "AB7CX2P9",
    "flightId": "FLIGHT_1775171109667_0.48898069706255676",
    "seatNumber": "1A",
    "seatType": "FIRST_CLASS",
    "passengerId": "passenger001",
    "passengerName": "Juan Pérez",
    "email": "juan@example.com",
    "phoneNumber": "+1-555-0123",
    "ticketPrice": 750,
    "status": "BOOKED",
    "bookedAt": "2026-04-02T23:15:00.000Z",
    "nodeId": 1
  }
}
```

**Response - Error (400, 404, 409, 500):**
```json
{
  "success": false,
  "error": "Asiento no disponible para compra",
  "flightId": "FLIGHT_1775171109667_0.48898069706255676",
  "seatNumber": "1A",
  "currentStatus": "BOOKED",
  "nodeId": 1
}
```

---

### 2. GET /comprar/boleto/:bookingId
**Obtener información detallada de un boleto**

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "flightId": "FLIGHT_1775171109667_0.48898069706255676",
    "seatNumber": "1A",
    "passengerId": "passenger001",
    "passengerName": "Juan Pérez",
    "email": "juan@example.com",
    "phoneNumber": "+1-555-0123",
    "ticketPrice": 750,
    "status": "CONFIRMED",
    "confirmationCode": "AB7CX2P9",
    "bookedAt": "2026-04-02T23:15:00.000Z",
    "cancelledAt": null,
    "nodeId": 1
  }
}
```

---

### 3. GET /comprar/pasajero/:passengerId
**Obtener todos los boletos de un pasajero**

**Query Parameters:**
- `status` (string, opcional): Filtrar por estado (CONFIRMED, CANCELLED)

**Response:**
```json
{
  "success": true,
  "count": 2,
  "passengerId": "passenger001",
  "nodeId": 1,
  "bookings": [
    {
      "id": 1,
      "flightId": "FLIGHT_1775171109667_0.48898069706255676",
      "seatNumber": "1A",
      "passengerName": "Juan Pérez",
      "ticketPrice": 750,
      "status": "CONFIRMED",
      "confirmationCode": "AB7CX2P9",
      "bookedAt": "2026-04-02T23:15:00.000Z"
    }
  ]
}
```

---

### 4. GET /comprar/eventos
**Obtener historial de eventos de compras del nodo**

**Query Parameters:**
- `flightId` (string, opcional): Filtrar por vuelo específico
- `passengerId` (string, opcional): Filtrar por pasajero específico
- `limit` (number, opcional): Límite de resultados (default: 100, máx: 1000)

**Response:**
```json
{
  "success": true,
  "count": 2,
  "nodeId": 1,
  "events": [
    {
      "id": "PURCHASE_1712057700000_0.123456789",
      "timestamp": "2026-04-02T23:15:00.000Z",
      "nodeId": 1,
      "bookingId": 1,
      "confirmationCode": "AB7CX2P9",
      "flightId": "FLIGHT_1775171109667_0.48898069706255676",
      "seatNumber": "1A",
      "seatType": "FIRST_CLASS",
      "passengerId": "passenger001",
      "passengerName": "Juan Pérez",
      "ticketPrice": 750,
      "action": "PURCHASE",
      "status": "SUCCESS"
    }
  ]
}
```

---

### 5. GET /comprar/ingresos
**Obtener ingresos acumulados por tipo de asiento**

**Response:**
```json
{
  "success": true,
  "nodeId": 1,
  "revenue": {
    "total": 2150,
    "byType": {
      "FIRST_CLASS": 750,
      "BUSINESS_CLASS": 600,
      "ECONOMY_CLASS": 800
    },
    "currency": "USD"
  },
  "totalPurchases": 5,
  "totalCancellations": 1
}
```

---

### 6. GET /comprar/stats
**Obtener estadísticas de compras del nodo**

**Response:**
```json
{
  "success": true,
  "data": {
    "nodeId": 1,
    "totalPurchaseEvents": 4,
    "purchasesByAction": {
      "PURCHASE": 3,
      "CANCEL": 1
    },
    "successfulPurchases": 3,
    "totalRevenue": 2150,
    "revenueByType": {
      "FIRST_CLASS": 750,
      "BUSINESS_CLASS": 600,
      "ECONOMY_CLASS": 800
    },
    "totalBookings": 3
  }
}
```

---

### 7. DELETE /comprar/boleto/:bookingId
**Cancelar un boleto comprado**

**Response - Éxito (200):**
```json
{
  "success": true,
  "message": "Boleto cancelado exitosamente",
  "data": {
    "bookingId": 1,
    "status": "CANCELLED",
    "cancelledAt": "2026-04-02T23:20:00.000Z",
    "nodeId": 1
  }
}
```

---

## Criterios de Aceptación ✅

- ✅ **Un asiento vendido no puede volver a venderse**
  - Validación en SeatPurchaseController
  - Respuesta 409 si estado ≠ (AVAILABLE o RESERVED)
  - Incluye estado actual en respuesta

- ✅ **La compra cambia correctamente el estado**
  - Seat.book(passengerId) cambia status a BOOKED
  - Respuesta incluye nuevo estado del asiento
  - Verificable en GET /comprar/boleto/:bookingId

- ✅ **El sistema guarda trazabilidad de la transacción**
  - Evento registrado con ID único: PURCHASE_timestamp_random
  - Incluye: bookingId, confirmationCode, flightId, seatNumber, passengerId, passengerName, ticketPrice, nodeId
  - Recuperable con GET /comprar/eventos
  - Se registra acción y estado

- ✅ **Devuelve datos completos del boleto generado**
  - Incluye confirmationCode único
  - Datos del pasajero completos
  - Precio calculado por tipo de asiento
  - Timestamps de booking
  - Estado y ID del booking

## Cálculo de Precios

Basado en tipo de asiento con multiplicadores:
```
FIRST_CLASS:     precio_base * 1.5  (50% más)
BUSINESS_CLASS:  precio_base * 1.2  (20% más)
ECONOMY_CLASS:   precio_base * 1.0  (100%)
```

**Ejemplo:**
- Precio base del vuelo: $500
- Asiento First Class: $500 * 1.5 = $750
- Asiento Business: $500 * 1.2 = $600
- Asiento Economy: $500 * 1.0 = $500

## Validaciones Implementadas

1. **Parámetros Requeridos**: flightId, seatNumber, passengerId, passengerName, email
2. **Validación de Email**: Formato válido (regex)
3. **Validación de Vuelo**: Existe mediante getFlight(flightId)
4. **Validación de Asiento**: Existe mediante getSeat(seatNumber)
5. **Validación de Estado**: Solo AVAILABLE o RESERVED pueden ser comprados
6. **Validación de Tipo**: Asiento no puede ser BOOKED o BLOCKED
7. **Cálculo de Precio**: Por tipo de asiento (multiplier)
8. **Información Completa**: Email requerido para contacto

## Registro de Eventos de Compra

Cada evento incluye:
- **id**: Identificador único (PURCHASE_timestamp_random o CANCEL_timestamp_random)
- **timestamp**: ISO 8601 para sincronización distribuida
- **nodeId**: Qué nodo procesó la operación
- **bookingId**: ID del booking creado
- **confirmationCode**: Código único de confirmación
- **flightId, seatNumber, seatType**: Identidades de recursos
- **passengerId, passengerName**: Información del comprador
- **ticketPrice**: Precio exacto cobrado
- **action**: PURCHASE o CANCEL
- **status**: SUCCESS o FAILED

## Ingresos por Tipo de Asiento

Seguimiento acumulativo:
- **FIRST_CLASS**: Total de ingresos
- **BUSINESS_CLASS**: Total de ingresos
- **ECONOMY_CLASS**: Total de ingresos
- **Total**: Suma de todos

Útil para análisis financiero y reportes.

## Casos de Uso

### Caso 1: Comprar desde asiento disponible
```bash
curl -X POST http://localhost:3001/comprar \
  -H "Content-Type: application/json" \
  -d '{
    "flightId": "FLIGHT_1234567890_0.5",
    "seatNumber": "1A",
    "passengerId": "P001",
    "passengerName": "Juan Smith",
    "email": "juan@example.com",
    "phoneNumber": "+1-555-1234"
  }'
```

### Caso 2: Comprar desde asiento reservado
```bash
# Primero reservar
curl -X POST http://localhost:3001/reservar \
  -H "Content-Type: application/json" \
  -d '{"flightId":"F123", "seatNumber":"2B", "userId":"U001"}'

# Luego comprar (mismo asiento, diferente ID de pasajero)
curl -X POST http://localhost:3001/comprar \
  -H "Content-Type: application/json" \
  -d '{
    "flightId": "F123",
    "seatNumber": "2B",
    "passengerId": "P001",
    "passengerName": "Juan Smith",
    "email": "juan@example.com"
  }'
```

### Caso 3: Intentar comprar asiento ya vendido
```bash
# Intenta comprar mismo asiento otra vez
curl -X POST http://localhost:3001/comprar \
  -H "Content-Type: application/json" \
  -d '{"flightId":"F123","seatNumber":"1A",...}'
# Retorna: 409 Conflict - "Asiento no disponible para compra"
```

### Caso 4: Ver boletos de un pasajero
```bash
curl http://localhost:3001/comprar/pasajero/P001
# Retorna lista de todos los boletos del pasajero
```

### Caso 5: Ver ingresos acumulados
```bash
curl http://localhost:3001/comprar/ingresos
# Retorna total de ingresos desagregados por tipo de asiento
```

### Caso 6: Cancelar un boleto
```bash
curl -X DELETE http://localhost:3001/comprar/boleto/1
# Retorna: 200 OK - Boleto cancelado
```

## Integración con Nodos Distribuidos

Cada nodo mantiene:
- **purchaseLog**: Historial de eventos de compra locales
- **revenueByType**: Ingresos por tipo de asiento local
- **FlightService.bookings**: Boletos en memoria
- **FlightService.flights**: Asientos comprados en memoria

**Sincronización Futura** (TICKET #6):
- Broadcast de eventos de compra entre nodos
- Consenso de estado de asientos vendidos
- Replicación de revenueByType
- Consolidación de reportes financieros

## Archivos Creados/Modificados

**Creados:**
- `src/controllers/SeatPurchaseController.js` - Controlador de compra de boletos
- `src/routes/seatPurchaseRoutes.js` - Rutas de compra (POST, GET, DELETE)

**Modificados:**
- `src/index.js` - Importación e integración de nuevas rutas en /comprar

## Log de Cambios

- **2026-04-02**: Implementación de TICKET #5
  - Creación de SeatPurchaseController con 7 métodos
  - Creación de seatPurchaseRoutes con 7 endpoints
  - Cálculo dinámico de precios por tipo de asiento
  - Tracking de ingresos por tipo y total
  - Registro de eventos de compra y cancelación
  - Validación completa de disponibilidad
  - Manejo de errores con mensajes claros
  - Datos completos del boleto en respuesta
  - Soporte para cancelación de boletos

---

## Próximos Steps (TICKET #6)

1. **Sincronización de Compras entre Nodos**
   - Broadcast de eventos de compra
   - Replicación de estado de asientos vendidos
   - Consenso en ingresos acumulados

2. **Persistencia de Compras**
   - Base de datos para boletos
   - Recovery de transacciones

3. **Reportes Financieros**
   - Consolidación de ingresos entre nodos
   - Análisis por ruta, aeronave, período

4. **Notificaciones**
   - Email de confirmación de compra
   - Recordatorio de vuelo próximo
