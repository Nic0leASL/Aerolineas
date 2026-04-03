# API REST de Consulta de Vuelos - TICKET #3

## Resumen

La API proporciona endpoints para buscar y consultar vuelos con múltiples filtros avanzados sin requerir lógica de reservas.

## Base URL

```
http://localhost:3001/vuelos
http://localhost:3002/vuelos
http://localhost:3003/vuelos
```

---

## Endpoints

### 1. 🔍 Listar todos los vuelos (con filtros opcionales)

**Endpoint:** `GET /vuelos`

**Query Parameters (todos opcionales):**

| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `origin` | string | Código aeropuerto origen (IATA) | `JFK` |
| `destination` | string | Código aeropuerto destino (IATA) | `LAX` |
| `route` | string | Ruta combinada origen-destino | `JFK-LAX` |
| `status` | string | Estado del vuelo | `SCHEDULED`, `BOARDING`, etc. |
| `departureDate` | ISO 8601 | Fecha específica de despegue | `2024-04-05` |
| `startDate` | ISO 8601 | Fecha inicio de rango | `2024-04-05` |
| `endDate` | ISO 8601 | Fecha fin de rango | `2024-04-10` |
| `flightNumber` | string | Número de vuelo (búsqueda parcial) | `AA` |
| `aircraft` | string | Tipo de aeronave | `Boeing 777` |
| `minAvailable` | number | Mínimo de asientos disponibles | `50` |
| `seatType` | string | Tipo de asiento | `FIRST_CLASS`, `BUSINESS_CLASS`, `ECONOMY_CLASS` |
| `minPrice` | number | Precio mínimo | `300` |
| `maxPrice` | number | Precio máximo | `1000` |

**Ejemplos:**

```bash
# Todos los vuelos
curl http://localhost:3001/vuelos

# De JFK a LAX
curl "http://localhost:3001/vuelos?origin=JFK&destination=LAX"

# Vuelos SCHEDULED solamente
curl "http://localhost:3001/vuelos?status=SCHEDULED"

# Con asientos en primera clase disponibles
curl "http://localhost:3001/vuelos?seatType=FIRST_CLASS&minAvailable=5"

# Entre $300 y $800
curl "http://localhost:3001/vuelos?minPrice=300&maxPrice=800"

# En una fecha específica
curl "http://localhost:3001/vuelos?departureDate=2024-04-05"

# Rango de fechas
curl "http://localhost:3001/vuelos?startDate=2024-04-05&endDate=2024-04-10"
```

**Respuesta:**

```json
{
  "count": 1,
  "filters": {
    "origin": "JFK",
    "destination": "LAX"
  },
  "flights": [
    {
      "id": "FLIGHT_1775170107651_0.41025575560353",
      "flightNumber": "AA123",
      "aircraft": "Boeing 777",
      "origin": "JFK",
      "destination": "LAX",
      "departureTime": "2024-04-05T10:00:00Z",
      "arrivalTime": "2024-04-05T14:00:00Z",
      "status": "SCHEDULED",
      "price": 500,
      "availability": {
        "total": 190,
        "available": 189,
        "reserved": 0,
        "booked": 1,
        "byType": {
          "FIRST_CLASS": { "total": 10, "available": 9, "booked": 1 },
          "BUSINESS_CLASS": { "total": 30, "available": 30, "booked": 0 },
          "ECONOMY_CLASS": { "total": 150, "available": 150, "booked": 0 }
        }
      },
      "nodeId": 1
    }
  ]
}
```

---

### 2. 📋 Obtener vuelo específico

**Endpoint:** `GET /vuelos/:flightId`

**Parámetros URL:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `flightId` | string | ID único del vuelo |

**Ejemplo:**

```bash
curl http://localhost:3001/vuelos/FLIGHT_1775170107651_0.41025575560353
```

**Respuesta (éxito):**

```json
{
  "id": "FLIGHT_1775170107651_0.41025575560353",
  "flightNumber": "AA123",
  "aircraft": "Boeing 777",
  "origin": "JFK",
  "destination": "LAX",
  "departureTime": "2024-04-05T10:00:00Z",
  "arrivalTime": "2024-04-05T14:00:00Z",
  "status": "SCHEDULED",
  "price": 500,
  "availability": {
    "total": 190,
    "available": 189,
    "reserved": 0,
    "booked": 1,
    "byType": { ... }
  },
  "nodeId": 1
}
```

**Respuesta (error - vuelo no encontrado):**

```json
{
  "error": "Vuelo no encontrado",
  "flightId": "FLIGHT_INEXISTENTE"
}
```

**Código HTTP:** 404

---

### 3. 🛫 Obtener vuelos por ruta

**Endpoint:** `GET /vuelos/ruta/:origin/:destination`

**Parámetros URL:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `origin` | string | Código aeropuerto origen |
| `destination` | string | Código aeropuerto destino |

**Ejemplo:**

```bash
curl http://localhost:3001/vuelos/ruta/JFK/LAX
```

**Respuesta:**

```json
{
  "route": "JFK-LAX",
  "count": 3,
  "flights": [
    { "id": "FLIGHT_1", "flightNumber": "AA123", ... },
    { "id": "FLIGHT_2", "flightNumber": "AA456", ... },
    { "id": "FLIGHT_3", "flightNumber": "AA789", ... }
  ]
}
```

---

### 4. ✅ Obtener vuelos disponibles (sin cancelados)

**Endpoint:** `GET /vuelos/disponibles/todos`

**Query Parameters:** Mismo que endpoint #1 (filtros opcionales)

**Ejemplo:**

```bash
curl "http://localhost:3001/vuelos/disponibles/todos?origin=JFK"
```

**Respuesta:**

```json
{
  "count": 2,
  "flights": [
    { "id": "FLIGHT_1", "status": "SCHEDULED", ... },
    { "id": "FLIGHT_2", "status": "BOARDING", ... }
  ]
}
```

---

### 5. ⏰ Obtener vuelos próximos

**Endpoint:** `GET /vuelos/proximos/listar`

**Query Parameters:**

| Parámetro | Tipo | Descripción | Default |
|-----------|------|-------------|---------|
| `days` | number | Días en el futuro a buscar | `7` |
| + otros filtros | - | Igual que endpoint #1 | - |

**Ejemplo:**

```bash
# Próximos 7 días (default)
curl http://localhost:3001/vuelos/proximos/listar

# Próximos 14 días
curl "http://localhost:3001/vuelos/proximos/listar?days=14"

# Próximos 3 días desde JFK a LAX
curl "http://localhost:3001/vuelos/proximos/listar?days=3&origin=JFK&destination=LAX"
```

**Respuesta:**

```json
{
  "days": 7,
  "count": 5,
  "flights": [ ... ]
}
```

---

### 6. 📊 Obtener estadísticas de vuelos

**Endpoint:** `GET /vuelos/estadisticas/resumen`

**Parámetros:** Ninguno

**Ejemplo:**

```bash
curl http://localhost:3001/vuelos/estadisticas/resumen
```

**Respuesta:**

```json
{
  "total": 4,
  "byStatus": {
    "SCHEDULED": 3,
    "BOARDING": 1,
    "DEPARTED": 0,
    "IN_FLIGHT": 0,
    "LANDED": 0,
    "ARRIVED": 0,
    "DELAYED": 0,
    "CANCELLED": 0
  },
  "totalSeatsAvailable": 754,
  "totalSeatsBooked": 3,
  "averageOccupancy": "0.10%"
}
```

---

### 7. 🗺️ Obtener todas las rutas disponibles

**Endpoint:** `GET /vuelos/rutas/lista`

**Parámetros:** Ninguno

**Ejemplo:**

```bash
curl http://localhost:3001/vuelos/rutas/lista
```

**Respuesta:**

```json
{
  "count": 3,
  "routes": [
    {
      "route": "JFK-LAX",
      "origin": "JFK",
      "destination": "LAX",
      "flightCount": 2,
      "seatsAvailable": 378
    },
    {
      "route": "JFK-MIA",
      "origin": "JFK",
      "destination": "MIA",
      "flightCount": 1,
      "seatsAvailable": 190
    },
    {
      "route": "LAX-MIA",
      "origin": "LAX",
      "destination": "MIA",
      "flightCount": 1,
      "seatsAvailable": 190
    }
  ]
}
```

---

## Ejemplos de Casos de Uso

### Caso 1: Cliente busca vuelos JFK → LAX en una fecha específica

```bash
curl "http://localhost:3001/vuelos?origin=JFK&destination=LAX&departureDate=2024-04-05"
```

---

### Caso 2: Sistema busca vuelos SCHEDULED con asientos disponibles en Primera Clase

```bash
curl "http://localhost:3001/vuelos?status=SCHEDULED&seatType=FIRST_CLASS&minAvailable=1"
```

---

### Caso 3: Frontend busca todas las rutas disponibles

```bash
curl http://localhost:3001/vuelos/rutas/lista
```

---

### Caso 4: Dashboard necesita estatus general del sistema

```bash
curl http://localhost:3001/vuelos/estadisticas/resumen
```

---

### Caso 5: Búsqueda de presupuesto (vuelos entre $300 y $800)

```bash
curl "http://localhost:3001/vuelos?minPrice=300&maxPrice=800"
```

---

## Códigos HTTP Esperados

| Código | Significado | Cuándo |
|--------|------------|--------|
| 200 | OK | Búsqueda exitosa (incluso con 0 resultados) |
| 404 | Not Found | Vuelo específico no existe |
| 400 | Bad Request | Parámetros inválidos |
| 500 | Server Error | Error interno del servidor |

---

## Validaciones

✅ Los filtros son case-insensitive para códigos de aeropuerto  
✅ Las fechas soportan formato ISO 8601  
✅ El rango de precio acepta números positivos  
✅ minAvailable acepta números >= 0  
✅ Los estados se validan contra los estados permitidos  
✅ No hay errores si no hay resultados (devuelve array vacío)  
✅ No es necesario proporcionar parámetros (lista todos)  

---

## Combinaciones de Filtros

Los filtros pueden combinarse:

```bash
# Ejemplo complejo
curl "http://localhost:3001/vuelos?\
  origin=JFK&\
  destination=LAX&\
  departureDate=2024-04-05&\
  seatType=FIRST_CLASS&\
  minAvailable=3&\
  status=SCHEDULED&\
  minPrice=400&\
  maxPrice=900"
```

---

## Performance

- Búsqueas sin filtros: O(n)
- Con filtros: O(n × m) donde m = número de filtros
- Datos cacheados en memoria (sin persistencia)
- Respuesta típica: < 50ms

---

## Nota sobre Nodos

Cada nodo tiene su propia base de vuelos:
- Nodo 1 (3001): Vuelos locales del nodo 1
- Nodo 2 (3002): Vuelos locales del nodo 2
- Nodo 3 (3003): Vuelos locales del nodo 3

Para sincronización entre nodos, ver TICKET #3 parte 2.
