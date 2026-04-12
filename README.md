# ✈️ Aerolíneas Rafael Pabón - Sistema Distribuido de Reservas

Este repositorio contiene la entrega de la **Práctica 3: Sincronización de Procesos Distribuidos** para la materia de Sistemas Distribuidos.

## 🎯 Objetivo General de la Práctica
El objetivo es diseñar e implementar un sistema de reservas aéreas distribuido (simulando a la empresa Aerolíneas Rafael Pabón) que garantice la **consistencia global del estado** utilizando mecanismos de sincronización como:
- **Relojes de Lamport:** Para el ordenamiento temporal de los eventos.
- **Relojes Vectoriales:** Para detectar relaciones de causalidad y posibles concurrencias o conflictos (por ejemplo, evitar operaciones sobre un mismo asiento simultáneamente).

El sistema cumple con todos los requisitos propuestos de la práctica, los cuales incluyen: manejo de concurrencia y replicación (3 nodos simulados), algoritmos clásicos de grafos (Dijkstra para determinar menor coste/tiempo, Algoritmo de Agente Viajero TSP), una experiencia de usuario (UX/UI) completa con un Dashboard Gerencial, registro de consolidación de estados de vuelos, y una novedosa generación e integración de Pasajes Wallet (Apple Pay y Google Pay) junto al tradicional formato PDF.

---

## 📁 Estructura General del Proyecto

El proyecto está diseñado de una manera profundamente modular, aislando la lógica distribuida hacia un servidor "multi-instancia" y utilizando un SPA (Single Page Application) moderno en la capa visual.

### 1. `backend/` (Servidor Node.js - Nodos Distribuidos)
Contiene todo el código responsable de mantener la integridad, persistencia en memoria y la ejecución de la sincronización.
- **Simulación Multi-Nodo:** Alberga la lógica de 3 nodos idénticos (corriendo por defecto en puertos 3001, 3002 y 3003) para simular ubicaciones geográficamente distribuidas.
- **Servicios:** Centraliza la matemática de Lamport/Vector Clocks, replicación, consenso y los algoritmos pesados como Dijkstra.
- **Testing y Tickets de Features:** Verás una multitud de archivos auxiliares o automatizaciones (por ejemplo `test_ticket_8_complete.ps1` o `run_ticket_15.js`) que fueron utilizados en el transcurso del desarrollo para validar paso a paso el cumplimiento sin depender de la UI.

### 2. `frontend/` (Cliente React Webapp - Vite)
Esta carpeta aloja interactividad web. Reúne todo lo relacionado con "visualizar y pedir".
- Carga interfaces hermosas basadas sobre React Hook Form para validaciones y custom hooks.
- **Dashboards:** La vista de reservas y los paneles gerenciales (Asientos vendidos, Ingresos) solicitados por la Práctica.
- **Sistema de Componentes:** Componentes como `DashboardCard` y `TicketDownloadButtons` están alojados dentro de `src/components/`, siendo completamente reutilizables y manteniendo el código legible.

### 3. Archivos y Documentación en Raíz (`*.md`)
Este proyecto es extenso, así que contiene gran cantidad de documentaciones específicas del ciclo de vida de desarrollo.
- **Archivos de Conceptos y Teoría:** (Ej: `LAMPORT_CLOCK_SYNC.md`, `VECTOR_CLOCK_IMPLEMENTATION.md`, `FLIGHT_GRAPH_SYSTEM.md`, `DIJKSTRA_TIME_OPTIMIZATION.md`). En cada uno, puedes ver la descripción funcional y técnica del algoritmo abordado.
- **Integraciones:** (Ej: `WALLET_PASS_API.md`). Explica la mecánica interna para exportar pasajes hacia monederos digitales de teléfonos inteligentes.
- **Resúmenes Finales:** `CAMBIOS_RESUMEN.md` y `QUICKSTART.md` enumeran hitos de optimización que posicionan y "limpian" el proyecto a un nivel final.

---

## 🚀 Pasos para Levantar y Probar el Proyecto

Para hacer que todo cobre vida en tu computadora, debes levantar las dos partes maestras del proyecto: El grupo de Nodos Backends, y finalmente el panel de control Visual (Frontend). Los prerrequisitos básicos son tener **Node.js** instalado.

### Paso 1: Iniciar las Bases de Datos (Docker)

El sistema utiliza Microsoft SQL Server para garantizar una consistencia estricta en las compras (evitando la doble asignación de asientos a nivel transaccional). Para esto, se proporcionan dos contenedores de base de datos definidos en el archivo `docker-compose.yml`.

Es **requisito indispensable** tener Docker Desktop (o similar) instalado y corriendo.

1. Abre tu terminal en la raíz del proyecto:
   ```bash
   cd "c:\Users\danie\Documents\Sistemas Distribuidos\Práctica3\Aerolineas"
   ```
2. Ejecuta el comando para levantar los servicios en segundo plano:
   ```bash
   docker-compose up -d
   ```
> Esto iniciará `sqlserver1` (puerto 1433) y `sqlserver2` (puerto 1434). Las bases de datos se inicializan automáticamente gracias a los archivos `db1-init.sql` y `db2-init.sql`.

---

### Paso 2: Iniciar el Sistema Distribuido (Backend)

1. Abre tu terminal de sistema (`cmd` o `PowerShell`).
2. Dirígete a la ruta del backend:
   ```bash
   cd "c:\Users\danie\Documents\Sistemas Distribuidos\Práctica3\Aerolineas\backend"
   ```
3. Instala las dependencias y bibliotecas de código que tu compañera usó:
   ```bash
   npm install
   ```
4. Levanta los 3 nodos al mismo tiempo utilizando el comando macro de npm:
   ```bash
   npm run all
   ```
   *Nota: Si prefieres levantar cada servidor en una pestaña separada para ver los flujos de log independientemente, puedes abrir 3 consolas distintas y ejecutar `npm run node1`, `npm run node2` y `npm run node3`.*

> Ahora los procesos y Nodos estarán corriendo de fondo en `localhost:3001`, `3002`, y `3003`.

### Paso 3: Iniciar la Aplicación Visual Web (Frontend)

Con la base de datos y el backend funcionando, ahora le daremos vida a la interfaz.

1. Abre una **nueva ventana/pestaña** en tu terminal.
2. Navega al código frontal:
   ```bash
   cd "c:\Users\danie\Documents\Sistemas Distribuidos\Práctica3\Aerolineas\frontend"
   ```
3. Nuevamente, instala las utilidades vitales de interfaz (React, Vite, etc.):
   ```bash
   npm install
   ```
4. Finalmente, arranca el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   
El sistema te generará un link local, convencionalmente `http://localhost:5173/`. 
Ingresa a esa URL en tu Navegador Web. **¡Felicidades!** Ahora puedes usar el software como cualquier cliente, las reservas hechas en la UI dispararán procesos al Backend, el cual aplicará su sistema inteligente de relojes vectoriales para evitar que los vuelos colisionen antes de devolver una respuesta correcta.

*Simplemente déjate llevar por el flujo de reserva y luego prueba los diferentes botones como la excelente función de descargar billetera digital.*