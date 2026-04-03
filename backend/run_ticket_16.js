import FlightGraphService from './src/services/FlightGraphService.js';
import DijkstraService from './src/services/DijkstraService.js';
import TimeOptimizedService from './src/services/TimeOptimizedService.js';
import TSPService from './src/services/TSPService.js';
import OptimalRouteService from './src/services/OptimalRouteService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n═══════════════════════════════════════════════════');
console.log('🚀 TICKET #16: Servicio de Rutas Óptimas');
console.log('═══════════════════════════════════════════════════\n');

// Cargar datos
const cleanedFilePath = path.join(__dirname, './flights_cleaned.json');
let flightsData = [];

try {
    const fileContent = fs.readFileSync(cleanedFilePath, 'utf-8');
    const parsed = JSON.parse(fileContent);
    flightsData = parsed.data;
    console.log(`✓ Cargados ${flightsData.length} vuelos\n`);
} catch (error) {
    console.error(`✗ Error cargando datos: ${error.message}`);
    process.exit(1);
}

// Inicializar servicios
const graphService = new FlightGraphService();
graphService.loadFlightsData(flightsData);
graphService.buildGraph();

const dijkstraService = new DijkstraService(graphService);
const timeOptimizedService = new TimeOptimizedService(graphService);
const tspService = new TSPService(graphService);
const optimalRouteService = new OptimalRouteService(dijkstraService, timeOptimizedService, tspService);

console.log('\n📊 DEMOSTRACIONES DEL SERVICIO DE RUTAS ÓPTIMAS');
console.log('═══════════════════════════════════════════════════\n');

// Test 1: rutaMasBarata
console.log('1️⃣  rutaMasBarata("ATL", "TYO")');
const t1 = optimalRouteService.rutaMasBarata('ATL', 'TYO');
if (t1.success) {
    console.log(`   ✓ Ruta: ${t1.rutaTexto}`);
    console.log(`   Costo: $${t1.costoTotal}, Saltos: ${t1.saltos}`);
} else {
    console.log(`   ✗ ${t1.error}`);
}

// Test 2: rutaMasRapida
console.log('\n2️⃣  rutaMasRapida("ATL", "TYO")');
const t2 = optimalRouteService.rutaMasRapida('ATL', 'TYO');
if (t2.success) {
    console.log(`   ✓ Ruta: ${t2.rutaTexto}`);
    console.log(`   Tiempo: ${t2.tiempoTotal} min (${t2.tiempoHoras}h), Saltos: ${t2.saltos}`);
} else {
    console.log(`   ✗ ${t2.error}`);
}

// Test 3: rutaTSP por costo
console.log('\n3️⃣  rutaTSP(["ATL", "LON", "DXB", "TYO"], "cost")');
const t3 = optimalRouteService.rutaTSP(['ATL', 'LON', 'DXB', 'TYO'], 'cost');
if (t3.success) {
    console.log(`   ✓ Ruta: ${t3.rutaTexto}`);
    console.log(`   Distancia: ${t3.distanciaTotal}, Mejora 2-Opt: ${t3.mejora2Opt}`);
    if (t3.resultadoExacto) {
        console.log(`   Exacto: ${t3.resultadoExacto.rutaTexto} (${t3.resultadoExacto.distanciaTotal})`);
    }
} else {
    console.log(`   ✗ ${t3.error}`);
}

// Test 4: rutaTSP por tiempo
console.log('\n4️⃣  rutaTSP(["ATL", "LON", "DXB", "TYO"], "time")');
const t4 = optimalRouteService.rutaTSP(['ATL', 'LON', 'DXB', 'TYO'], 'time');
if (t4.success) {
    console.log(`   ✓ Ruta: ${t4.rutaTexto}`);
    console.log(`   Distancia: ${t4.distanciaTotal} min`);
} else {
    console.log(`   ✗ ${t4.error}`);
}

// Test 5: compararCostoVsTiempo
console.log('\n5️⃣  compararCostoVsTiempo("ATL", "SIN")');
const t5 = optimalRouteService.compararCostoVsTiempo('ATL', 'SIN');
if (t5.success) {
    console.log(`   Misma ruta: ${t5.mismaRuta ? 'SÍ' : 'NO'}`);
    console.log(`   Más barata: ${t5.rutaMasBarata.ruta} → $${t5.rutaMasBarata.costo}`);
    console.log(`   Más rápida: ${t5.rutaMasRapida.ruta} → ${t5.rutaMasRapida.tiempo} min`);
} else {
    console.log(`   ✗ ${t5.error || 'Error en comparación'}`);
}

// Test 6: estadísticas
console.log('\n6️⃣  getEstadisticas()');
const t6 = optimalRouteService.getEstadisticas();
console.log(`   Nodos: ${t6.grafo.nodos}, Aristas: ${t6.grafo.aristas}`);
console.log(`   Algoritmos: ${t6.algoritmosDisponibles.length}`);
t6.algoritmosDisponibles.forEach(a => console.log(`     • ${a.nombre}: ${a.funcion}`));

// Test 7: errores
console.log('\n7️⃣  Manejo de errores');
const t7a = optimalRouteService.rutaMasBarata('XXX', 'TYO');
console.log(`   a) Origen inválido: ${t7a.codigo} — ${t7a.error}`);
const t7b = optimalRouteService.rutaMasRapida('ATL', 'ATL');
console.log(`   b) Mismo aeropuerto: ${t7b.codigo} — ${t7b.error}`);

console.log('\n═══════════════════════════════════════════════════');
console.log('✅ TICKET #16 — DEMOSTRACIONES COMPLETADAS');
console.log('═══════════════════════════════════════════════════\n');

process.exit(0);
