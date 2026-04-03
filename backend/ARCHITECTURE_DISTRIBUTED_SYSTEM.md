# TICKET #1: ARQUITECTURA BASE DEL SERVIDOR DISTRIBUIDO (MEJORADO)

## ✅ ESTADO: COMPLETADO CON 3 NODOS EXPLÍCITOS

## Objetivo

Establecer una arquitectura distribuida **con 3 nodos independientes**, cada uno con:
- Puerto dedicado
- Almacenamiento independiente
- Capacidad de replicación y sincronización de eventos
- Configuración explícita de múltiple replicación

---

## 1. ARCHITECURA DE 3 NODOS INDEPENDIENTES

### 1.1 Configuración Explícita

```javascript
// src/config/nodeConfig.js
const nodeConfig = {
  1: {
    id: 1,
    port: 3001,
    url: 'http://localhost:3001',
    name: 'Servidor Nodo 1',
    storage: 'independiente'      // ← Almacenamiento del Nodo 1
  },
  2: {
    id: 2,
    port: 3002,
    url: 'http://localhost:3002',
    name: 'Servidor Nodo 2',
    storage: 'independiente'      // ← Almacenamiento del Nodo 2
  },
  3: {
    id: 3,
    port: 3003,
    url: 'http://localhost:3003',
    name: 'Servidor Nodo 3',
    storage: 'independiente'      // ← Almacenamiento del Nodo 3
  }
};
```

### 1.2 Topología de Red

```
┌──────────────────────────────────────────────────────────────┐
│                    SISTEMA DISTRIBUIDO                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────┐    ┌────────────────┐    ┌────────────────┐
│  │   NODO 1       │    │   NODO 2       │    │   NODO 3       │
│  │   Puerto 3001  │    │   Puerto 3002  │    │   Puerto 3003  │
│  ├────────────────┤    ├────────────────┤    ├────────────────┤
│  │ Storage 1      │    │ Storage 2      │    │ Storage 3      │
│  │ - Vuelos       │    │ - Vuelos       │    │ - Vuelos       │
│  │ - Asientos     │    │ - Asientos     │    │ - Asientos     │
│  │ - Reservas     │    │ - Reservas     │    │ - Reservas     │
│  └────────────────┘    └────────────────┘    └────────────────┘
│         │ │ │                │ │ │                │ │ │
│         └─┼─┘────────────────┼─┼─┘────────────────┼─┼─┘
│           │ ←SYNC EVENTOS→   │                    │
│           └──────────────────────────────────────┘
│
│  Cada nodo sincroniza con los OTROS DOS
│  Ejemplo: Node 1 → Node 2 ✓ y Node 1 → Node 3 ✓
│
└──────────────────────────────────────────────────────────────┘
```

### 1.3 Independencia de Almacenamiento

**Nodo 1 (Puerto 3001)**
```
Vuelos: { id: "F1", asientos: [...] }
Reservas: { "F1:5": { estado: "RESERVED", usuarioId: "U1" }}
```

**Nodo 2 (Puerto 3002)**
```
Vuelos: { id: "F1", asientos: [...] }
Reservas: { "F1:5": { estado: "AVAILABLE" } }  ← Diferente estado
```

**Nodo 3 (Puerto 3003)**
```
Vuelos: { id: "F1", asientos: [...] }
Reservas: { "F1:5": { estado: "AVAILABLE" } }  ← Diferente estado
```

Sin sincronización = Inconsistencia. Con sincronización = Consistencia eventual.

---

## 2. INICIO EXPLÍCITO DE 3 NODOS

### 2.1 Comando por Terminal

```bash
# Terminal 1: Iniciar Nodo 1
Node_ID=1 npm run node1
# Salida esperada:
# 🚀 Servidor Nodo 1 iniciado correctamente
# Puerto: 3001
# Nodos conectados: 2
#   - Servidor Nodo 2: http://localhost:3002
#   - Servidor Nodo 3: http://localhost:3003

# Terminal 2: Iniciar Nodo 2
NODE_ID=2 npm run node2
# Salida esperada:
# 🚀 Servidor Nodo 2 iniciado correctamente
# Puerto: 3002
# Nodos conectados: 2
#   - Servidor Nodo 1: http://localhost:3001
#   - Servidor Nodo 3: http://localhost:3003

# Terminal 3: Iniciar Nodo 3
NODE_ID=3 npm run node3
# Salida esperada:
# 🚀 Servidor Nodo 3 iniciado correctamente
# Puerto: 3003
# Nodos conectados: 2
#   - Servidor Nodo 1: http://localhost:3001
#   - Servidor Nodo 2: http://localhost:3002
```

### 2.2 Script PowerShell para Iniciar los 3

```powershell
# Iniciar los 3 nodos en paralelo
Write-Host "Iniciando 3 nodos distribuidos..." -ForegroundColor Cyan

# Nodo 1
Write-Host "→ Inicializando Node 1 (Puerto 3001)..."
$job1 = Start-Job -ScriptBlock { cd ".\backend"; NODE_ID=1 npm run node1 }

# Nodo 2
Write-Host "→ Inicializando Node 2 (Puerto 3002)..."
$job2 = Start-Job -ScriptBlock { cd ".\backend"; NODE_ID=2 npm run node2 }

# Nodo 3
Write-Host "→ Inicializando Node 3 (Puerto 3003)..."
$job3 = Start-Job -ScriptBlock { cd ".\backend"; NODE_ID=3 npm run node3 }

Write-Host "✓ Los 3 nodos están en proceso de inicio" -ForegroundColor Green
```

---

## 3. ALMACENAMIENTO INDEPENDIENTE POR NODO

### 3.1 Estructura de Datos

Cada nodo mantiene su propia instancia de:

| Componente | Nodo 1 | Nodo 2 | Nodo 3 |
|-----------|--------|--------|--------|
| Vuelos | FlightService() | FlightService() | FlightService() |
| Asientos | Seat[] | Seat[] | Seat[] |
| Reservas | Reservation[] | Reservation[] | Reservation[] |
| Lamport Clock | Contador independiente | Contador independiente | Contador independiente |
| Vector Clock | [1,0,0] | [0,1,0] | [0,0,1] |

### 3.2 Inicialización por Nodo

```javascript
// src/index.js
const nodeId = parseInt(process.env.NODE_ID) || 1;

// Servicio de Vuelos INDEPENDIENTE para cada nodo
const flightService = new FlightService(nodeId);
// Crea almacenamiento propio del nodo

// Reloj de Lamport único por nodo
const lamportClock = new LamportClockService(nodeId);
// Comienza en: nodeId * 10000 para que sea diferente por nodo

// Vector Clock único por nodo
const vectorClock = new VectorClockService(nodeId, 3);
// Inicializa: [0,0,0] → Nodo 1: [1,0,0], Nodo 2: [0,1,0], Nodo 3: [0,0,1]
```

---

## 4. REPLICACIÓN Y SINCRONIZACIÓN ENTRE 3 NODOS

### 4.1 EventSyncService: Conecta los 3 Nodos

```
Nodo 1 (Node A)
    │
    ├─→ Evento: "RESERVATION_CREATED"
    │   ├─→ Envía a Nodo 2 ✓
    │   └─→ Envía a Nodo 3 ✓
    │
Nodo 2 y Nodo 3 reciben y actualizan su almacenamiento
```

### 4.2 Configuración Explícita de Replicación

```javascript
// En cada nodo se configura la replicación a los OTROS 2
const eventSyncService = new EventSyncService(nodeId);
eventSyncService.setRemoteNodes([
  'http://localhost:3001',  // Si estoy en Node 2, Node 1 es remoto
  'http://localhost:3002',  // Si estoy en Node 2, Node 2 es yo (ignorado)
  'http://localhost:3003'   // Si estoy en Node 2, Node 3 es remoto
]);

// EventSyncService AUTOMÁTICAMENTE filtra y envía a los otros 2
```

### 4.3 Flujo de Replicación de Evento

```
PASO 1: Usuario reserva asiento en NODO 1 (3001)
    │
    ├─→ FlightService.reserveSeat() en Nodo 1
    │   └─→ Local Storage Nodo 1: { "F1:5": RESERVED }
    │
PASO 2: Registrar en AuditService (Nodo 1)
    │   └─→ Audit Log: "RESERVATION_CREATE en Nodo 1"
    │
PASO 3: Sincronizar evento a NODO 2 y NODO 3
    │
    ├─→ EventSyncService.broadcastEvent() 
    │   ├─→ POST http://localhost:3002/sync/events
    │   │   └─→ Nodo 2 recibe
    │   │       └─→ FlightService.reserveSeat() en Nodo 2
    │   │           └─→ Local Storage Nodo 2: { "F1:5": RESERVED }
    │   │
    │   └─→ POST http://localhost:3003/sync/events
    │       └─→ Nodo 3 recibe
    │           └─→ FlightService.reserveSeat() en Nodo 3
    │               └─→ Local Storage Nodo 3: { "F1:5": RESERVED }
    │
RESULTADO: Los 3 almacenamientos independientes están en SINCRONÍA
    ✓ Nodo 1: { "F1:5": RESERVED }
    ✓ Nodo 2: { "F1:5": RESERVED }
    ✓ Nodo 3: { "F1:5": RESERVED }
```

---

## 5. VERIFICACIÓN DE ARQUITECTURA DE 3 NODOS

### 5.1 Comprobar que cada nodo está activo

```bash
# Nodo 1
curl http://localhost:3001/health
# Respuesta esperada: { "status": "OK", "nodeId": 1 }

# Nodo 2
curl http://localhost:3002/health
# Respuesta esperada: { "status": "OK", "nodeId": 2 }

# Nodo 3
curl http://localhost:3003/health
# Respuesta esperada: { "status": "OK", "nodeId": 3 }
```

### 5.2 Ver configuración de cada nodo

```javascript
GET http://localhost:3001/
// Respuesta:
{
  "message": "Servidor de Reservas Distribuido",
  "nodeId": 1,
  "nodeName": "Servidor Nodo 1",
  "port": 3001,
  "otherNodes": [
    { "id": 2, "name": "Servidor Nodo 2", "url": "http://localhost:3002" },
    { "id": 3, "name": "Servidor Nodo 3", "url": "http://localhost:3003" }
  ]
}
```

### 5.3 Verificar Almacenamiento Independiente

```bash
# Crear vuelo en Nodo 1
curl -X POST http://localhost:3001/flights/create \
  -H "Content-Type: application/json" \
  -d '{"flightId":"TEST01","airline":"AA","seats":10}'

# Esperar sincronización (≈100ms)
sleep 0.1

# Verificar en NODO 2
curl http://localhost:3002/flights/search?flightId=TEST01
# ✓ Vuelo aparece (sincronizado)

# Verificar en NODO 3
curl http://localhost:3003/flights/search?flightId=TEST01
# ✓ Vuelo aparece (sincronizado)
```

---

## 6. DEMOSTRACIÓN DE INDEPENDENCIA

### 6.1 Prueba: Dos Nodos Hacen Operaciones Diferentes Simultáneamente

```bash
# NODO 1: Reserva asiento 5
curl -X POST http://localhost:3001/reservar \
  -d '{"flightId":"F1","seatNumber":5,"userId":"user1"}' &

# NODO 2 (casi simultáneamente): Intenta comprar asiento 5
curl -X POST http://localhost:3002/comprar \
  -d '{"flightId":"F1","seatNumber":5,"userId":"user2"}' &

# RESULTADO: Se registra conflicto (prevención de doble reserva)
# Ver en auditoría:
curl http://localhost:3001/audit/conflicts
```

### 6.2 Resultado Esperado: Conflicto Detectado en 3 Nodos

```json
{
  "data": {
    "conflicts": [
      {
        "conflictId": "CONF_001",
        "timestamp": "2025-04-02T15:30:00.000Z",
        "nodo1": 1,
        "nodo2": 2,
        "recurso": "F1:5",
        "estado": "RESUELTO",
        "ganador": 1,
        "razon": "NODE_1_ID_MENOR",
        "propagadoA": [2, 3]  // ← CONFIRMADO: Propagado a los 3
      }
    ]
  }
}
```

---

## 7. COMPARATIVA: ANTES vs DESPUÉS

| Aspecto | Antes (Ambiguo) | Después (Explícito) |
|---------|-----------------|---------------------|
| Configuración | "2+ nodos" | 3 nodos específicos (3001, 3002, 3003) |
| Almacenamiento | Genérico | Independiente por nodo |
| Replicación | "A los otros" | Nodo 1→2,3; Nodo 2→1,3; Nodo 3→1,2 |
| Sin sincronización actual | Inconsistencia | Explícitamente se ve diferencia |
| Con sincronización | Convergencia | Todos los 3 llegan al mismo estado |
| Auditoría | "Eventos distribuidos" | "Propagado a Nodo 2 ✓, Nodo 3 ✓" |

---

## 8. ARCHIVOS CLAVE

```
src/
├── config/
│   └── nodeConfig.js              ← Configuración de 3 nodos
├── services/
│   ├── FlightService.js           ← Almacenamiento independiente
│   ├── EventSyncService.js        ← Sincronización de eventos
│   ├── LamportClockService.js     ← Reloj único por nodo
│   └── VectorClockService.js      ← Vector [1,0,0], [0,1,0], [0,0,1]
└── index.js                        ← Inicialización del nodo específico
```

---

## 9. CRITERIOS DE ACEPTACIÓN: 3 NODOS EXPLÍCITOS

✅ **3 puertos separados**
- Node 1: 3001
- Node 2: 3002
- Node 3: 3003

✅ **Almacenamiento independiente**
- Cada nodo tiene sus propios datos
- Sin sincronización inicial = Inconsistencia
- Con sincronización = Convergencia

✅ **Replicación 1:N**
- Node 1 → Node 2, 3
- Node 2 → Node 1, 3
- Node 3 → Node 1, 2

✅ **Configuración clara**
- `nodeConfig.js` explícitamente define los 3
- Rutas de sincronización claramente visibles
- ERROR si falta un nodo

✅ **Verificable**
- Health checks en 3 puertos
- Operaciones en los 3 nodos
- Sincronización rastreable en auditoría

---

## 10. PRÓXIMOS PASOS

Con esta arquitectura base explícita de 3 nodos:
- ✅ TICKET #6: Replicación de cancelaciones en los 3
- ✅ TICKET #7: Lamport entre los 3
- ✅ TICKET #8: Vectores 3D: [1,0,0], [0,1,0], [0,0,1]
- ✅ TICKET #9: Conflictos 3-way
- ✅ TICKET #10: Auditoría con confirmación en los 3

---

## Conclusión

La arquitectura ahora es **explícitamente de 3 nodos independientes**, no ambigua. Cada nodo:
- ✓ Tiene puerto dedicado
- ✓ Tiene almacenamiento independiente
- ✓ Sincroniza explícitamente con los otros 2
- ✓ Mantiene sus propios relojes (Lamport y Vector)
- ✓ Puede operar independientemente si se desconecta
- ✓ Converge a consistencia cuando se reconecta

**Status**: ✅ COMPLETO Y VERIFICABLE
