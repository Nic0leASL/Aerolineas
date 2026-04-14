/**
 * Servidor principal distribuido
 * Simula 3 nodos del sistema de reservas
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import Logger from './utils/logger.js';
import { getNodeConfig, getOtherNodes } from './config/nodeConfig.js';
import ReservationService from './services/ReservationService.js';
import ReservationController from './controllers/ReservationController.js';
import { createReservationRoutes } from './routes/reservationRoutes.js';
import { createHealthRoutes } from './routes/healthRoutes.js';
import FlightService from './services/FlightService.js';
import FlightController from './controllers/FlightController.js';
import { createFlightRoutes } from './routes/flightRoutes.js';
import FlightSearchService from './services/FlightSearchService.js';
import FlightSearchController from './controllers/FlightSearchController.js';
import { createFlightSearchRoutes } from './routes/flightSearchRoutes.js';
import SeatReservationController from './controllers/SeatReservationController.js';
import { createSeatReservationRoutes } from './routes/seatReservationRoutes.js';
import SeatPurchaseController from './controllers/SeatPurchaseController.js';
import { createSeatPurchaseRoutes } from './routes/seatPurchaseRoutes.js';
import CancellationController from './controllers/CancellationController.js';
import { createCancellationRoutes } from './routes/cancellationRoutes.js';
import { ConflictController } from './controllers/ConflictController.js';
import { createConflictRoutes } from './routes/conflictRoutes.js';
import { LamportClockService } from './services/LamportClockService.js';
import { VectorClockService } from './services/VectorClockService.js';
import { EventSyncService } from './services/EventSyncService.js';
import { ConflictDetectionService } from './services/ConflictDetectionService.js';
import AuditService from './services/AuditService.js';
import { AuditController } from './controllers/AuditController.js';
import { createAuditRoutes } from './routes/auditRoutes.js';
import { SyncController } from './controllers/SyncController.js';
import { createSyncRoutes } from './routes/syncRoutes.js';
import FlightGraphService from './services/FlightGraphService.js';
import DijkstraService from './services/DijkstraService.js';
import DijkstraController from './controllers/DijkstraController.js';
import dijkstraRoutes from './routes/dijkstraRoutes.js';
import TimeOptimizedService from './services/TimeOptimizedService.js';
import TimeOptimizedController from './controllers/TimeOptimizedController.js';
import timeOptimizedRoutes from './routes/timeOptimizedRoutes.js';
import TSPService from './services/TSPService.js';
import TSPController from './controllers/TSPController.js';
import tspRoutes from './routes/tspRoutes.js';
import OptimalRouteService from './services/OptimalRouteService.js';
import OptimalRouteController from './controllers/OptimalRouteController.js';
import optimalRouteRoutes from './routes/optimalRouteRoutes.js';
import SeatOccupancyService from './services/SeatOccupancyService.js';
import SeatOccupancyController from './controllers/SeatOccupancyController.js';
import seatOccupancyRoutes from './routes/seatOccupancyRoutes.js';
import FlightStatusService from './services/FlightStatusService.js';
import FlightStatusController from './controllers/FlightStatusController.js';
import flightStatusRoutes from './routes/flightStatusRoutes.js';
import WalletPassController from './controllers/WalletPassController.js';
import walletPassRoutes from './routes/walletPassRoutes.js';
import { connectMongo } from './config/mongoDb.js';
import { getConnection, sql } from './config/db.js';
import FlightModel from './models/FlightModel.js';

// Obtener ID del nodo desde variables de entorno
const nodeId = parseInt(process.env.NODE_ID) || 1;
const logger = new Logger(process.env.LOG_LEVEL || 'info');

// Obtener configuración del nodo actual
const currentNodeConfig = getNodeConfig(nodeId);
const otherNodes = getOtherNodes(nodeId);

if (!currentNodeConfig) {
  logger.error(`Nodo ${nodeId} no configurado`);
  process.exit(1);
}

// Crear aplicación Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para logs
app.use((req, res, next) => {
  logger.debug(`[${currentNodeConfig.name}] ${req.method} ${req.path}`);
  next();
});

// Inicializar servicios
const reservationService = new ReservationService(nodeId);
const reservationController = new ReservationController(reservationService);
const flightService = new FlightService(nodeId);
const flightController = new FlightController(flightService);
const flightSearchService = new FlightSearchService(flightService);
const flightSearchController = new FlightSearchController(flightSearchService);
const seatReservationController = new SeatReservationController(flightService, nodeId);
const seatPurchaseController = new SeatPurchaseController(flightService, nodeId);
const cancellationController = new CancellationController(flightService, nodeId);

// Inicializar Lamport Clock, Vector Clock y Event Sync
const lamportClock = new LamportClockService(nodeId);
const vectorClock = new VectorClockService(nodeId, 3); // 3 nodos en total
const eventSyncService = new EventSyncService(nodeId);
eventSyncService.setLamportClock(lamportClock);
eventSyncService.setVectorClock(vectorClock);
eventSyncService.setRemoteNodes(otherNodes.map(n => n.url));
const syncController = new SyncController(lamportClock, eventSyncService, vectorClock);

// Inicializar Conflict Detection Service
const conflictDetectionService = new ConflictDetectionService(vectorClock, lamportClock, nodeId);

// Inicializar Audit Service
const auditService = new AuditService(nodeId);
const auditController = new AuditController(auditService);

// Inicializar Flight Graph y Dijkstra Services
const graphService = new FlightGraphService();
const dijkstraService = new DijkstraService(graphService);
const dijkstraController = new DijkstraController(dijkstraService);

// Inicializar Time Optimized Services
const timeOptimizedService = new TimeOptimizedService(graphService);
const timeOptimizedController = new TimeOptimizedController(timeOptimizedService);

// Inicializar TSP Service
const tspService = new TSPService(graphService);
const tspController = new TSPController(tspService);

// Inicializar Optimal Route Service (Ticket #16)
const optimalRouteService = new OptimalRouteService(dijkstraService, timeOptimizedService, tspService);
const optimalRouteController = new OptimalRouteController(optimalRouteService);

// Inicializar Seat Occupancy Service (Ticket #17)
const seatOccupancyService = new SeatOccupancyService();
const seatOccupancyController = new SeatOccupancyController(seatOccupancyService, flightService);

// Inicializar Flight Status Service (Ticket #18)
const flightStatusService = new FlightStatusService();
const flightStatusController = new FlightStatusController(flightStatusService);

// Inicializar Conexión a MongoDB (Obligatorio para Nodo 3, útil para replicación en Nodos 1 y 2)
connectMongo().catch(err => logger.error('Error inicializando MongoDB:', err));

// Cargar datos iniciales de vuelos
async function loadFlightsIntoGraph() {
  try {
    let flights = [];
    const matricesPath = path.join(process.cwd(), 'src/data/matrices');
    let economyPrices = {};
    let firstClassPrices = {};
    let flightTimes = {};
    
    try {
        economyPrices = JSON.parse(fs.readFileSync(path.join(matricesPath, 'economy_prices.json')));
        firstClassPrices = JSON.parse(fs.readFileSync(path.join(matricesPath, 'first_class_prices.json')));
        flightTimes = JSON.parse(fs.readFileSync(path.join(matricesPath, 'flight_times.json')));
        logger.info('✅ Matrices de precios y tiempos cargadas correctamente');
    } catch(e) {
        logger.warn('⚠ No se encontraron matrices en src/data/matrices, usando valores por defecto');
    }

    if (nodeId === 3) {
      logger.info('🗄 Nodo 3 detectado: Cargando vuelos desde MongoDB Atlas...');
      const docs = await FlightModel.find({}).lean();
      
      flights = docs.map(doc => ({
        FlightId: doc.flightId,
        Origin: doc.origin,
        Destination: doc.destination,
        DepartureTime: doc.flight_date + 'T' + doc.flight_time,
        ArrivalTime: doc.flight_date + 'T' + doc.flight_time,
        Duration: 120,
        EconomyPrice: 850,
        Status: doc.status,
        AircraftId: doc.aircraft_id
      }));

    } else {
      const pool = await getConnection();
      logger.info(`🗄 Nodo ${nodeId} detectado: Cargando vuelos desde SQL Server...`);
      const result = await pool.request().query(`
        SELECT FlightId, Origin, Destination, DepartureTime, ArrivalTime, Duration, EconomyPrice, Status, AircraftId
        FROM Flights
        ORDER BY DepartureTime
      `);
      flights = result.recordset;
    }

    logger.info(`✈ Vuelos recuperados: ${flights.length}`);
    const initializedFlights = [];

    const subset = flights; 

    subset.forEach(f => {
      const flightId = f.FlightId || f.flightId;
      const origin = f.Origin || f.origin;
      const destination = f.Destination || f.destination;

      const economyPrice = f.EconomyPrice || economyPrices[origin]?.[destination] || 850;
      const firstClassPrice = firstClassPrices[origin]?.[destination] || Math.round(economyPrice * 2.5);
      const durationHours = flightTimes[origin]?.[destination];
      const duration = f.Duration || (durationHours ? durationHours * 60 : 120);

      const depTime = f.DepartureTime ? new Date(f.DepartureTime).toISOString() : '2026-04-14T10:00:00';
      const arrTime = f.ArrivalTime ? new Date(f.ArrivalTime).toISOString() : depTime;

      const flight = flightService.createFlight({
        id: flightId,
        flightNumber: flightId.split('_')[0],
        aircraft: `Aeronave ${f.AircraftId || f.aircraft_id || 1}`,
        origin: origin,
        destination: destination,
        departureTime: depTime,
        arrivalTime: arrTime,
        status: f.Status || f.status || 'SCHEDULED',
        price: economyPrice,
        firstClassPrice: firstClassPrice,
        duration: duration
      });

      seatOccupancyService.simularOcupacion(flight);
      initializedFlights.push(flight);
    });

    graphService.loadFlightsData(initializedFlights);
    graphService.buildGraph();
    flightStatusController.setFlightsData(initializedFlights);

    logger.info(`✅ Sistema inicializado con ${initializedFlights.length} vuelos distribuidos.`);
  } catch (error) {
    logger.error('Error cargando vuelos iniciales', { error: error.message });
  }
}

// Ejecutar carga asíncrona
loadFlightsIntoGraph();


// Inyectar Lamport Clock y Vector Clock en controladores
seatReservationController.setLamportClock(lamportClock);
seatReservationController.setEventSyncService(eventSyncService);
seatReservationController.setVectorClock(vectorClock);
seatReservationController.setConflictDetectionService(conflictDetectionService);
seatReservationController.setAuditService(auditService);
seatPurchaseController.setLamportClock(lamportClock);
seatPurchaseController.setEventSyncService(eventSyncService);
seatPurchaseController.setVectorClock(vectorClock);
seatPurchaseController.setConflictDetectionService(conflictDetectionService);
seatPurchaseController.setAuditService(auditService);
cancellationController.setLamportClock(lamportClock);
cancellationController.setEventSyncService(eventSyncService);
cancellationController.setVectorClock(vectorClock);
cancellationController.setAuditService(auditService);

// Inicializar Conflict Controller
const conflictController = new ConflictController(conflictDetectionService);

// Rutas
app.use('/health', createHealthRoutes(nodeId, reservationService));
app.use('/reservations', createReservationRoutes(reservationController));
app.use('/flights', createFlightRoutes(flightController));
app.use('/vuelos', createFlightSearchRoutes(flightSearchController));
app.use('/reservar', createSeatReservationRoutes(seatReservationController));
app.use('/comprar', createSeatPurchaseRoutes(seatPurchaseController));
app.use('/conflictos', createConflictRoutes(conflictController));
app.use('/cancelar', createCancellationRoutes(cancellationController));
app.use('/sync', createSyncRoutes(syncController));
app.use('/audit', createAuditRoutes(auditService));
app.use('/dijkstra', dijkstraRoutes(dijkstraController));
app.use('/time-optimized', timeOptimizedRoutes(timeOptimizedController));
app.use('/tsp', tspRoutes(tspController));
app.use('/rutas', optimalRouteRoutes(optimalRouteController));
app.use('/ocupacion', seatOccupancyRoutes(seatOccupancyController));
app.use('/estado-vuelos', flightStatusRoutes(flightStatusController));
app.use('/wallet-pass', walletPassRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Servidor de Reservas Distribuido',
    nodeId: nodeId,
    nodeName: currentNodeConfig.name,
    port: currentNodeConfig.port,
    otherNodes: otherNodes.map(n => ({
      id: n.id,
      name: n.name,
      url: n.url
    }))
  });
});

// Ruta de error 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.path,
    method: req.method
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  logger.error('Error no manejado', { error: err.message });
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Iniciar servidor
const port = currentNodeConfig.port;
app.listen(port, () => {
  logger.info(`🚀 ${currentNodeConfig.name} iniciado correctamente`);
  logger.info(`Puerto: ${port}`);
  logger.info(`Nodos conectados: ${otherNodes.length}`);
  otherNodes.forEach(node => {
    logger.info(`  - ${node.name}: ${node.url}`);
  });
  logger.info(`Servidor en desarrollo: ${process.env.NODE_ENV === 'development' ? 'Sí' : 'No'}`);
});

// Manejo de señales para cierre ordenado
process.on('SIGINT', () => {
  logger.info(`${currentNodeConfig.name} se está apagando...`);
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info(`${currentNodeConfig.name} se está apagando...`);
  process.exit(0);
});

export default app;
