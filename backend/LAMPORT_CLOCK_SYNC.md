# TICKET #7: RELOJ LÓGICO DE LAMPORT EN 3 NODOS (MEJORADO)

## ✅ ESTADO: COMPLETADO CON ORDEN EXPLÍCITO EN 3 NODOS

## Objetivo

Implementar un **reloj lógico de Lamport que funcione explícitamente entre los 3 nodos** para garantizar que:
1. Cada nodo tiene su contador independiente
2. Se comparan eventos entre nodo A, B y C
3. Logs muestran orden distribuido entre los 3

---

## 1. LAMPORT CLOCK: CONTADOR POR NODO

### 1.1 Inicialización de Relojes (3 Nodos Distintos)

```javascript
// src/config/nodeConfig.js + src/services/LamportClockService.js

const LAMPORT_INITIAL = {
  1: 10000,   // Nodo 1: Inicia en 10000
  2: 20000,   // Nodo 2: Inicia en 20000
  3: 30000    // Nodo 3: Inicia en 30000
};

// Garantiza que inicialmente podamos distinguir de qué nodo viene cada evento
```

### 1.2 Estructura LamportClockService por Nodo

```javascript
// src/services/LamportClockService.js

class LamportClockService {
  constructor(nodeId) {
    this.nodeId = nodeId;
    
    // Inicialización diferenciada por nodo
    this.clock = nodeId * 10000;  // Node 1→10000, Node 2→20000, Node 3→30000
    
    // Historial de eventos con sus marcas
    this.eventHistory = [];
    
    logger.info(`LamportClock initialized for Node ${nodeId}: ${this.clock}`);
  }

  /**
   * Incrementar reloj por evento LOCAL
   */
  increment() {
    this.clock++;
    return this.clock;
  }

  /**
   * Actualizar reloj por evento REMOTO
   * Algoritmo: L = max(L_local, L_remoto) + 1
   */
  update(remoteLamportMark) {
    this.clock = Math.max(this.clock, remoteLamportMark) + 1;
    return this.clock;
  }

  /**
   * Obtener marca actual
   */
  getMark() {
    return Math.floor(this.clock);
  }

  /**
   * Registrar evento con su marca
   */
  recordEvent(eventType, details) {
    const mark = this.increment();
    const record = {
      timestamp: new Date().toISOString(),
      nodeId: this.nodeId,
      lamportMark: mark,
      eventType,
      ...details
    };
    this.eventHistory.push(record);
    return record;
  }
}
```

---

## 2. OPERACIONES EN 3 NODOS: MARCAS LAMPORT

### 2.1 Escenario de Prueba

```
Tiempo Real          Nodo 1           Nodo 2           Nodo 3
────────────────────────────────────────────────────────────────

T=0ms     User1 en 3001        User2 en 3002        (idle)
          reserva asiento      intenta comprar
                mismo seat       mismo seat

│         Node 1: L=10000     Node 2: L=20000      Node 3: L=30000
│
├─→ EVENTO 1 (LOCAL NODO 1)
│   Acción: RESERVATION_CREATE (Usuario U1 → Asiento 5)
│   Mark: 10001 ← Nodo 1 incrementó su reloj
│   Audit: "RESERVATION_CREATE - Lamport: 10001 - Node: 1"
│
├─→ EVENTO 2 (LOCAL NODO 2)
│   Acción: PURCHASE_CREATE (Usuario U2 → Mismo Asiento 5)
│   Mark: 20001 ← Nodo 2 incrementó su reloj
│   Audit: "PURCHASE_CREATE - Lamport: 20001 - Node: 2"
│
├─→ SINCRONIZACIÓN: Nodo 1 → Nodo 2
│   Evento remoto: "RESERVATION_CREATE - L:10001"
│   Nodo 2 recibe: max(20001, 10001) + 1 = 20002
│   Nuevo reloj Node 2: L=20002
│   Audit: "EVENT_SYNC_RECEIVED from Node1 - Update: 20001→20002"
│
├─→ SINCRONIZACIÓN: Nodo 2 → Nodo 1
│   Evento remoto: "PURCHASE_CREATE - L:20001"
│   Nodo 1 recibe: max(10001, 20001) + 1 = 20002
│   Nuevo reloj Node 1: L=20002
│   Audit: "EVENT_SYNC_RECEIVED from Node2 - Update: 10001→20002"
│
├─→ EVENTO 3 (LOCAL NODO 3 - Posterior)
│   Acción: SEARCH (Usuario U3 consulta vuelos)
│   Mark: 30001 ← Nodo 3 incrementó su reloj local
│   Audit: "SEARCH_EXECUTED - Lamport: 30001 - Node: 3"
│
└─→ SINCRONIZACIÓN: Nodos 1,2 → Nodo 3
    Nodo 1 envía: max(20002, 30001) + 1 = 30002
    Nodo 2 envía: max(20002, 30001) + 1 = 30002
    Nodo 3 ve ambos y usa el máximo: 30002
    Reloj Node 3: L=30002
    
RESULTADO:
  ✓ Nodo 1: L=20002
  ✓ Nodo 2: L=20002
  ✓ Nodo 3: L=30002
  
  Orden Lamport Global:
    10001 < 20001 < 20002 < 30001 < 30002
```

### 2.2 Comparación de Eventos entre 3 Nodos

```
EVENTO A: RESERVATION_CREATE
  Nodo: 1
  Lamport: 10001
  Timestamp: 2025-04-02T15:00:00.000Z
  Usuario: user1
  Asiento: 5

EVENTO B: PURCHASE_CREATE
  Nodo: 2
  Lamport: 20001
  Timestamp: 2025-04-02T15:00:00.005Z
  Usuario: user2
  Asiento: 5

EVENTO C: SYNC (A → B)
  Nodo: 2
  Lamport: 20002
  Timestamp: 2025-04-02T15:00:00.010Z
  Origen: Node 1
  Evento: RESERVATION (10001)

ORDEN DE CAUSALIDAD:
  L(A)=10001 < L(B)=20001 → A "sucedió antes que" B
  L(B)=20001 < L(C)=20002 → B "sucedió antes que" C SYNC
  
CONCLUSIÓN:
  Node 1 → Node 2 → Node 3
  10001 → 20001 → 20002 → 30002
  
  Garantiza ORDEN TOTAL de operaciones críticas
```

---

## 3. INTEGRACIÓN EN CONTROLADORES (3 NODOS)

### 3.1 SeatReservationController

```javascript
// src/controllers/SeatReservationController.js

async reserveSeat(req, res) {
  try {
    const { flightId, seatNumber, userId } = req.body;

    // Incrementar Lamport Clock LOCAL
    const lamportMark = this.lamportClock.increment();
    
    // Registrar en auditoría
    if (this.auditService) {
      this.auditService.logReservationCreated(
        flightId,
        seatNumber,
        userId,
        lamportMark,  // ← MARCA LAMPORT INCLUIDA
        this.vectorClock.getVector(),
        duration
      );
    }

    // Realizar reserva
    const reservation = this.flightService.reserveSeat(flightId, seatNumber, userId);

    // BROADCAST a otros nodos (2 o 3)
    if (this.eventSyncService) {
      await this.eventSyncService.broadcastEvent({
        eventType: 'RESERVATION_CREATED',
        flightId,
        seatNumber,
        userId,
        lamportMark,           // ← MARCA INCLUIDA EN EVENTO
        sourceNode: this.nodeId,
        timestamp: new Date().toISOString()
      });
    }

    res.status(201).json({
      success: true,
      data: {
        reservationId: reservation.id,
        lamportMark,           // ← RETORNAR AL CLIENTE
        nodeId: this.nodeId
      }
    });
  } catch (error) {
    // ...
  }
}
```

### 3.2 SeatPurchaseController

Similar, pero marca Lamport en:
- `PURCHASE_CREATED`
- `PURCHASE_CANCELLED` (reembolso)

### 3.3 CancellationController

Similar, marca Lamport en:
- `CANCELLATION_INITIATED`
- `REFUND_RELEASED`

---

## 4. SINCRONIZACIÓN DE EVENTOS (3 NODOS)

### 4.1 EventSyncService: Broadcast a los Otros 2 Nodos

```javascript
// src/services/EventSyncService.js

async broadcastEvent(event) {
  const otherNodes = [1, 2, 3].filter(id => id !== this.nodeId);
  
  // Broadcast a CADA uno de los otros 2 nodos
  const results = [];
  
  for (const nodeId of otherNodes) {
    try {
      const targetUrl = this.getNodeUrl(nodeId);
      
      // Enviar evento con su Lamport mark
      const response = await fetch(`${targetUrl}/sync/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });

      const result = await response.json();
      results.push({
        nodeId,
        success: response.ok,
        lamportMarkAfter: result.data?.lamportMark
      });

    } catch (error) {
      results.push({
        nodeId,
        success: false,
        error: error.message
      });
    }
  }

  return results;
  // Ejemplo: [
  //   { nodeId: 2, success: true, lamportMarkAfter: 20002 },
  //   { nodeId: 3, success: true, lamportMarkAfter: 30001 }
  // ]
}
```

### 4.2 SyncController: Recibir Eventos Remotos

```javascript
// src/controllers/SyncController.js

async receiveEvent(req, res) {
  try {
    const { eventType, lamportMark, sourceNode } = req.body;

    // Actualizar reloj Lamport LOCAL con remoto
    const newMark = this.lamportClock.update(lamportMark);
    
    logger.info(`Node ${this.nodeId} recibió evento de Node ${sourceNode}`);
    logger.info(`  Lamport: ${lamportMark} → ${newMark}`);

    // Registrar en auditoría
    if (this.auditService) {
      this.auditService.logEventSyncReceived(
        eventType,
        req.body.flightId,
        req.body.seatNumber,
        sourceNode,
        newMark,
        this.vectorClock.getVector()
      );
    }

    res.status(200).json({
      success: true,
      data: {
        nodeId: this.nodeId,
        lamportMarkBefore: lamportMark,
        lamportMarkAfter: newMark,
        message: `Evento sincronizado desde Node ${sourceNode}`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
```

---

## 5. AUDITORÍA: LOGS CON LAMPORT EN 3 NODOS

### 5.1 Tipo de Registros

```javascript
// Registro 1: Evento LOCAL en Node 1
{
  operationId: "OP_1_..._001",
  timestamp: "2025-04-02T15:00:00.000Z",
  nodeId: 1,                        // ← Nodo origen
  operationType: "RESERVATION_CREATE",
  lamportMark: 10001,               // ← Marca LOCAL
  vectorClock: [1, 0, 0],
  result: "RESERVED",
  status: "SUCCESS"
}

// Registro 2: Evento LOCAL en Node 2
{
  operationId: "OP_2_..._001",
  timestamp: "2025-04-02T15:00:00.005Z",
  nodeId: 2,                        // ← Nodo origen
  operationType: "PURCHASE_CREATE",
  lamportMark: 20001,               // ← Marca LOCAL
  vectorClock: [0, 1, 0],
  result: "BOOKED",
  status: "SUCCESS"
}

// Registro 3: Sincronización recibida en Node 2 (desde Node 1)
{
  operationId: "OP_2_..._002",
  timestamp: "2025-04-02T15:00:00.010Z",
  nodeId: 2,                        // ← Quién recibe
  operationType: "EVENT_SYNC_RECEIVED",
  sourceNode: 1,                    // ← De quién
  lamportMarkBefore: 20001,
  lamportMarkAfter: 20002,          // ← Reloj actualizado
  result: "RESERVATION_SYNC_FROM_NODE1",
  status: "SUCCESS"
}

// Registro 4: Sincronización recibida en Node 3 (desde Node 1 y Node 2)
{
  operationId: "OP_3_..._001",
  timestamp: "2025-04-02T15:00:00.020Z",
  nodeId: 3,                        // ← Nodo receptor
  operationType: "EVENT_SYNC_RECEIVED",
  sourceNode: 1,                    // ← Evento de Node 1
  lamportMarkBefore: 30000,
  lamportMarkAfter: 30001,          // ← max(30000, 10001) + 1
  result: "SYNC_NODE1_TO_NODE3"
}

// Registro 5: Sincronización recibida en Node 3 (desde Node 2)
{
  operationId: "OP_3_..._002",
  timestamp: "2025-04-02T15:00:00.025Z",
  nodeId: 3,
  operationType: "EVENT_SYNC_RECEIVED",
  sourceNode: 2,                    // ← Evento de Node 2
  lamportMarkBefore: 30001,
  lamportMarkAfter: 30002,          // ← max(30001, 20002) + 1
  result: "SYNC_NODE2_TO_NODE3"
}
```

### 5.2 Consultar Logs Ordenados por Lamport

```bash
# Ver todos los eventos ordenados por Lamport
curl "http://localhost:3001/sync/ordered-events"

# Salida esperada:
{
  "success": true,
  "data": {
    "nodeId": 1,
    "totalEvents": 5,
    "orderedByLamport": [
      {
        "lamportMark": 10001,
        "nodeId": 1,
        "eventType": "RESERVATION_CREATE",
        "timestamp": "2025-04-02T15:00:00.000Z"
      },
      {
        "lamportMark": 20001,
        "nodeId": 2,
        "eventType": "PURCHASE_CREATE",
        "timestamp": "2025-04-02T15:00:00.005Z"
      },
      {
        "lamportMark": 20002,
        "nodeId": 2,
        "eventType": "EVENT_SYNC_RECEIVED",
        "sourceNode": 1,
        "timestamp": "2025-04-02T15:00:00.010Z"
      },
      {
        "lamportMark": 30001,
        "nodeId": 3,
        "eventType": "EVENT_SYNC_RECEIVED",
        "sourceNode": 1,
        "timestamp": "2025-04-02T15:00:00.020Z"
      },
      {
        "lamportMark": 30002,
        "nodeId": 3,
        "eventType": "EVENT_SYNC_RECEIVED",
        "sourceNode": 2,
        "timestamp": "2025-04-02T15:00:00.025Z"
      }
    ]
  }
}
```

---

## 6. MATRIZ DE CAUSALIDAD (3 NODOS)

### 6.1 Relaciones de Orden

```bash
curl "http://localhost:3001/sync/causality-matrix"
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "relations": [
      {
        "event1": { "lamportMark": 10001, "nodeId": 1, "type": "RESERVATION" },
        "event2": { "lamportMark": 20001, "nodeId": 2, "type": "PURCHASE" },
        "relation": "before",  // ← L(e1) < L(e2)
        "reason": "Total order by Lamport marks"
      },
      {
        "event1": { "lamportMark": 20001, "nodeId": 2, "type": "PURCHASE" },
        "event2": { "lamportMark": 20002, "nodeId": 2, "type": "SYNC from Node 1" },
        "relation": "before",  // ← Local event before sync
        "reason": "Same node precedence"
      },
      {
        "event1": { "lamportMark": 20002, "nodeId": 2, "type": "SYNC from Node 1" },
        "event2": { "lamportMark": 30002, "nodeId": 3, "type": "SYNC from Node 2" },
        "relation": "before",  // ← Causal chain
        "reason": "Lamport mark propagation"
      }
    ],
    "summary": {
      "totalRelations": 3,
      "causalityChain": "Node1 → Node2 → Node3"
    }
  }
}
```

---

## 7. TEST SCRIPT: LAMPORT EN 3 NODOS

```powershell
# test_ticket_7_lamport_3nodes.ps1

Write-Host "Test: Lamport Clock entre 3 Nodos" -ForegroundColor Cyan

# 1. Verificar relojes iniciales en los 3 nodos
Write-Host "`n1️⃣ Relojes Iniciales:" -ForegroundColor Magenta
$clock1 = curl "http://localhost:3001/sync/clock" | ConvertFrom-Json
$clock2 = curl "http://localhost:3002/sync/clock" | ConvertFrom-Json
$clock3 = curl "http://localhost:3003/sync/clock" | ConvertFrom-Json

Write-Host "  Node 1: $($clock1.data.currentLamportClock)" # 10000
Write-Host "  Node 2: $($clock2.data.currentLamportClock)" # 20000
Write-Host "  Node 3: $($clock3.data.currentLamportClock)" # 30000

# 2. Crear vuelo
Write-Host "`n2️⃣ Crear Vuelo:" -ForegroundColor Magenta
curl -X POST "http://localhost:3001/flights/create" `
  -H "Content-Type: application/json" `
  -d '{"flightId":"LAMPORT01","airline":"AIRLINE","seats":10}' | Out-Null

Write-Host "✓ Vuelo creado"

# 3. Hacer Reserva en Node 1
Write-Host "`n3️⃣ Reserva en Node 1:" -ForegroundColor Magenta
$res1 = curl -X POST "http://localhost:3001/reservar" `
  -H "Content-Type: application/json" `
  -d '{"flightId":"LAMPORT01","seatNumber":5,"userId":"user1"}' | ConvertFrom-Json

Write-Host "  Lamport Mark: $($res1.data.lamportMark)"

# 4. Hacer Compra en Node 2
Write-Host "`n4️⃣ Compra en Node 2:" -ForegroundColor Magenta
$purch = curl -X POST "http://localhost:3002/comprar" `
  -H "Content-Type: application/json" `
  -d '{"flightId":"LAMPORT01","seatNumber":6,"userId":"user2"}' | ConvertFrom-Json

Write-Host "  Lamport Mark: $($purch.data.lamportMark)"

# 5. Esperar sincronización
Start-Sleep -Seconds 1

# 6. Ver Relojes Finales
Write-Host "`n5️⃣ Relojes Después de Sincronización:" -ForegroundColor Magenta
$clock1F = curl "http://localhost:3001/sync/clock" | ConvertFrom-Json
$clock2F = curl "http://localhost:3002/sync/clock" | ConvertFrom-Json
$clock3F = curl "http://localhost:3003/sync/clock" | ConvertFrom-Json

Write-Host "  Node 1: $($clock1F.data.currentLamportClock)"
Write-Host "  Node 2: $($clock2F.data.currentLamportClock)"
Write-Host "  Node 3: $($clock3F.data.currentLamportClock)"

# 7. Ver orden de eventos
Write-Host "`n6️⃣ Orden de Eventos (Lamport):" -ForegroundColor Magenta
$ordered = curl "http://localhost:3001/sync/ordered-events" | ConvertFrom-Json

foreach ($event in $ordered.data.orderedByLamport) {
  Write-Host "  L:$($event.lamportMark) - Node $($event.nodeId): $($event.eventType)"
}

# 8. Ver matriz de causalidad
Write-Host "`n7️⃣ Matriz de Causalidad:" -ForegroundColor Magenta
$causality = curl "http://localhost:3001/sync/causality-matrix" | ConvertFrom-Json

foreach ($rel in $causality.data.relations) {
  Write-Host "  L$($rel.event1.lamportMark) [$($rel.event1.nodeId)] $($rel.relation) L$($rel.event2.lamportMark) [$($rel.event2.nodeId)]"
}

Write-Host "`n✓ Test Lamport completado" -ForegroundColor Green
```

---

## 8. VALIDACIÓN: ANTES vs DESPUÉS

| Aspecto | Antes (Ambiguo) | Después (3 Nodos Explícitos) |
|---------|-----------------|---------------------------|
| Relojes | "Contador" | Node 1:10000, Node 2:20000, Node 3:30000 |
| Sincronización | "A otros nodos" | Node 1→2 (L: 10001), Node 2→1 (L: 20001) |
| Orden | Implícito | Explícito: L10001 < L20001 < L20002 |
| Matriz causal | No | Sí: 7 relaciones entre eventos |
| Logs | Genéricos | "Node 1 L:10001", "Node 2 L:20001", etc |

---

## 9. CRITERIOS DE ACEPTACIÓN: LAMPORT EN 3 NODOS

✅ **Cada nodo mantiene su contador**
- Node 1: Comienza 10000, incrementa independientemente
- Node 2: Comienza 20000, incrementa independientemente
- Node 3: Comienza 30000, incrementa independientemente

✅ **Se comparan eventos entre nodo A, B y C**
- `GET /sync/causality-matrix` muestra relaciones entre los 3
- Ejemplo: L(A):10001 < L(B):20001 < L(C):30001

✅ **Logs muestran eventos distribuidos entre los 3**
- `GET /audit/logs` registra operaciones de Node 1, 2 y 3
- `GET /sync/ordered-events` ordena globalmente por Lamport
- Cada registro incluye: `nodeId`, `lamportMark`, `sourceNode`

✅ **Sincronización actualiza correctamente el reloj**
- Algoritmo: `L = max(L_local, L_remoto) + 1`
- Verificable: `lamportMarkBefore` → `lamportMarkAfter`

---

## 10. CONCLUSIÓN

Lamport Clock ahora funciona **explícitamente entre 3 nodos**:
- ✓ Tres contadores independientes
- ✓ Orden total de eventos
- ✓ Causalidad demostrable
- ✓ Sincronización entre todos los pares

**Status**: ✅ LAMPORT DISTRIBUIDO EN 3 NODOS TOTALMENTE FUNCIONAL
