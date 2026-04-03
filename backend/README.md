# Sistema Distribuido de Reservas - Backend

## Descripción

Backend distribuido que simula 3 servidores independientes de un sistema de reservas. Cada nodo puede funcionar de manera independiente o en coordinación con otros nodos.

## Estructura del Proyecto

```
backend/
├── src/
│   ├── config/
│   │   └── nodeConfig.js          # Configuración de los 3 nodos
│   ├── controllers/
│   │   └── ReservationController.js # Lógica de control de reservas
│   ├── routes/
│   │   ├── reservationRoutes.js    # Rutas de reservas
│   │   └── healthRoutes.js         # Rutas de salud del sistema
│   ├── services/
│   │   └── ReservationService.js   # Lógica de negocio
│   ├── models/
│   │   └── Reservation.js          # Modelo de datos de reserva
│   ├── utils/
│   │   ├── logger.js               # Sistema de logging
│   │   └── communication.js        # Utilidades de comunicación entre nodos
│   ├── data/
│   │   └── mockData.js             # Datos de ejemplo
│   └── index.js                    # Servidor principal
├── .env                            # Variables de entorno
├── .env.example                    # Plantilla de ENV
├── package.json                    # Dependencias del proyecto
└── README.md                       # Este archivo
```

## Nodos Configurados

- **Nodo 1**: Puerto 3001 - `http://localhost:3001`
- **Nodo 2**: Puerto 3002 - `http://localhost:3002`
- **Nodo 3**: Puerto 3003 - `http://localhost:3003`

## Instalación

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   - Los archivos `.env` y `.env.example` ya están configurados
   - Personalizarlos según necesidades

## Uso

### Ejecutar un nodo específico

```bash
# Nodo 1
npm run node1

# Nodo 2
npm run node2

# Nodo 3
npm run node3
```

### Ejecutar todos los nodos a la vez

```bash
npm run all
```

### Modo desarrollo (con hot-reload)

```bash
npm run dev
```

## Endpoints Disponibles

### Health Check
- `GET /health` - Verificar salud del nodo
- `GET /health/stats` - Estadísticas del nodo
- `GET /health/info` - Información del nodo

### Reservas
- `GET /reservations` - Obtener todas las reservas
- `GET /reservations/:id` - Obtener reserva específica
- `POST /reservations` - Crear nueva reserva
- `PUT /reservations/:id` - Actualizar reserva
- `DELETE /reservations/:id` - Eliminar reserva

### Raíz
- `GET /` - Información general del servidor

## Ejemplos de Uso

### Crear una reserva

```bash
curl -X POST http://localhost:3001/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_001",
    "resourceId": "sala_1",
    "startTime": "2024-04-02T10:00:00Z",
    "endTime": "2024-04-02T12:00:00Z"
  }'
```

### Obtener todas las reservas

```bash
curl http://localhost:3001/reservations
```

### Obtener estadísticas de un nodo

```bash
curl http://localhost:3001/health/stats
```

## Características

- ✅ Estructura limpia y modular
- ✅ 3 nodos configurados y listos para usar
- ✅ Sistema de logging integrado
- ✅ Validación de datos
- ✅ Manejo de errores global
- ✅ Comunicación entre nodos
- ✅ Variables de entorno configurables
- ✅ CORS habilitado para peticiones cruzadas
- ✅ **TICKET #7**: Lamport Clocks para ordenamiento de eventos
- ✅ **TICKET #8**: Vector Clocks para detección de causalidad y concurrencia

## Tickets Implementados

### TICKET #7: Lamport Clocks
Sistema de relojes lógicos Lamport para ordenamiento total de eventos distribuidos.
- **Documentación**: [TICKET_7_LAMPORT.md](TICKET_7_LAMPORT.md)
- **Endpoints**: `/sync/clock`, `/sync/ordered-events`, `/sync/causality-matrix`

### TICKET #8: Vector Clocks
Sistema de relojes vectoriales para detección de causalidad y eventos concurrentes.
- **Documentación**: [TICKET_8_VECTOR_CLOCKS.md](TICKET_8_VECTOR_CLOCKS.md)
- **Guía de Uso**: [VECTOR_CLOCK_USAGE.md](VECTOR_CLOCK_USAGE.md)
- **Endpoints**: `/sync/vector-clock`, `/sync/vector-history`, `/sync/concurrent-events`
- **Scripts de Testing**: `test_ticket_8_complete.ps1`, `test_ticket_8.ps1`

## Variables de Entorno

```
NODE_ENV=development          # Ambiente
NODE_ID=1                     # ID del nodo a ejecutar
NODE_1_PORT=3001              # Puerto del nodo 1
NODE_2_PORT=3002              # Puerto del nodo 2
NODE_3_PORT=3003              # Puerto del nodo 3
LOG_LEVEL=info                # Nivel de log (error, warn, info, debug)
```

## Próximos Pasos

- **TICKET #9**: Resolución de conflictos basada en Vector Clocks
- **TICKET #10**: Dashboard de visualización de causalidad
- **TICKET #11**: Optimizaciones de Vector Clock para muchos nodos
- **TICKET #12**: Tests de consistencia eventual con Vector Clocks
- Agregar base de datos persistente
- Implementar algoritmos de consenso distribuido
- Agregar autenticación
- Implementar caché distribuido

## Notas

- Los datos se almacenan en memoria (no persistentes)
- Para pruebas locales, asegurar que los puertos 3001-3003 están disponibles
- Usar `Ctrl+C` para detener los servidores

## Tecnologías Utilizadas

- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **dotenv** - Gestión de variables de entorno
- **axios** - Cliente HTTP
- **cors** - Cross-Origin Resource Sharing
