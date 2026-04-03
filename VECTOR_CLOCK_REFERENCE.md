# Referencia Rápida - Vector Clocks

## ¿Qué son los Vector Clocks?

Un Vector Clock es un array de n números que permite:
1. **Detectar causalidad**: Saber si un evento causó otro
2. **Detectar concurrencia**: Identificar eventos sin relación causal

## Comparativa Rápida

| | Lamport | Vector Clock |
|---|---------|-------------|
| Orden de eventos | ✓ | ✓ |
| Detecta concurrencia | ✗ | ✓ |
| Memoria | O(1) | O(n) |
| Útil para conflictos | Limitado | **Excelente** |

## Inicialización

```javascript
// Sistema con 3 nodos
new VectorClockService(nodeId, 3)

// Vector inicial para cada nodo
[0, 0, 0]
```

## Cómo Evoluciona el Vector Clock

### Evento Local

Nodo i incrementa su posición:
```
Evento local en Nodo 1: [0,0,0] → [1,0,0]
Evento local en Nodo 2: [0,0,0] → [0,1,0]
```

### Evento Remoto

Merge + incremento:
```
Nodo 3 recibe evento de Nodo 1 con [1,0,0]
1. Merge: max([0,0,0], [1,0,0]) = [1,0,0]
2. Incrementar: [1,0,1]
```

## Relaciones de Causalidad

### Happened-Before (Causalidad)
```
Evento A [1,0,0] → Evento B [1,1,0]
Conclusión: A → B (A causó B)
```

### Concurrente
```
Evento A [1,0,0] || Evento B [0,1,0]
Conclusión: A y B son independientes
```

## Endpoints Principales

### GET /sync/vector-clock
**Estado actual del vector**

```bash
curl http://localhost:3001/sync/vector-clock
```

Response: `{"currentVector": "[1,2,0]", "stats": {...}}`

### GET /sync/vector-history?limit=50
**Historial de eventos**

```bash
curl http://localhost:3001/sync/vector-history?limit=10
```

Response: Array de eventos con sus vectores

### GET /sync/concurrent-events
**Detecta concurrencia**

```bash
curl http://localhost:3001/sync/concurrent-events
```

Response: Lista de pares de eventos concurrentes

## Testing Rápido

### Iniciar servidores
```bash
cd backend
npm start  # Inicia Nodo 1
#En otra terminal:
NODE_ID=2 npm start  # Nodo 2
NODE_ID=3 npm start  # Nodo 3
```

### Verificar estado
```bash
curl http://localhost:3001/sync/vector-clock
```

### Script completo
```bash
./test_ticket_8_complete.ps1
```

## Interpretación de Vectores

```
[0, 0, 0] → Inicial, sin eventos
[1, 0, 0] → Nodo 1 generó 1 evento
[1, 1, 0] → Nodo 1 y 2 han comunicado
[2, 1, 0] → Nodo 1 generó otro evento después de recibir de Nodo 2
```

## Warning: Eventos Concurrentes

Si dos eventos de COMPRA del MISMO asiento son concurrentes:
```
COMPRA_A [1,0,0] || COMPRA_B [0,1,0]
→ CONFLICTO: Overbooking potencial
→ Necesita resolución manual o automática
```

## Casos de Uso

1. **Detección de overbooking**: ¿Dos compras del mismo asiento fueron concurrentes?
2. **Auditoria**: ¿Qué evento causó este problema?
3. **Sincronización**: ¿Cuál fue el orden real de eventos?

## Problemas Comunes

| Problema | Solución |
|----------|----------|
| Vector muestra [0,0,0] | Normal si no hay eventos. Esperar/generar eventos |
| Demasiados concurrentes | Eventos muy rápidos. Revisar timestamps |
| Vectores inconsistentes | Verificar 3 servidores activos |

## Refencias

- [Documentación Técnica Completa](backend/TICKET_8_VECTOR_CLOCKS.md)
- [Guía Detallada de Uso](backend/VECTOR_CLOCK_USAGE.md)
- [Resumen de Implementación](backend/TICKET_8_SUMMARY.md)
