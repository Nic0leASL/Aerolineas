/**
 * LAMPORT_CLOCK_API.md
 * Documentación del Sistema de Reloj Lógico de Lamport (TICKET #7)
 * Implementa ordenamiento causal de eventos distribuidos
 */

# Reloj Lógico de Lamport - API de Sincronización

## Descripción General

El reloj de Lamport es un algoritmo de sincronización lógica para sistemas distribuidos que proporciona:

1. **Orden lógico de eventos** - Cada evento recibe una marca única y secuencial
2. **Causalidad parcial** - Determina relaciones "antes que" entre operaciones
3. **Sincronización eventual** - Nodos se sincronizan sin reloj central

## Algoritmo de Lamport

```
Inicialización:
  L = nodeId * 10000  (Nodo 1: 10000, Nodo 2: 20000, Nodo 3: 30000)

En evento local:
  L = L + 1
  Adjuntar L al evento
  Broadcast a otros nodos

Al recibir evento remoto con marca L':
  L = max(L, L') + 1
  Registrar evento local
  Continuar procesamiento
```

## Servicios

### 1. LamportClockService

**Ubicación:** `src/services/LamportClockService.js`

**Constructor:**
```typescript
new LamportClockService(nodeId: number)
// nodeId: 1, 2, o 3 (identifica el nodo)
// Inicializa clock = nodeId * 10000
```

**Métodos Principales:**

| Método | Retorna | Descripción |
|--------|---------|-------------|
| `increment()` | `number` | Incrementa reloj local y retorna nueva marca |
| `update(remoteMark)` | `number` | Recibe marca remota, calcula max(L, remota)+1 |
| `getLocalMark()` | `number` | Obtiene marca para nuevo evento (incrementa) |
| `recordEvent(event, mark, source)` | `void` | Registra evento en historial |
| `getClock()` | `number` | Obtiene valor actual del reloj sin incrementar |
| `getOrderedHistory(limit)` | `Array` | Retorna eventos ordenados por marca |
| `getCausalityMatrix()` | `Array` | Retorna relaciones entre eventos |
| `getStats()` | `Object` | Estadísticas del reloj |

**Ejemplo de Uso:**

```javascript
const lamportClock = new LamportClockService(1);

// En evento local (ej: RESERVE)
const mark = lamportClock.getLocalMark();  // Retorna 10001
const event = {
  id: 'RES_123',
  action: 'RESERVE',
  lamportClock: mark,  // Adjuntar marca
  ...
};
lamportClock.recordEvent(event, mark, 'LOCAL');

// Al recibir evento remoto
const remoteEvent = { /* evento de Nodo 2 */ };
const newMark = lamportClock.update(remoteEvent.lamportClock);
lamportClock.recordEvent(remoteEvent, newMark, 'REMOTE');

// Consultar historial ordenado
const ordered = lamportClock.getOrderedHistory(10);
// [
//   {lamportMark: 10001, action: 'RESERVE', ...},
//   {lamportMark: 10002, action: 'PURCHASE', ...}
// ]

// Ver causalidad
const causality = lamportClock.getCausalityMatrix();
// [
//   {event1: {mark: 10001, action: 'RESERVE'}, 
//    event2: {mark: 10002, action: 'PURCHASE'},
//    relation: 'before'}
// ]
```

### 2. EventSyncService

**Ubicación:** `src/services/EventSyncService.js`

**Constructor:**
```typescript
new EventSyncService(nodeId: number, otherNodesUrls: Array<string>)
```

**Métodos Principales:**

| Método | Uso |
|--------|-----|
| `setLamportClock(lamportClock)` | Inyectar instancia del reloj |
| `setRemoteNodes(urls)` | Registrar URLs de nodos remotos |
| `broadcastEvent(event, mark)` | Enviar evento a todos los nodos |
| `processRemoteEvent(payload)` | Procesar evento recibido y actualizar reloj |
| `retryFailedSends()` | Reintentar eventos que fallaron |
| `getFailedSends()` | Obtener buffer de envíos fallidos |

**Ejemplo:**

```javascript
const eventSync = new EventSyncService(1);
eventSync.setLamportClock(lamportClock);
eventSync.setRemoteNodes([
  'http://localhost:3002',
  'http://localhost:3003'
]);

// Broadcast de evento
const result = await eventSync.broadcastEvent(event, mark);
// {success: true, sent: 2, failed: 0}

// Recibir evento remoto (en SyncController)
const payload = req.body;  // {lamportMark, event, sourceNodeId}
const result = eventSync.processRemoteEvent(payload);
// Actualiza reloj local: L = max(L, remoteMark) + 1
```

## Controladores

### SyncController

**Ubicación:** `src/controllers/SyncController.js`

**Constructor:**
```typescript
new SyncController(lamportClock, eventSyncService)
```

**Métodos:**

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `POST /sync/events` | `receiveRemoteEvent` | Recibe evento remoto |
| `GET /sync/clock` | `getClockInfo` | Ver reloj actual |
| `GET /sync/ordered-events` | `getOrderedEvents` | Eventos ordenados por Lamport |
| `GET /sync/causality-matrix` | `getCausalityMatrix` | Matriz de causalidad |
| `GET /sync/received-events` | `getReceivedEvents` | Eventos remotos recibidos |
| `GET /sync/stats` | `getStats` | Estadísticas de sincronización |
| `POST /sync/retry-failed` | `retryFailedEvents` | Reintentar envíos fallidos |

## Rutas

**Ubicación:** `src/routes/syncRoutes.js`

### 1. Recibir Evento Remoto
```http
POST /sync/events
Content-Type: application/json

{
  "lamportMark": 20002,
  "event": {
    "id": "PURCHASE_12345",
    "action": "PURCHASE",
    "flightId": "FL001",
    "nodeId": 2
  },
  "sourceNodeId": 2,
  "timestamp": "2026-04-07T10:15:22.000Z"
}
```

**Respuesta (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "nodeId": 1,
    "updatedLamportMark": 20003,
    "sourceNodeId": 2,
    "eventId": "PURCHASE_12345"
  }
}
```

### 2. Ver Reloj Actual
```http
GET /sync/clock
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "nodeId": 1,
    "currentLamportClock": 10003,
    "stats": {
      "nodeId": 1,
      "currentClock": 10003,
      "totalEventsRecorded": 3,
      "localEvents": 2,
      "remoteEvents": 1,
      "timeSpan": {
        "minMark": 10001,
        "maxMark": 10003
      }
    }
  }
}
```

### 3. Eventos Ordenados por Lamport
```http
GET /sync/ordered-events?limit=20
```

**Respuesta:**
```json
{
  "success": true,
  "nodeId": 1,
  "count": 3,
  "orderedByLamport": [
    {
      "lamportMark": 10001,
      "source": "LOCAL",
      "action": "RESERVE",
      "sourceNode": 1,
      "timestamp": "2026-04-07T10:10:00.000Z"
    },
    {
      "lamportMark": 10002,
      "source": "LOCAL",
      "action": "PURCHASE",
      "sourceNode": 1,
      "timestamp": "2026-04-07T10:11:00.000Z"
    },
    {
      "lamportMark": 10003,
      "source": "LOCAL",
      "action": "CANCEL",
      "sourceNode": 1,
      "timestamp": "2026-04-07T10:12:00.000Z"
    }
  ]
}
```

### 4. Matriz de Causalidad
```http
GET /sync/causality-matrix
```

**Respuesta:**
```json
{
  "success": true,
  "nodeId": 1,
  "relationCount": 2,
  "causalityRelations": [
    {
      "event1": {
        "lamportMark": 10001,
        "action": "RESERVE",
        "nodeId": 1
      },
      "event2": {
        "lamportMark": 10002,
        "action": "PURCHASE",
        "nodeId": 1
      },
      "relation": "before",
      "sequence": "10001 → 10002"
    },
    {
      "event1": {
        "lamportMark": 10002,
        "action": "PURCHASE",
        "nodeId": 1
      },
      "event2": {
        "lamportMark": 10003,
        "action": "CANCEL",
        "nodeId": 1
      },
      "relation": "before",
      "sequence": "10002 → 10003"
    }
  ]
}
```

`relation` puede ser: `"before"`, `"after"`, o `"concurrent"`

### 5. Eventos Remotos Recibidos
```http
GET /sync/received-events?sourceNodeId=2
```

**Respuesta:**
```json
{
  "success": true,
  "nodeId": 1,
  "count": 1,
  "receivedEvents": [
    {
      "timestamp": "2026-04-07T10:15:22.000Z",
      "sourceNodeId": 2,
      "remoteLamportMark": 20002,
      "updatedLamportMark": 10003,
      "eventId": "PURCHASE_12345",
      "eventAction": "PURCHASE",
      "isRetry": false
    }
  ]
}
```

### 6. Estadísticas de Sincronización
```http
GET /sync/stats
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "nodeId": 1,
    "lamportClock": {
      "nodeId": 1,
      "currentClock": 10003,
      "totalEventsRecorded": 3,
      "localEvents": 2,
      "remoteEvents": 1,
      "timeSpan": {
        "minMark": 10001,
        "maxMark": 10003
      }
    },
    "eventSync": {
      "nodeId": 1,
      "remoteNodes": 2,
      "failedSendsBuffer": 0,
      "nodeUrls": [
        "http://localhost:3002",
        "http://localhost:3003"
      ]
    },
    "receivedEventsCount": 1,
    "lastReceivedEvent": {
      "timestamp": "2026-04-07T10:15:22.000Z",
      "sourceNodeId": 2,
      "eventAction": "PURCHASE"
    }
  }
}
```

### 7. Reintentar Envíos Fallidos
```http
POST /sync/retry-failed
```

**Respuesta:**
```json
{
  "success": true,
  "retryResult": {
    "attempted": 2,
    "succeeded": 2,
    "failed": 0,
    "stillPending": 0
  }
}
```

## Integración en Controladores

Los controladores de operaciones (`SeatReservationController`, `SeatPurchaseController`, `CancellationController`) incluyen automáticamente el `lamportClock` en cada evento:

```javascript
// En SeatReservationController.reserveSeat()
const event = { /* evento base */ };

if (this.lamportClock) {
  const mark = this.lamportClock.getLocalMark();
  event.lamportClock = mark;  // Adjuntar marca
  this.lamportClock.recordEvent(event, mark, 'LOCAL');
  
  // Broadcast a otros nodos
  if (this.eventSyncService) {
    this.eventSyncService.broadcastEvent(event, mark);
  }
}

this.reservationLog.push(event);
```

## Estructura de Eventos con Lamport

Todos los eventos en el sistema incluyen:

```json
{
  "id": "RES_1775172168550_0.123456",
  "timestamp": "2026-04-07T10:20:00.000Z",
  "nodeId": 1,
  "lamportClock": 10001,
  "action": "RESERVE",
  "flightId": "FL001",
  "seatNumber": "1A",
  "status": "SUCCESS",
  ...
}
```

Campo `lamportClock`: Marca de Lamport asignada al momento de crear el evento

## Testing

**Script:** `test_ticket_7_lamport.ps1`

Ejecuta 13 tests que demuestran:

```powershell
./test_ticket_7_lamport.ps1
```

**Tests Incluidos:**
1. Relojes iniciales de cada nodo
2. Creación de vuelo
3. Reserva de asiento
4. Compra de boleto
5. Eventos ordenados por Lamport
6. Incremento de relojes tras operaciones
7. Estadísticas de sincronización
8. Operación en nodo remoto
9. Sincronización entre nodos
10. Matriz de causalidad
11. Eventos recibidos
12. Historial completo
13. Cancelación

## Casos de Uso

### 1. Determinar Orden de Operaciones Conflictivas
```javascript
// Dos usuarios intentan comprar el mismo asiento
// Operación de Node 1: L=10002
// Operación de Node 2: L=20001

// L=10002 < L=20001 → Operación de Node 1 sucedió primero
// La segunda operación debe ser rechazada
```

### 2. Reconstruir Secuencia de Eventos
```javascript
const history = lamportClock.getOrderedHistory();
// Historial ordenado cronológicamente por reloj lógico
// Útil para auditoría y debugging
```

### 3. Verificar Causalidad
```javascript
const causality = lamportClock.getCausalityMatrix();
// Si "event A before event B" → event A causó cambios que event B observó
// Ayuda a entender dependencias entre operaciones
```

### 4. Sincronización Eventual
```javascript
// Node 1 recibe evento de Node 2: L'=20003
// Node 1 calcula: L = max(10002, 20003) + 1 = 20004
// Garantiza que L siempre > L' para eventos posteriores
```

## Consideraciones de Diseño

1. **Inicialización Única por Nodo:** Cada nodo comienza con valor diferente (nodeId * 10000) para evitar colisiones iniciales

2. **Operación Local Prioritaria:** max(L, L') + 1 ensures L > L' siempre

3. **Broadcast Asincrónico:** Eventos se envían sin bloquear respuesta al cliente

4. **Retry Buffer:** Eventos fallidos se almacenan en buffer para reintento

5. **Aislamiento por Evento:** Cada evento registra sus propios metadatos

## Limitaciones Actuales

1. Los nodos mantienen data stores independientes (no hay sincronización de datos de vuelos, solo eventos)
2. Sin persistencia (todos los datos en memoria)
3. Sin verificación de integridad criptográfica
4. Sin compresión de historial de eventos

## Próximas Mejoras (Futuros Tickets)

- **TICKET #8:** Sincronización de datos entre nodos (vuelos, asientos, etc.)
- **TICKET #9:** Persistencia en base de datos
- **TICKET #10:** Detección de conflictos y reconciliación
- **TICKET #11:** Compresión de historial de eventos

---

**Documentación TICKET #7 Completada**
Implementación de Reloj Lógico de Lamport para sistemas distribuidos ✅
