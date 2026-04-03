import FlightGraphService from './src/services/FlightGraphService.js';
import DijkstraService from './src/services/DijkstraService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n═══════════════════════════════════════════════════');
console.log('🚀 TICKET #13: Algoritmo de Dijkstra');
console.log('═══════════════════════════════════════════════════\n');

// Cargar datos limpios
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

// Crear grafo y servicio Dijkstra
const graphService = new FlightGraphService();
graphService.loadFlightsData(flightsData);
graphService.buildGraph();

const dijkstraService = new DijkstraService(graphService);

console.log('📊 DEMOSTRACIONES DE DIJKSTRA');
console.log('═══════════════════════════════════════════════════\n');

// Test 1: Ruta simple
console.log('1️⃣ Búsqueda de ruta simple: ATL → LAX');
const test1 = dijkstraService.findCheapestRoute('ATL', 'LAX');
if (test1.success) {
  console.log(`   ✓ Ruta encontrada: ${test1.path.join(' → ')}`);
  console.log(`   Costo total: $${test1.totalCost.toFixed(2)}`);
  console.log(`   Hops: ${test1.hops}`);
} else {
  console.log(`   ✗ Error: ${test1.error}`);
}

// Test 2: Matriz de distancias
console.log('\n2️⃣ Matriz de distancias desde ATL');
const test2 = dijkstraService.generateDistanceMatrix('ATL');
if (test2.success) {
  console.log(`   ✓ Destinos alcanzables: ${test2.destinations}`);
  console.log(`   Top 5 más baratos desde ATL:`);
  test2.matrix.slice(0, 5).forEach((m, idx) => {
    console.log(`     ${idx + 1}. ${m.destination}: $${m.cost.toFixed(2)}`);
  });
} else {
  console.log(`   ✗ Error: ${test2.error}`);
}

// Test 3: Validar existencia de rutas
console.log('\n3️⃣ Validar rutas');
const routes = [
  { origin: 'ATL', destination: 'DFW' },
  { origin: 'PEK', destination: 'SIN' },
  { origin: 'ATL', destination: 'INVALID' }
];

console.log(`   Comprobando ${routes.length} rutas:`);
routes.forEach(({ origin, destination }) => {
  const hasRoute = dijkstraService.hasRoute(origin, destination);
  const status = hasRoute ? '✓' : '✗';
  console.log(`     ${status} ${origin} → ${destination}: ${hasRoute ? 'DISPONIBLE' : 'NO DISPONIBLE'}`);
});

// Test 4: Destinos alcanzables
console.log('\n4️⃣ Destinos alcanzables desde DXB');
const test4 = dijkstraService.getReachableDestinations('DXB');
if (test4.success) {
  console.log(`   ✓ Total destinos: ${test4.count}`);
  const dests = Object.entries(test4.reachable)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 5);
  console.log(`   5 primeros (por costo):`);
  dests.forEach(([dest, cost], idx) => {
    console.log(`     ${idx + 1}. ${dest}: $${cost.toFixed(2)}`);
  });
} else {
  console.log(`   ✗ Error: ${test4.error}`);
}

// Test 5: K rutas más baratas
console.log('\n5️⃣ K rutas más baratas: LON → TYO (k=3)');
const test5 = dijkstraService.findKCheapestRoutes('LON', 'TYO', 3);
if (test5.success) {
  console.log(`   ✓ Se encontraron ${test5.routes.length} ruta(s)`);
  test5.routes.forEach((route, idx) => {
    console.log(`     Ruta ${idx + 1}: ${route.path.join(' → ')}`);
    console.log(`     Costo: $${route.totalCost.toFixed(2)}, Hops: ${route.hops}`);
  });
} else {
  console.log(`   ✗ Error: ${test5.error}`);
}

// Test 6: Manejo de errores
console.log('\n6️⃣ Manejo de errores');
console.log('   a) Origen inválido:');
const test6a = dijkstraService.findCheapestRoute('XXX', 'LAX');
console.log(`      ✓ Código de error: ${test6a.code}`);

console.log('   b) Mismo origen/destino:');
const test6b = dijkstraService.findCheapestRoute('ATL', 'ATL');
console.log(`      ✓ Código de error: ${test6b.code}`);

console.log('   c) Sin ruta disponible:');
// Buscar una ruta que probablemente no exista
const test6c = dijkstraService.findCheapestRoute('ATL', 'UNKNOWN');
if (!test6c.success) {
  console.log(`      ✓ Código de error: ${test6c.code}`);
}

// Estadísticas
console.log('\n📊 Estadísticas del servicio');
const stats = dijkstraService.getStats();
console.log(`   • Nodos: ${stats.totalNodes}`);
console.log(`   • Aristas: ${stats.totalEdges}`);
console.log(`   • Grado promedio: ${stats.avgDegree}`);

console.log('\n═══════════════════════════════════════════════════');
console.log('✅ TICKET #13 - DEMOSTRACIONES COMPLETADAS');
console.log('═══════════════════════════════════════════════════\n');

process.exit(0);
