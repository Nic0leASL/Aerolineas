# Modelo de Datos del Sistema - TICKET #2

## Estructura General

El sistema de reservas de vuelos está basado en 4 entidades principales:

```
┌─────────────┐      ┌──────────┐      ┌────────┐      ┌─────────┐
│   Flight    │──┬──→│   Seat   │      │  Seat  │──┬──→│ Booking │
│             │  │   │          │      │ Status │   │   │         │
└─────────────┘  │   └──────────┘      └────────┘   │   └─────────┘
                 │                                   │
                 └───────────────────────────────────┘
                      1 Flight = 190 Seats
```

## 1. FLIGHT (Vuelo)

### Atributos

| Atributo | Tipo | Descripción |
|----------|------|-------------|
| `id` | string | ID único del vuelo |
| `flightNumber` | string | Número de vuelo (ej: "AA123") |
| `aircraft` | string | Tipo de aeronave (ej: "Boeing 777") |
| `origin` | string | Código aeropuerto origen (ej: "JFK") |
| `destination` | string | Código destino (ej: "LAX") |
| `departureTime` | ISO 8601 | Hora de despegue |
| `arrivalTime` | ISO 8601 | Hora de llegada estimada |
| `status` | enum | Estado actual del vuelo |
| `price` | number | Precio base en dólares |
| `seats` | Object | Mapa de asientos {seatNumber: Seat} |
| `nodeId` | number | Nodo que gestiona el vuelo |

### Estados del Vuelo

```
SCHEDULED → BOARDING → DEPARTED → IN_FLIGHT → LANDED → ARRIVED
   ↓           ↓          ↓           ↓          ↓
DELAYED  ╱───→ X ╱───────→ X ╱───────→ X ╱──────→ X
   ↓     ╱                                       
CANCELLED←──────────────────────────────────────
```

### Estados Válidos

1. **SCHEDULED** - Vuelo programado, aceptando reservas
2. **BOARDING** - Proceso de abordaje en progreso
3. **DEPARTED** - Despegó exitosamente
4. **IN_FLIGHT** - En el aire
5. **LANDED** - Aterrizó en destino
6. **ARRIVED** - Completó el viaje (final)
7. **DELAYED** - Retrasado (puede volver a cualquier estado anterior)
8. **CANCELLED** - Cancelado (sin retorno)

### Métodos Principales

```javascript
// Obtener disponibilidad
flight.getAvailability()
// Retorna: { total, available, reserved, booked, byType {...} }

// Obtener asientos disponibles
flight.getAvailableSeats(seatType)
// Retorna: Seat[]

// Obtener asiento específico
flight.getSeat(seatNumber)
// Retorna: Seat

// Actualizar estado
flight.updateStatus(newStatus)
```

---

## 2. SEAT (Asiento)

### Atributos

| Atributo | Tipo | Descripción |
|----------|------|-------------|
| `seatNumber` | string | Identificador único (ej: "1A", "12B") |
| `seatType` | enum | Tipo de asiento |
| `flightId` | string | ID del vuelo dueño |
| `status` | enum | Estado actual |
| `reservedBy` | number | ID usuario con reserva temporal |
| `bookedBy` | number | ID comprador final |
| `createdAt` | ISO 8601 | Cuando se creó |
| `updatedAt` | ISO 8601 | Última actualización |

### Tipos de Asiento

```
┌────────────────┬────────┬────────────┐
│  Clase         │ Precio │  Cantidad  │
├────────────────┼────────┼────────────┤
│ FIRST_CLASS    │  150%  │     10     │
│ BUSINESS_CLASS │  120%  │     30     │
│ ECONOMY_CLASS  │  100%  │    150     │
├────────────────┼────────┼────────────┤
│ TOTAL          │        │    190     │
└────────────────┴────────┴────────────┘
```

### Estados del Asiento

```
AVAILABLE ←──→ RESERVED ──→ BOOKED
   ↓              ↓            ↓
BLOCKED ──────→ UNAVAILABLE  BOOKED
                 (expira)   (permanente)
```

1. **AVAILABLE** - Libre para reservar
2. **RESERVED** - Reservado temporalmente (hold 5 minutos)
3. **BOOKED** - Comprado y confirmado (permanente)
4. **BLOCKED** - Marcado para mantenimiento
5. **UNAVAILABLE** - No se puede usar

### Métodos Principales

```javascript
// Reservar temporalmente
seat.reserve(userId)          // Retorna boolean

// Comprar permanentemente
seat.book(userId)             // Retorna boolean

// Liberar reserva
seat.releaseReservation()      // Retorna boolean

// Cancelar compra
seat.cancelBooking()           // Retorna boolean

// Verificar disponibilidad
seat.isAvailable()             // Retorna boolean
```

---

## 3. BOOKING (Boleto)

### Atributos

| Atributo | Tipo | Descripción |
|----------|------|-------------|
| `id` | number | ID único del boleto |
| `flightId` | string | ID del vuelo |
| `seatNumber` | string | Asiento comprado |
| `passengerId` | number | ID del pasajero |
| `passengerName` | string | Nombre del pasajero |
| `email` | string | Email de contacto |
| `phoneNumber` | string | Teléfono de contacto |
| `ticketPrice` | number | Precio pagado |
| `status` | enum | CONFIRMED o CANCELLED |
| `confirmationCode` | string | Código 8 caracteres |
| `bookedAt` | ISO 8601 | Fecha de compra |
| `cancelledAt` | ISO 8601 | Fecha de cancelación (null si activo) |
| `nodeId` | number | Nodo que procesó |

### Métodos Principales

```javascript
// Cancelar booking
booking.cancel()               // Retorna boolean

// Obtener estado
booking.getStatus()            // Retorna Object

// Generar código
booking.generateConfirmationCode()  // Retorna string

// Convertir a JSON
booking.toJSON()               // Retorna Object
```

---

## 4. RESERVATION (Reserva - Legado)

Mantiene operaciones básicas de reserva para compatibilidad.

---

## Flujo de Operaciones

### 1. Crear Vuelo

```javascript
POST /flights
{
  "flightNumber": "AA123",
  "aircraft": "Boeing 777",
  "origin": "JFK",
  "destination": "LAX",
  "departureTime": "2024-04-05T10:00:00Z",
  "arrivalTime": "2024-04-05T14:00:00Z",
  "price": 500
}
```

**Resultado**: Flight con 190 asientos automáticamente inicializados.

---

### 2. Consultar Disponibilidad

```javascript
GET /flights/{flightId}/availability
```

**Resultado**:
```json
{
  "total": 190,
  "available": 185,
  "reserved": 3,
  "booked": 2,
  "blocked": 0,
  "byType": {
    "FIRST_CLASS": { "total": 10, "available": 8, ... },
    "BUSINESS_CLASS": { "total": 30, "available": 28, ... },
    "ECONOMY_CLASS": { "total": 150, "available": 149, ... }
  }
}
```

---

### 3. Reservar Asiento (Temporal, 5 minutos)

```javascript
POST /flights/{flightId}/seats/reserve
{
  "flightId": "FLIGHT_xxx",
  "seatNumber": "1A",
  "userId": 123,
  "holdDuration": 300  // segundos (opcional)
}
```

**Resultado**:
```json
{
  "success": true,
  "message": "Asiento reservado exitosamente",
  "holdExpiresIn": 300
}
```

**Nota**: Si pasan 5 minutos sin compra, se libera automáticamente.

---

### 4. Comprar Asiento (Permanente)

```javascript
POST /flights/{flightId}/seats/book
{
  "flightId": "FLIGHT_xxx",
  "seatNumber": "1A",
  "passengerId": 123,
  "passengerName": "Juan Pérez",
  "email": "juan@example.com",
  "phoneNumber": "+1234567890",
  "ticketPrice": 750  // 150% para primera clase
}
```

**Resultado**:
```json
{
  "id": 1,
  "confirmationCode": "ABC123XY",
  "status": "CONFIRMED",
  "flightId": "FLIGHT_xxx",
  "seatNumber": "1A",
  "passengerName": "Juan Pérez",
  "ticketPrice": 750,
  "bookedAt": "2024-04-02T22:50:00Z"
}
```

---

### 5. Consultar Asientos Disponibles

```javascript
GET /flights/{flightId}/seats?seatType=FIRST_CLASS
```

**Resultado**:
```json
{
  "flightId": "FLIGHT_xxx",
  "seatType": "FIRST_CLASS",
  "count": 8,
  "seats": [
    { "seatNumber": "1A", "seatType": "FIRST_CLASS", "status": "AVAILABLE" },
    { "seatNumber": "1B", "seatType": "FIRST_CLASS", "status": "AVAILABLE" },
    ...
  ]
}
```

---

### 6. Cancelar Compra

```javascript
DELETE /bookings/{bookingId}
```

**Resultado**:
```json
{
  "success": true,
  "message": "Boleto cancelado exitosamente",
  "refund": 750
}
```

**Validaciones**:
- No se puede cancelar después del despegue
- Solo si el vuelo está en SCHEDULED, BOARDING, DELAYED

---

## Constantes del Sistema

### Estados del Vuelo (flightStates.js)

```javascript
export const FLIGHT_STATES = {
  SCHEDULED: 'SCHEDULED',
  BOARDING: 'BOARDING',
  DEPARTED: 'DEPARTED',
  IN_FLIGHT: 'IN_FLIGHT',
  LANDED: 'LANDED',
  ARRIVED: 'ARRIVED',
  DELAYED: 'DELAYED',
  CANCELLED: 'CANCELLED'
};
```

### Tipos de Asiento (seatTypes.js)

```javascript
export const SEAT_TYPES = {
  FIRST_CLASS: 'FIRST_CLASS',
  BUSINESS_CLASS: 'BUSINESS_CLASS',
  ECONOMY_CLASS: 'ECONOMY_CLASS'
};

export const SEAT_STATUS = {
  AVAILABLE: 'AVAILABLE',
  RESERVED: 'RESERVED',
  BOOKED: 'BOOKED',
  BLOCKED: 'BLOCKED',
  UNAVAILABLE: 'UNAVAILABLE'
};

export const SEATS_PER_TYPE = {
  FIRST_CLASS: 10,
  BUSINESS_CLASS: 30,
  ECONOMY_CLASS: 150
};

export const TOTAL_SEATS = 190;
```

---

## Validaciones

### Crear Vuelo

- ✅ flightNumber requerido
- ✅ aircraft requerido
- ✅ origin requerido (código IATA)
- ✅ destination requerido (código IATA)
- ✅ departureTime requerido
- ✅ arrivalTime requerido

### Reservar Asiento

- ✅ Vuelo debe existir
- ✅ Asiento debe existir
- ✅ Asiento debe estar AVAILABLE
- ✅ Usuario debe ser válido
- ✅ Hold expira en 5 minutos (configurable)

### Comprar Asiento

- ✅ Vuelo debe existir
- ✅ Asiento debe estar AVAILABLE o RESERVED
- ✅ Pasajero debe tener datos completos
- ✅ Ticket price debe ser positivo

### Cancelar Booking

- ✅ Booking debe existir
- ✅ Booking no puede estar ya cancelado
- ✅ Vuelo no puede haber despegado
- ✅ Se produce reembolso del 100%

---

## Ejemplo Completo de Uso

```javascript
// 1. Crear vuelo
const flight = flightService.createFlight({
  id: "FLIGHT_001",
  flightNumber: "AA123",
  aircraft: "Boeing 777",
  origin: "JFK",
  destination: "LAX",
  departureTime: "2024-04-05T10:00:00Z",
  arrivalTime: "2024-04-05T14:00:00Z",
  price: 500
});

// 2. Consultar disponibilidad
const availability = flightService.getFlightAvailability("FLIGHT_001");
console.log(availability.available);  // 190

// 3. Reservar asiento
flightService.reserveSeat("FLIGHT_001", "1A", 123, 300);

// 4. Comprar asiento
const booking = flightService.bookSeat({
  flightId: "FLIGHT_001",
  seatNumber: "1A",
  passengerId: 123,
  passengerName: "Juan Pérez",
  email: "juan@example.com",
  phoneNumber: "+1234567890",
  ticketPrice: 750
});

// 5. Obtener código de confirmación
console.log(booking.confirmationCode);  // "ABC123XY"

// 6. Cancelar si es necesario
flightService.cancelBooking(booking.id);
```

---

## Próximas Mejoras Sugeridas

1. **Persistencia**: Agregar base de datos
2. **Sincronización**: Replicar vuelos entre nodos
3. **Pagos**: Integración con procesador de pagos
4. **Notificaciones**: Alertas por email/SMS
5. **Análisis**: Reportes de ocupación
6. **Overbooking**: Política de sobreventa
