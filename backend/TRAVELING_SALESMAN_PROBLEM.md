# TICKET #15: Resolución del Problema del Viajero (TSP)

## Descripción
Implementación del TSP (Traveling Salesman Problem) para encontrar la mejor ruta que visite múltiples destinos optimizando por **costo** o **tiempo**.

## Algoritmos Implementados

| Algoritmo | Complejidad | Destinos | Uso |
|-----------|-------------|----------|-----|
| **Nearest Neighbor + 2-Opt** | O(n²) | Ilimitado | Heurístico rápido |
| **Brute Force** | O(n!) | ≤ 8 | Solución exacta |

## Endpoints REST

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/tsp/solve` | TSP heurístico (cost/time) |
| `POST` | `/tsp/solve-exact` | TSP exacto (≤8 destinos) |
| `POST` | `/tsp/compare` | Comparar costo vs tiempo |
| `POST` | `/tsp/validate-tour` | Validar tour y calcular métricas |
| `GET`  | `/tsp/stats` | Estadísticas del servicio |

## Ejemplos de Uso

### Resolver TSP por costo
```bash
curl -X POST http://localhost:3001/tsp/solve \
  -H "Content-Type: application/json" \
  -d '{"destinations": ["ATL", "LON", "DXB", "TYO", "PEK"], "criterion": "cost"}'
```

### Resolver TSP por tiempo
```bash
curl -X POST http://localhost:3001/tsp/solve \
  -H "Content-Type: application/json" \
  -d '{"destinations": ["ATL", "LON", "DXB", "TYO", "PEK"], "criterion": "time"}'
```

### Comparar costo vs tiempo
```bash
curl -X POST http://localhost:3001/tsp/compare \
  -H "Content-Type: application/json" \
  -d '{"destinations": ["ATL", "LAX", "DFW", "SAO"]}'
```

### Resolver exacto (≤8 destinos)
```bash
curl -X POST http://localhost:3001/tsp/solve-exact \
  -H "Content-Type: application/json" \
  -d '{"destinations": ["ATL", "LON", "DXB", "TYO"], "criterion": "cost"}'
```

## Respuesta Ejemplo (`/tsp/solve`)
```json
{
  "success": true,
  "path": ["ATL", "DXB", "PEK", "TYO", "LON"],
  "pathString": "ATL → DXB → PEK → TYO → LON",
  "criterion": "cost",
  "iterations": {
    "initial": "2500.00",
    "afterTwoOpt": "2300.00",
    "improvement": "8.00"
  },
  "totalDistance": "2300.00",
  "segments": [...],
  "summary": { "totalSegments": 5, "totalDistance": "2300.00", ... }
}
```

## Scripts de Verificación

```bash
# Demo standalone (sin servidor)
node run_ticket_15.js

# Test REST API (requiere servidor en puerto 3001)
.\test_ticket_15_tsp.ps1
```

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `src/services/TSPService.js` | Lógica TSP (Nearest Neighbor, 2-Opt, Brute Force) |
| `src/controllers/TSPController.js` | Controlador REST |
| `src/routes/tspRoutes.js` | Definición de rutas Express |
| `src/index.js` | Registro del módulo TSP |
| `run_ticket_15.js` | Script de demostración |
| `test_ticket_15_tsp.ps1` | Script de tests REST |
