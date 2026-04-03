# Arquitectura del Sistema Distribuido

## Descripción General

Este sistema implementa una arquitectura distribuida con 3 nodos independientes para un sistema de reservas. Cada nodo puede funcionar autónomamente y está preparado para comunicarse con otros nodos.

## Componentes Principales

### 1. Configuración de Nodos (`src/config/nodeConfig.js`)

Define la configuración de los 3 nodos del sistema:

```plaintext
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nodo 1        │    │   Nodo 2        │    │   Nodo 3        │
│  Puerto 3001    │    │  Puerto 3002    │    │  Puerto 3003    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

Cada nodo tiene:
- ID único
- Puerto dedicado
- URL para comunicación
- Nombre descriptivo

### 2. Capas de la Aplicación

```
┌─────────────────────────────────────────────────────────┐
│                    ROUTES (Express)                     │
│  /reservations, /health, /                              │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                   CONTROLLERS                            │
│  ReservationController - Maneja peticiones HTTP         │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                    SERVICES                              │
│  ReservationService - Lógica de negocio                 │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                     MODELS                               │
│  Reservation - Estructura de datos                      │
└─────────────────────────────────────────────────────────┘
```

### 3. Servicios de Utilidad

#### Logger (`src/utils/logger.js`)
- Registro de eventos con timestamp
- Niveles de log (error, warn, info, debug)
- Formato consistente de mensajes

#### Communication (`src/utils/communication.js`)
- Comunicación HTTP entre nodos
- Verificación de disponibilidad de nodos
- Manejo de timeouts y errores

## Flujo de Datos

### Crear una Reserva

```
Cliente HTTP
    ↓
POST /reservations
    ↓
ReservationController.create()
    ↓
ReservationService.createReservation()
    ↓
Almacenar en memoria (Nodo)
    ↓
Retornar confirmación
    ↓
Cliente recibe ID y datos
```

## Configuración de Variables de Entorno

```plaintext
NODE_ENV         → Ambiente (development/production)
NODE_ID          → ID del nodo actual (1, 2 o 3)
NODE_*_PORT      → Puerto de cada nodo
NODE_*_URL       → URL base de cada nodo
LOG_LEVEL        → Nivel de detalle de logs
```

## Patrones Usados

### 1. Architecture Pattern: Layered Architecture
- Separación clara de responsabilidades
- Cada capa independiente y testeable
- Fácil de extender y mantener

### 2. Design Pattern: Singleton
- Logger como instancia única
- ReservationService como servicio compartido

### 3. Design Pattern: Factory
- Rutas creadas dinámicamente con funciones factory
- Facilita la inyección de dependencias

## Escalabilidad Futura

El diseño actual permite:

1. **Base de Datos**: Reemplazar almacenamiento en memoria
2. **Persistencia**: Agregar transacciones con BD
3. **Sincronización**: Implementar algoritmos de consenso
4. **Caché**: Agregar Redis o similar
5. **Autenticación**: Añadir JWT o OAuth
6. **API Gateway**: Agregar balanceador de carga

## Seguridad

Preparado para:
- CORS configurado
- Validación de entrada
- Manejo centralizado de errores
- Logging de eventos sensibles
- Variables sensibles en .env

## Monitoreo y Debugging

### Health Checks
Cada nodo expone:
- `/health` - Estado general
- `/health/stats` - Estadísticas de reservas
- `/health/info` - Información del nodo

### Logging
Todos los eventos importantes se registran con:
- Timestamp ISO 8601
- Nivel de severidad
- Contexto del evento
- Datos relevantes

## Comunicación Inter-nodos

Utilities preparados para:
- Peticiones HTTP entre nodos
- Verificación de disponibilidad
- Reintentos y timeouts
- Manejo de fallos

Ejemplo:
```javascript
const response = await sendNodeRequest(
  'http://localhost:3001',
  '/reservations',
  'GET'
);
```

## Deploabilidad

El sistema está diseñado para:
- Ejecutar múltiples instancias locales
- Preparado para containerización (Docker)
- Configuración mediante ENV
- Scripts de inicio automático

## Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                      Cliente HTTP                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼──┐          ┌────▼──┐          ┌────▼──┐
   │Nodo 1 │          │Nodo 2 │          │Nodo 3 │
   │:3001  │          │:3002  │          │:3003  │
   └────┬──┘          └────┬──┘          └────┬──┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                    ┌──────┴───────┐
                    │ Comunicación │
                    │  HTTP/REST   │
                    └──────────────┘
```

## Próximas Fases

### Fase 2: Sincronización
- Estado compartido entre nodos
- Replicación de datos
- Consistencia distribuida

### Fase 3: Persistencia
- Integración con Base de Datos
- Transacciones distribuidas
- Recuperación ante fallos

### Fase 4: Kubernetes/Orchestración
- Despliegue en contenedores
- Auto-escalado
- Service discovery
