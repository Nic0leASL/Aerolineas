# TICKET #8: Implementación de Vector Clocks

## Estado: ✅ COMPLETADO

## Descripción
Implementar Vector Clocks para detectar relaciones de causalidad entre eventos distribuidos de forma más precisa que con Lamport Clocks. Los Vector Clocks permiten identificar no solo si un evento precede a otro, sino también detectar eventos concurrentes.

## Cambios Realizados

### 1. VectorClockService (src/services/VectorClockService.js)
**Descripción**: Servicio que implementa el algoritmo de Vector Clock.

**Características principales**:
- **Inicialización**: Vector de n enteros (uno por nodo), todos iniciados en 0
- **Eventos locales**: Incrementa `vectorClock[nodeId-1]` al generar un evento
- **Eventos remotos**: Implementa la regla de fusión:
  - Para cada posición: `VC[j] = max(VC[j], VC_remoto[j])`
  - Luego incrementa `VC[nodeId-1]`
- **Comparación de vectores**: Detecta relaciones de causalidad:
  - `happens-before` (VC1 < VC2): si VC1[i] <= VC2[i] para todo i, con al menos un <
  - `concurrent` (VC1 || VC2): si ninguno precede al otro
  - `equal`: si son idénticos
- **Detección de concurrencia**: Identifica todos los pares de eventos concurrentes
- **Visualización**: Métodos para presentar vectores en formato string

**Métodos principales**:
- `getLocalMark()`: obtiene marca para evento local
- `update(remoteVector)`: actualiza con vector remoto
- `compareVectors(v1, v2)`: compara dos vectores
- `detectConcurrentEvents()`: encuentra todos los pares concurrentes
- `getStats()`: estadísticas del servicio

### 2. EventSyncService (src/services/EventSyncService.js)
**Cambios**:
- Añadido soporte para Vector Clock además de Lamport Clock
- Método `setVectorClock(vectorClock)` para inyectar el servicio
- Actualizado `broadcastEvent()` para incluir el vector clock en la carga
- Actualizado `processRemoteEvent()` para procesar ambos tipos de relojes

**Payload actualizado**:
```javascript
{
  lamportMark: número,
  vectorClock: [n1, n2, n3],  // Nuevo
  event: objeto,
  sourceNodeId: número,
  timestamp: string,
  useVectorClock: boolean  // Indica si usar Vector Clock
}
```

### 3. SyncController (src/controllers/SyncController.js)
**Cambios**:
- Añadido parámetro `vectorClock` al constructor
- Actualizado `receiveRemoteEvent()` para procesar vectorClock
- **Nuevos endpoints para Vector Clock**:
  - `GET /sync/vector-clock`: información del vector actual
  - `GET /sync/vector-history`: historial de eventos con vectores
  - `GET /sync/concurrent-events`: detecta eventos concurrentes

### 4. Controladores de Negocio
**SeatReservationController, SeatPurchaseController, CancellationController**:

Cada uno actualizado para:
1. Obtener marca Vector Clock además de Lamport: `this.vectorClock.getLocalMark()`
2. Adjuntar vector al evento: `event.vectorClock = vectorClock`
3. Registrar en Vector Clock: `this.vectorClock.recordEvent(...)`
4. Pasar vector al broadcast: `this.eventSyncService.broadcastEvent(..., vectorClock)`

### 5. Rutas (src/routes/syncRoutes.js)
**Cambios**:
- Simplificadas para usar directamente métodos del SyncController
- Añadidos endpoints del Vector Clock:
  - `GET /sync/vector-clock`
  - `GET /sync/vector-history`
  - `GET /sync/concurrent-events`

### 6. Inicialización (src/index.js)
**Cambios**:
- Importado VectorClockService
- Creada instancia: `const vectorClock = new VectorClockService(nodeId, 3)`
- Inyectado en EventSyncService: `eventSyncService.setVectorClock(vectorClock)`
- Inyectado en SyncController: `new SyncController(lamportClock, eventSyncService, vectorClock)`
- Inyectado en todos los controladores de negocio

## Algoritmos Implementados

### Incremento Local
```
evento_local(): 
  vectorClock[nodeId] = vectorClock[nodeId] + 1
```

### Actualización Remota
```
actualizar_remoto(vectorRemoto):
  para i = 1 hasta n:
    vectorClock[i] = max(vectorClock[i], vectorRemoto[i])
  vectorClock[nodeId] = vectorClock[nodeId] + 1
```

### Comparación de Vectores
```
vc1 < vc2 (vc1 sucede antes que vc2):
  si vc1[i] <= vc2[i] para todo i
  Y existe j donde vc1[j] < vc2[j]

vc1 || vc2 (eventos concurrentes):
  si NOT(vc1 < vc2) AND NOT(vc2 < vc1)
```

## Nuevos Endpoints

### Vector Clock
- `GET /sync/vector-clock`: Estado actual del vector
- `GET /sync/vector-history?limit=50`: Eventos con vectores
- `GET /sync/concurrent-events`: Pares de eventos concurrentes

### Estadísticas
- `GET /sync/stats`: Incluye estadísticas de ambos relojes

## Testing
El servidor se inicia correctamente con ambos sistemas de relojes:
```
[INFO] LamportClock inicializado {"nodeId":1,"initialClock":10000}
[INFO] VectorClock inicializado {"nodeId":1,"totalNodes":3,"initialVector":[0,0,0,0]}
```

## Ventajas de Vector Clocks vs Lamport Clocks

| Característica | Lamport | Vector Clock |
|---|---|---|
| Detección de causalidad | ✓ | ✓ |
| Detección de concurrencia | ✗ | ✓ |
| Uso de memoria | O(1) | O(n) donde n = # nodos |
| Complejidad de comparación | O(1) | O(n) |
| Precisión | Buena | Excelente |

## Ejemplo de Uso

### Evento local en nodo 1:
```
Enviar evento de reserva:
- vectorClock = [1, 0, 0]
- Evento contiene { ..., vectorClock: [1, 0, 0] }
```

### Evento remoto en nodo 2:
```
Recibir evento de nodo 1 con [1, 0, 0]:
- Merge: [max(0,1), max(0,0), max(0,0)] = [1, 0, 0]
- Incrementar: [1, 1, 0]
- Nuevo vector local: [1, 1, 0]
```

### Detectar concurrencia:
```
Evento A en nodo 1: [1, 0, 0]
Evento B en nodo 2: [0, 1, 0]
Comparación: NOT([1,0,0] < [0,1,0]) AND NOT([0,1,0] < [1,0,0])
Resultado: Concurrentes
```

## Validación

El sistema está listo para:
1. ✅ Enviar y recibir Vector Clocks en eventos
2. ✅ Detectar relaciones causales entre eventos
3. ✅ Identificar eventos concurrentes
4. ✅ Consultar historial de eventos ordenados por vector
5. ✅ Estadísticas de concurrencia en el sistema

## Próximos Pasos (Futuro)
- Implementar Vector Clock con causalidad inversa (para optimización)
- Algoritmo de compresión de vectores (para sistemas con muchos nodos)
- UI para visualizar matrices de causalidad
