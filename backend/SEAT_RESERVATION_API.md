# TICKET #4: API de Reserva de Asientos

## Descripción
API REST para reservar asientos temporalmente en vuelos, validando disponibilidad y evitando duplicados.

## Endpoints Implementados

### 1. POST /reservar
**Crear una nueva reserva temporal de asiento**

**Request:**
```json
{
  "flightId": "FLIGHT_1775170606274_0.735841387154907",
  "seatNumber": "1A",
  "userId": "user123",
  "holdDuration": 300
}
```

**Parámetros:**
- `flightId` (string, requerido): ID del vuelo
- `seatNumber` (string, requerido): Número del asiento (ej: "1A", "12B")
- `userId` (string, requerido): ID del usuario que reserva
- `holdDuration` (number, opcional): Duración de la reserva en segundos (default: 300)

**Response - Éxito (201):**
```json
{
  "success": true,
  "message": "Asiento reservado exitosamente",
  "data": {
    "reservationId": "RES_1712057642000_0.123456789",
    "flightId": "FLIGHT_1775170606274_0.735841387154907",
    "seatNumber": "1A",
    "seatType": "FIRST_CLASS",
    "userId": "user123",
    "status": "RESERVED",
    "reservedAt": "2026-04-02T10:00:00.000Z",
    "nodeId": 1,
    "holdExpiresIn": 300,
    "expiresAt": "2026-04-02T10:05:00.000Z"
  }
}
```

**Response - Error (400, 404, 409, 500):**
```json
{
  "success": false,
  "error": "Asiento no disponible",
  "flightId": "FLIGHT_1775170606274_0.735841387154907",
  "seatNumber": "1A",
  "currentStatus": "RESERVED",
  "nodeId": 1
}
```

---

### 2. GET /reservar/eventos
**Obtener historial de eventos de reservas del nodo**

**Query Parameters:**
- `flightId` (string, opcional): Filtrar por vuelo específico
- `userId` (string, opcional): Filtrar por usuario específico
- `limit` (number, opcional): Límite de resultados (default: 100, máx: 1000)

**Response:**
```json
{
  "success": true,
  "count": 5,
  "nodeId": 1,
  "events": [
    {
      "id": "RES_1712057642000_0.123456789",
      "timestamp": "2026-04-02T10:00:00.000Z",
      "nodeId": 1,
      "flightId": "FLIGHT_1775170606274_0.735841387154907",
      "seatNumber": "1A",
      "userId": "user123",
      "seatType": "FIRST_CLASS",
      "action": "RESERVE",
      "holdDuration": 300,
      "status": "SUCCESS"
    }
  ]
}
```

---

### 3. GET /reservar/activas
**Obtener todas las reservas activas (asientos en estado RESERVED)**

**Query Parameters:**
- `flightId` (string, opcional): Filtrar por vuelo específico

**Response:**
```json
{
  "success": true,
  "count": 2,
  "nodeId": 1,
  "reservations": [
    {
      "flightId": "FLIGHT_1775170606274_0.735841387154907",
      "flightNumber": "AA001",
      "seatNumber": "1A",
      "seatType": "FIRST_CLASS",
      "reservedBy": "user123",
      "reservedAt": "2026-04-02T10:00:00.000Z",
      "nodeId": 1
    }
  ]
}
```

---

### 4. GET /reservar/stats
**Obtener estadísticas de reservas del nodo**

**Response:**
```json
{
  "success": true,
  "data": {
    "nodeId": 1,
    "totalReservationEvents": 10,
    "reservationsByAction": {
      "RESERVE": 8,
      "RELEASE": 2
    },
    "successfulReservations": 8,
    "activeReservations": 5
  }
}
```

---

### 5. DELETE /reservar/:flightId/:seatNumber
**Liberar una reserva (cancelar hold temporal)**

**Request:**
```json
{
  "userId": "user123"
}
```

**Parámetros:**
- `flightId` (string, en URL): ID del vuelo
- `seatNumber` (string, en URL): Número del asiento
- `userId` (string, opcional en body): ID del usuario (para validación)

**Response - Éxito (200):**
```json
{
  "success": true,
  "message": "Reserva liberada exitosamente",
  "data": {
    "flightId": "FLIGHT_1775170606274_0.735841387154907",
    "seatNumber": "1A",
    "status": "AVAILABLE",
    "releasedAt": "2026-04-02T10:03:00.000Z",
    "nodeId": 1
  }
}
```

---

## Criterios de Aceptación ✅

- ✅ **No se puede reservar un asiento ya reservado o vendido**
  - Validación en SeatReservationController
  - Respuesta 409 Conflict si asiento no está AVAILABLE
  - Valida currentStatus en respuesta de error

- ✅ **El estado del asiento cambia correctamente**
  - Seat.reserve(userId) cambia status a RESERVED
  - Respuesta incluye nuevo estado
  - isAvailable() retorna false después de RESERVED

- ✅ **Se guarda el evento de reserva**
  - Evento registrado en reservationLog con timestamp ISO 8601
  - Incluye: id, timestamp, nodeId, flightId, seatNumber, userId, action, status
  - Recuperable con GET /reservar/eventos

- ✅ **Respuesta clara en éxito y error**
  - Éxito: 201 Created con datos completos y expiración
  - Error 400: Parámetros requeridos faltantes
  - Error 404: Vuelo/asiento no encontrado
  - Error 409: Asiento no disponible (especifica estado actual)
  - Error 500: Errores internos

## Validaciones Implementadas

1. **Parámetros Requeridos**: flightId, seatNumber, userId
2. **Validación de Vuelo**: Existe mediante getFlight(flightId)
3. **Validación de Asiento**: Existe mediante getSeat(seatNumber)
4. **Validación de Disponibilidad**: Usa seat.isAvailable()
5. **Validación de holdDuration**: Número positivo en segundos
6. **Autorización**: En DELETE, valida que userId coincida con reservedBy
7. **Estado del Asiento**: Solo AVAILABLE puede ser reservado

## Registro de Eventos

Cada evento incluye:
- **id**: Identificador único (RES_timestamp_random)
- **timestamp**: ISO 8601 para sincronización distribuida
- **nodeId**: Qué nodo procesó la operation
- **flightId, seatNumber, userId**: Identidades de recursos
- **seatType**: Tipo de asiento (FIRST_CLASS, BUSINESS_CLASS, ECONOMY_CLASS)
- **action**: RESERVE o RELEASE
- **holdDuration**: Duración de la reserva temporal (solo para RESERVE)
- **status**: SUCCESS o FAILED

## Timeout de Reservas

- **Duración por defecto**: 300 segundos (5 minutos)
- **Customizable**: Via parámetro holdDuration
- **Liberación Automática**: Asiento vuelve a AVAILABLE si no se compra en tiempo
- **Implementación**: setTimeout en FlightService

## Casos de Uso

### Caso 1: Reservar un asiento disponible
```bash
curl -X POST http://localhost:3001/reservar \
  -H "Content-Type: application/json" \
  -d '{
    "flightId": "FLIGHT_1234567890_0.5",
    "seatNumber": "1A",
    "userId": "user001",
    "holdDuration": 600
  }'
```

### Caso 2: Intentar reservar un asiento ya reservado
```bash
# Pide mismo asiento que en Caso 1
curl -X POST http://localhost:3001/reservar \
  -H "Content-Type: application/json" \
  -d '{
    "flightId": "FLIGHT_1234567890_0.5",
    "seatNumber": "1A",
    "userId": "user002"
  }'
# Retorna: 409 Conflict - "Asiento no disponible"
```

### Caso 3: Ver reservas activas
```bash
curl http://localhost:3001/reservar/activas
# Retorna lista de asientos con estado RESERVED
```

### Caso 4: Liberar una reserva
```bash
curl -X DELETE http://localhost:3001/reservar/FLIGHT_1234567890_0.5/1A \
  -H "Content-Type: application/json" \
  -d '{ "userId": "user001" }'
# Retorna: 200 OK - Asiento vuelve a AVAILABLE
```

## Integración con Nodos Distribuidos

Cada nodo mantiene:
- **reservationLog**: Historial de eventos locales
- **FlightService.flights**: Vuelos y asientos en memoria
- **reservationTimeouts**: Timeouts para expiración de reservas

**Sincronización Futura** (TICKET #5):
- Broadcast de eventos de reserva entre nodos
- Consenso de estado de asientos
- Replicación de reservationLog

## Archivos Creados/Modificados

**Creados:**
- `src/controllers/SeatReservationController.js` - Controlador de reservas de asientos
- `src/routes/seatReservationRoutes.js` - Rutas de reserva (POST, GET, DELETE)

**Modificados:**
- `src/index.js` - Importación e integración de nuevas rutas en /reservar

## Log de Cambios

- **2026-04-02**: Implementación de TICKET #4
  - Creación de SeatReservationController con 5 métodos
  - Creación de seatReservationRoutes con 5 endpoints
  - Validación completa de disponibilidad
  - Registro de eventos con timestamp y nodeId
  - Manejo de errores con mensajes claros
  - Soporte para timeout automático de reservas

---

## Próximos Steps (TICKET #5)

1. **Sincronización entre Nodos**
   - Broadcast de eventos de reserva
   - Replicación de estado de asientos
   - Consenso distribuido

2. **Persistencia de Reservas**
   - Base de datos para eventos
   - Recovery de reservas después de crash

3. **Notificaciones**
   - Email cuando reserva está por expirar
   - Alertas de cambios de asiento
