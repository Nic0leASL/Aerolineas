# ✈️ Aerolíneas Rafael Pabón - Manual Completo de Defensa (Sistemas Distribuidos)

Este manual de arquitectura ha sido redactado de cero para **documentar absolutamente todo el proyecto desde el día 1** hasta su versión final de defensa. Es la guía definitiva sobre cada componente, algoritmo y base de datos utilizada para satisfacer la Práctica 3.

---

## 🏗️ 1. Arquitectura Base y Teorema CAP

El sistema ha sido orquestado bajo un ecosistema robusto de **Nodos Múltiples** y bajo las reglas estrictas del Teorema CAP.

* **Nodos Backend (Node.js):** 3 servidores corriendo en simultáneo simulando zonas geográficas separadas (Europa, Asia, América).
* **Teorema Seleccionado (CP - Consistencia Estricta):** Dado que se maneja dinero real y logística de aviación operativa (donde es gravísimo sobrevender un boleto), escogimos priorizar la **Consistencia Fuerte**. 
* **Topología de Base de Datos Espejada:**
  * **Microsoft SQL Server (Transaccional):** Es la bóveda fortificada. Maneja transacciones atómicas, validaciones en los IDs usando saltos de llave para no chocar y contiene restricciones (Constraint Indexes) de que un boleto no puede ser doble.
  * **MongoDB Atlas (Listado Veloz):** Se usa para que los usuarios finales realicen las consultas masivas de vuelos en la interfaz web a ultra-velocidad sin saturar las llaves de SQL Server.

---

## 🗺️ 2. Grafos, Rutas Computacionales y Matrices

El cerebro de la aplicación se ha alimentado mediante **Estructuras de Grafos y Matrices de Adyacencia** para resolver problemas reales de ruteo:

### Algoritmo de Dijkstra Computarizado
Se integró el Algoritmo de Dijkstra para resolver las búsquedas de escalas de vuelos para cualquier cliente de dos maneras:
1. **Ruta Más Barata (Menor Costo):** El sistema revisa la *Matriz de Precios* (pesos de las aristas en Bolivianos `Bs.`) y busca los saltos entre aeropuertos más económicos hasta el destino.
2. **Ruta Más Rápida (Menor Tiempo):** El sistema revisa la *Matriz de Tiempos* (minutos) y busca las conexiones óptimas (Ej: de ATL a DFW, y DFW a TYO).

### Las Matrices Pre-cargadas
Toda esta red de rutas se computa con base a una red matemática generada a mano al inicio (fiel al proyecto de grafos de la materia), asegurando que haya conexiones predecibles entre Hubs a través del mundo, garantizando que el usuario tenga **"Opciones Recomendadas"** si no existe un vuelo directo.

---

## 🗄️ 3. Inyección Masiva ETL (Miles de Vuelos Reales)

Se superó la expectativa inicial de usar "14 vuelos de ejemplo" construyendo un pipeline masivo de inyección de datos.

Se extrajo la información de tu gigantesco archivo transaccional: `02 - Practica 3 Dataset Flights.csv`.
* **Sincronizados en Mongo Atlas:** Exactamente los miles de vuelos (y luego cortado a los **8,119 de oro** finales) fueron indexados a tu base en la nube.
* **Clonación de Estado SQL Server (`seed.sql`):** Toda esta masiva cantidad de vuelos estructurados fue escrita dinámicamente en el documento `seed.sql` (13 MB). Este archivo es devorado por tu SQL Server a través del `docker-compose.yml` para garantizar que la base de datos relacional y matemática siempre tenga todos los vuelos programados igual que MongoDB.

---

## ⏱️ 4. Sincronización y Tiempo Distribuido

Para prevenir desincronizaciones mortales (el clásico caso de dos viajeros de distintos países dando click de compra en el Asiento 14B a la vez), hemos implementado herramientas matemáticas profundas:

### Relojes Vectoriales (Vector Clocks)
El eje de la Práctica 3. Cuando cualquier nodo intenta modificar un boleto y subirlo, los relojes vectoriales asocian el estado temporal de los 3 nodos (Ej: `[1, 0, 0]`). Si el Nodo Asiático y el Nodo de América intentan confirmar compra al mismo segundo, el Reloj Vectorial levanta y **captura una colisión/Conflicto de Concurrencia de Llave**, bloqueándolo antes de que llegue a la tarjeta de crédito.

### Relojes de Lamport
Para auditar logs en tiempo y priorizar orden lógico entre los servidores para saber *"quién hizo la solicitud primero"* antes de que los relojes vectoriales operen.

---

## 💻 5. Interfaz Visual Gerencial y Experiencia (UX/UI)

El Front-End se armó para imitar sistemas hiper-modernos de compañías reales:

* **Dashboard Gerencial (1 a 1 como la Presentación):** No es simple texto dummy. El panel intercepta *Dinámicamente* los miles de datos de MySQL/Mongo en tiempo real y realiza agregaciones para obtener la Rentabilidad general en Moneda Nacional (**Bs.**). Posee visores gráficos del Delay Inter-Nodal, cantidad de conflictos vectoriales resueltos, gráficos de ubicaciones de compra y porcentaje operativo técnico de la Flota (50 aviones Boeing 777 y Airbus). 
* **Internacionalización Dinámica (i18n):** El sitio ya está disponible en 9 idiomas reales sin hardcoding (Español, Inglés, Japonés, Ruso, Alemán, etc.). Posee heurística automatizada: si alguna palabra se olvidó traducir, automáticamente salta a Español para no "romper/blanquear" el sitio.
* **Apple y Google Wallet:** Los pasajes descargan Tickets Inteligentes visuales en `.pkpass`.

---

## ⚙️ 6. Cómo Levantar Toda la Simulación al Mismo Tiempo

Tu sistema ya fue completamente pulido para encenderse de golpe:

### 1. Inyección Transaccional Automática (SQL Server)
Abre la consola en la carpeta raíz del proyecto y ejecuta Docker. Al tener configurado el `seed.sql`, los SQL van llenarse de los 8,119 vuelos automáticamente al arrancar.
```bash
docker-compose up -d --build
```
*(Da el lujo de esperar más o menos 30 segundos porque Docker tiene que engullir y procesar ese documento de 13 MB de Vuelos puros en segundo plano).*

### 2. Levantando los 3 Nodos Computacionales (Node.js)
```bash
cd backend
npm install
npm run all
```
*(Se activarán simultáneamente y comenzarán sus latidos de comprobación los servidores del 3001, 3002 y 3003 listos para gestionar el CP).*

### 3. Pantalla de Front-End Administrativa y Cliente
En tu consola abre una tercera pestaña:
```bash
cd frontend
npm install
npm run dev
```

En tu PC/Navegador, ábrelo bajo `http://localhost:5173/`. 
Navega a lo largo de las Banderas de Idiomas, dale Click en tus Estadísticas, dale al Panel Gerencial, usa la interfaz y asombra al jurado. 🚀
# Aerolineas