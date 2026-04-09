# Sistema Distribuido de Aerolíneas - Backend

## Descripción General

Este proyecto consiste en un ecosistema backend distribuido de alta exigencia, diseñado para manejar reservas de vuelos aéreos de "Aerolíneas Rafael Pabón". En su iteración actual, la plataforma simula nodos independientes coordinados para transitar un flujo estricto de venta de boletos.

El aspecto central y diferenciador del proyecto es el uso del **Teorema CAP orientado a CP** (Consistencia Absoluta ante Particiones). El sistema detiene totalmente la venta de pasajes frente a caídas de red o desincronizaciones de estado para evitar, bajo cualquier circunstancia, instancias de *Double Booking* (Venta de boletos duplicados en asientos idénticos).

## Arquitectura de Datos y "Espejos Vivos"

En lugar de almacenar datos en configuraciones de memoria (Mocks) que carecen de solidez transaccional, el proyecto aprovecha una arquitectura híbrida:

### 1. Sistema Transaccional: Microsoft SQL Server (Docker)
- Se cuenta con **2 Servidores de SQL (Espejos Vivos)** corriendo en Docker que simulan un escenario multi-master.
- **Salto de Llave de Identidad**: Para evitar colisiones en tablas R/W, el Espejo 1 tiene un `IDENTITY(1,2)` (claves impares) y el Espejo 2 tiene `IDENTITY(2,2)` (claves pares).
- Si la conexión SQL falla, el servicio aborta, asegurándose de evitar reservas concurrentes sucias (Nivel de Aislamiento `SERIALIZABLE` con bloqueos `UPDLOCK`).

### 2. Catálogo Distribuido e Histórico: MongoDB (Atlas)
- Toda la base de datos de vuelos listados, metadatos espaciales y flujos de rutas se alberga asíncronamente en instancias de base de datos no relacionales de Atlas en la Nube. La lectura de operaciones de vuelo está blindada contra la saturación transaccional.

## Reglas de Negocio Estrictas

1. **Vuelos Inmutables**: Siguiendo las directrices corporativas, los vuelos generados en la base de datos **nunca pueden retrasarse ni cancelarse**. Los estados pasaron a ser exclusivamente `SCHEDULED`, `BOARDING`, `DEPARTED`, `IN_FLIGHT`, `LANDED`, y `ARRIVED`.
2. **CP sobre AP**: Ante pérdida de paquetes entre los nodos distribuidos, el sistema sacrifica total disponibilidad en pos de asegurar la tabla transaccional compartida entre MSSQL 1 y MSSQL 2.

---

## Instrucciones de Despliegue (Cómo levantar este Ecosistema)

Para poder ejecutar la plataforma de extremo a extremo, es necesario prender ambos ecosistemas (DB y Backend).

### Paso 1: Configurar Variables de Entorno (`.env`)
Asegúrate de copiar el archivo `backend/.env.example` en `backend/.env`.
Asegúrate de tener un cluster de MongoDB listo o el servicio local.
Asegúrate de que estás inyectando tu propia IP autenticada de Cloud (`MONGO_URI`).

### Paso 2: Iniciar Clústeres Transaccionales MSSQL
Necesitas Docker abierto en tu máquina. Ve a la carpeta raíz del proyecto y enciende los "Espejos Vivos":
```bash
docker-compose up -d
```
*(Esto instalará los motores de Base de Datos y correrá los scripts iniciales que configuran el Salto de Identidad).*

### Paso 3: Instalar Dependencias NodeJS
Ve nuevamente a la carpeta `backend/` y descarga todos los submódulos, transaccionales (`mssql`) y de nube (`mongoose`):
```bash
npm install
```

### Paso 4: Migración y Sembrado (The Seeder)
Si hiciste cambios a los Archivos `.csv` de vuelos, o quieres limpiar la plataforma para ponerla lista a la acción, contamos con un comando que borra, trunca ambas bases y resube todo de vuelta con un *InsertMasivo*:
```bash
npm run seed:data
```

### Paso 5: Encender los Microservicios/Nodos
Puedes encender nodos por separado para emular el flujo distribuido.
```bash
# Nodo 1
npm run node1

# Nodo 2
npm run node2

# Nodo 3
npm run node3
```
O encender el clúster entero de Node:
```bash
npm run all
```

---

## Herramientas Previas
El sistema conserva por debajo sus lógicas de comunicación asincrónica originarias:
- **Relojes de Lamport**: Ordenamiento absoluto frente a la deriva de tiempo.
- **Relojes Vectoriales**: Matrices para ubicar cruces e hitos temporales entre nodos.
- **Detección de Conflictos**: Los microservicios detectarán un choque, e interrogarán a la capa de SQL para validación.

## Stack
- **JavaScript (ES Modules)** -> Runtime Node
- **Microsoft SQL Server 2022** -> Docker Compose (Transacciones CP)
- **MongoDB** -> Nube (Atlas / Mongoose ORM)
- **ReactJS** -> Frontend UI Dashboard con Visión Corporativa
