# TICKET #6: API de Cancelación y Devolución

## Descripción
API REST para cancelar boletos y devolver asientos, implementando consistencia eventual distribuida. Los asientos no pasan inmediatamente a AVAILABLE, sino que transitan por estado REFUNDED durante un período configurable.

## Concepto de Consistencia Eventual

En un sistema distribuido, la consistencia eventual permite que los cambios se propaguen gradualmente:

```
Moment 0: Usuario solicita cancelación
  → POST /cancelar { bookingId: 1 }

Response inmediato (200 OK):
  Booking: CANCELLED ✓
  Asiento: REFUNDED ✓
  
Moment N (configurable, default 5s):
  → Timer dispara internamente
  → Asiento: REFUNDED → AVAILABLE

Beneficio: Da tiempo a nodos para sincronizarse antes de reabrir el asiento
```

---

## Endpoints Implementados

### 1. POST /cancelar
**Cancelar un boleto (inicia consistencia eventual)**

**Request:**
```json
{
  "bookingId": 1,
  "refundDelay": 5
}
```

**Parámetros:**
- `bookingId` (number, requerido): ID del boleto a cancelar
- `refundDelay` (number, opcional): Segundos antes de liberar asiento (default: 5)

**Response - Éxito (200):**
```json
{
  "success": true,
  "message": "Boleto cancelado. Asiento en estado REFUNDED",
  "data": {
    "bookingId": 1,
    "confirmationCode": "RRJMU23D",
    "flightId": "FLIGHT_1775171363041_0.6805875729780013",
    "seatNumber": "2A",
    "status": "REFUNDED",
    "refundAmount": 750,
    "cancelledAt": "2026-04-02T23:30:00.000Z",
    "nodeId": 1,
    "refundInfo": {
      "status": "PENDING",
      "willReleaseIn": 5,
      "willReleaseAt": "2026-04-02T23:30:05.000Z",
      "message": "Asiento volvera a AVAILABLE en 5 segundos (consistencia eventual)"
    }
  }
}
```

**Response - Error (400, 404, 409, 500):**
```json
{
  "success": false,
  "error": "Boleto no puede cancelarse. Estado actual: CANCELLED",
  "bookingId": 1,
  "currentStatus": "CANCELLED",
  "nodeId": 1
}
```

---

### 2. GET /cancelar/eventos
**Obtener historial de cancelaciones y liberaciones**

**Query Parameters:**
- `flightId` (string, opcional): Filtrar por vuelo
- `passengerId` (string, opcional): Filtrar por pasajero
- `limit` (number, opcional): Límite de resultados (default: 100, máx: 1000)

**Response:**
```json
{
  "success": true,
  "count": 2,
  "nodeId": 1,
  "events": [
    {
      "id": "CANCEL_1712057400000_0.123456789",
      "timestamp": "2026-04-02T23:30:00.000Z",
      "nodeId": 1,
      "bookingId": 1,
      "confirmationCode": "RRJMU23D",
      "flightId": "FLIGHT_1775171363041_0.6805875729780013",
      "seatNumber": "2A",
      "seatType": "FIRST_CLASS",
      "passengerId": "passenger001",
      "passengerName": "Juan Perez",
      "refundAmount": 750,
      "action": "CANCEL",
      "status": "SUCCESS",
      "refundDelaySeconds": 5
    },
    {
      "id": "RELEASE_REFUND_1712057405000_0.987654321",
      "timestamp": "2026-04-02T23:30:05.000Z",
      "nodeId": 1,
      "bookingId": 1,
      "flightId": "FLIGHT_1775171363041_0.6805875729780013",
      "seatNumber": "2A",
      "previousStatus": "REFUNDED",
      "newStatus": "AVAILABLE",
      "action": "RELEASE_REFUND",
      "status": "SUCCESS"
    }
  ]
}
```

---

### 3. GET /cancelar/pendientes
**Ver reembolsos pendientes (asientos en REFUNDED esperando liberación)**

**Query Parameters:**
- `flightId` (string, opcional): Filtrar por vuelo

**Response:**
```json
{
  "success": true,
  "count": 1,
  "nodeId": 1,
  "pendingRefunds": [
    {
      "id": "REFUND_1712057400000_0.123456789",
      "bookingId": 1,
      "flightId": "FLIGHT_1775171363041_0.6805875729780013",
      "seatNumber": "2A",
      "createdAt": "2026-04-02T23:30:00.000Z",
      "scheduledReleaseAt": "2026-04-02T23:30:05.000Z",
      "status": "PENDING",
      "secondsUntilRelease": 3
    }
  ]
}
```

---

### 4. GET /cancelar/completados
**Ver reembolsos que ya fueron procesados**

**Query Parameters:**
- `limit` (number, opcional): Límite de resultados (default: 100)

**Response:**
```json
{
  "success": true,
  "count": 1,
  "nodeId": 1,
  "completedRefunds": [
    {
      "id": "REFUND_1712057400000_0.123456789",
      "bookingId": 1,
      "flightId": "FLIGHT_1775171363041_0.6805875729780013",
      "seatNumber": "2A",
      "createdAt": "2026-04-02T23:30:00.000Z",
      "scheduledReleaseAt": "2026-04-02T23:30:05.000Z",
      "status": "COMPLETED",
      "completedAt": "2026-04-02T23:30:05.000Z"
    }
  ]
}
```

---

### 5. GET /cancelar/resumen
**Resumen de reembolsos y consistencia eventual**

**Response:**
```json
{
  "success": true,
  "data": {
    "nodeId": 1,
    "timestamp": "2026-04-02T23:35:00.000Z",
    "cancellations": {
      "total": 3,
      "releases": 2
    },
    "refundQueue": {
      "pending": 1,
      "completed": 2,
      "total": 3
    },
    "activeTimeouts": 1,
    "totalRefunded": 1250
  }
}
```

---

### 6. GET /cancelar/stats
**Estadísticas completas de cancelaciones**

**Response:**
```json
{
  "success": true,
  "data": {
    "nodeId": 1,
    "timestamp": "2026-04-02T23:35:00.000Z",
    "cancellations": {
      "totalCancelledTickets": 3,
      "totalRefundedAmount": 1250,
      "totalReleasedToAvailable": 2
    },
    "consistency": {
      "pendingRefunds": 1,
      "completedRefunds": 2,
      "activeRefundProcesses": 1
    },
    "avgRefundDelay": 5
  }
}
```

---

### 7. POST /cancelar/liberar-inmediato/:bookingId
**Forzar liberación inmediata de un reembolso (para sincronización)**

**Response:**
```json
{
  "success": true,
  "message": "Reembolso procesado inmediatamente",
  "data": {
    "bookingId": 1,
    "seatNumber": "2A",
    "newStatus": "AVAILABLE",
    "processedAt": "2026-04-02T23:32:00.000Z",
    "nodeId": 1
  }
}
```

---

## Criterios de Aceptación ✅

- ✅ **La cancelación se registra correctamente**
  - Evento CANCEL registrado en cancellationLog
  - Booking.status cambia a CANCELLED
  - Asiento.status cambia a REFUNDED
  - Respuesta 200 inmediata

- ✅ **El asiento no vuelve de inmediato si se configuró retraso**
  - Estado REFUNDED se mantiene por N segundos
  - GET /cancelar/pendientes muestra asiento en REFUNDED
  - secondsUntilRelease cuenta hacia atrás

- ✅ **Se simula la consistencia eventual**
  - setTimeout interno dispara después de refundDelay
  - _processRefund() ejecuta cambio REFUNDED → AVAILABLE
  - Evento RELEASE_REFUND registrado automáticamente
  - GET /cancelar/completados muestra cambio procesado

- ✅ **Los cambios quedan trazables**
  - Cada paso tiene timestamp ISO 8601
  - nodeId registrado en cada evento
  - Tanto CANCEL como RELEASE_REFUND en cancellationLog
  - GET /cancelar/eventos muestra cronología completa

---

## Flujo de Consistencia Eventual

### Timeline típico:

```
t=0s:  POST /cancelar → Response 200 OK
       - Booking: CONFIRMED → CANCELLED ✓
       - Seat: BOOKED → REFUNDED ✓
       - Evento CANCEL grabado
       - Reembolso entra en cola PENDING
       - Timer iniciado (5s por defecto)
       
t=1s:  GET /cancelar/pendientes → Status=PENDING, 4s restantes
       GET /cancelar/eventos → CANCEL event visible
       
t=5s:  Timer dispara internamente
       - Seat: REFUNDED → AVAILABLE ✓
       - Evento RELEASE_REFUND grabado
       - Reembolso pasa a COMPLETED
       - GET /cancelar/pendientes → vacío
       
t=6s:  GET /cancelar/completados → Reembolso visible
       Asiento puede comprarse normalmente
```

---

## Validaciones Implementadas

1. **Parámetros Requeridos**: bookingId requerido
2. **Validación de Booking**: Existe y es CONFIRMED
3. **Validación de Estado del Vuelo**: No despegó (DEPARTED+)
4. **Validación de refundDelay**: Número >= 0
5. **Validación de Asiento**: Existe en vuelo
6. **Prevención de Doble Cancelación**: Ya CANCELLED rechaza

## Estados de Asiento en Cancelación

```
BOOKED (comprado)
  ↓ POST /cancelar
REFUNDED (transitorio, espera liberación)
  ↓ después de refundDelay segundos
AVAILABLE (listo para nueva compra)
```

## Configuración de Retraso

- **Default**: 5 segundos
- **Configurable**: Via parámetro refundDelay en cada cancelación
- **Sin retraso**: refundDelay=0 → libera INMEDIATAMENTE
- **Máximo**: No hay límite configurado

## Casos de Uso

### Caso 1: Cancelación con retraso (consistencia eventual)
```bash
curl -X POST http://localhost:3001/cancelar \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": 1,
    "refundDelay": 5
  }'
# Response: 200 OK, estado=REFUNDED
# Después 5s: estado → AVAILABLE
```

### Caso 2: Consultar reembolsos pendientes
```bash
curl http://localhost:3001/cancelar/pendientes
# Muestra asientos esperando ser liberados
```

### Caso 3: Forzar liberación inmediata (sincronización)
```bash
curl -X POST http://localhost:3001/cancelar/liberar-inmediato/1
# Response: 200 OK, inmediatamente → AVAILABLE
```

### Caso 4: Ver cronología de cancelaciones
```bash
curl http://localhost:3001/cancelar/eventos?flightId=FLIGHT_123
# Muestra CANCEL y RELEASE_REFUND events
```

---

## Registro de Eventos Distribuido

Cada evento incluye:
- **id**: Único (CANCEL_timestamp_random o RELEASE_REFUND_timestamp_random)
- **timestamp**: ISO 8601 para sincronización global
- **nodeId**: Qué nodo procesó
- **bookingId, flightId, seatNumber**: Identidadores de recursos
- **action**: CANCEL o RELEASE_REFUND
- **status**: SUCCESS o FAILED
- **refundDelaySeconds**: Configuración de retraso (solo CANCEL)

## Integración Distribuida

**Nodo Local:**
- cancellationLog: Historial local de cancelaciones y liberaciones
- refundQueue: Cola de reembolsos con estado (PENDING/COMPLETED)
- refundTimeouts: Timers activos para consistencia eventual

**Listo para TICKET #7:**
- Broadcast de eventos CANCEL entre nodos
- Sincronización de refundQueue
- Consenso sobre estado de asientos
- Detección de cambios conflictivos

## Archivos Creados/Modificados

**Creados:**
- `src/controllers/CancellationController.js` - Controlador de cancelaciones
- `src/routes/cancellationRoutes.js` - Rutas de cancelación (7 endpoints)

**Modificados:**
- `src/index.js` - Importación e integración en /cancelar
- `src/constants/seatTypes.js` - Agregado estado REFUNDED

## Log de Cambios

- **2026-04-02**: Implementación de TICKET #6
  - CancellationController con 7 métodos
  - Consistencia eventual con timers configurable
  - Estado REFUNDED transitorio
  - Trazabilidad completa con eventos
  - Cola de reembolsos con cronología
  - Liberación forzada para sincronización

---

## Próximos Steps (TICKET #7)

1. **Sincronización de Cancelaciones Entre Nodos**
   - Broadcast de eventos CANCEL
   - Replicación de refundQueue
   - Consenso sobre liberación de asientos

2. **Detección de Conflictos**
   - Compra después de cancelación no procesada
   - Resolución de conflictos distribuida

3. **Persistencia de Reembolsos**
   - Base de datos para cancellationLog
   - Recovery de eventos tras crash
