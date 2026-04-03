import FlightGraphService from './src/services/FlightGraphService.js';
import TimeOptimizedService from './src/services/TimeOptimizedService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n═══════════════════════════════════════════════════');
console.log('🚀 TICKET #14: Algoritmo de Dijkstra por Tiempo');
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

// Crear grafo y servicio por tiempo
const graphService = new FlightGraphService();
graphService.loadFlightsData(flightsData);
graphService.buildGraph();

const timeOptimizedService = new TimeOptimizedService(graphService);

console.log('📊 DEMOSTRACIONES DE DIJKSTRA - OPTIMIZADO POR TIEMPO');
console.log('═══════════════════════════════════════════════════\n');

// Test 1: Ruta más rápida
console.log('1️⃣ Búsqueda de ruta más rápida: ATL → LAX');
const test1 = timeOptimizedService.findFastestRoute('ATL', 'LAX');
if (test1.success) {
  console.log(`   ✓ Ruta encontrada: ${test1.path.join(' → ')}`);
  console.log(`   Tiempo total: ${test1.totalTime.toFixed(2)} minutos (${test1.timeInHours} horas)`);
  console.log(`   ${test1.timeInDaysHours}`);
  console.log(`   Hops: ${test1.hops}`);
} else {
  console.log(`   ✗ Error: ${test1.error}`);
}

// Test 2: Matriz de tiempos
console.log('\n2️⃣ Matriz de tiempos desde ATL');
const test2 = timeOptimizedService.generateTimeMatrix('ATL');
if (test2.success) {
  console.log(`   ✓ Destinos alcanzables: ${test2.destinations}`);
  console.log(`   Top 5 destinos más rápidos desde ATL:`);
  test2.matrix.slice(0, 5).forEach((m, idx) => {
    console.log(`     ${idx + 1}. ${m.destination}: ${m.time.toFixed(2)} min (${m.timeInHours} h)`);
  });
} else {
  console.log(`   ✗ Error: ${test2.error}`);
}

// Test 3: Validar consistencia de rutas
console.log('\n3️⃣ Validar rutas');
const routes = [
  { origin: 'ATL', destination: 'DFW' },
  { origin: 'PEK', destination: 'SIN' },
  { origin: 'ATL', destination: 'INVALID' }
];

console.log(`   Comprobando ${routes.length} rutas:`);
routes.forEach(({ origin, destination }) => {
  const hasRoute = timeOptimizedService.hasRoute(origin, destination);
  const status = hasRoute ? '✓' : '✗';
  console.log(`     ${status} ${origin} → ${destination}: ${hasRoute ? 'DISPONIBLE' : 'NO DISPONIBLE'}`);
});

// Test 4: Destinos alcanzables
console.log('\n4️⃣ Destinos alcanzables desde DXB');
const test4 = timeOptimizedService.getReachableDestinations('DXB');
if (test4.success) {
  console.log(`   ✓ Total destinos: ${test4.count}`);
  const dests = Object.entries(test4.reachable)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 5);
  console.log(`   5 primeros (por tiempo):`);
  dests.forEach(([dest, time], idx) => {
    console.log(`     ${idx + 1}. ${dest}: ${time.toFixed(2)} min`);
  });
} else {
  console.log(`   ✗ Error: ${test4.error}`);
}

// Test 5: Comparación costo vs tiempo
console.log('\n5️⃣ Comparación: Ruta más barata vs Ruta más rápida');
console.log('   Ruta: ATL → SIN');
const test5 = timeOptimizedService.compareCostVsTime('ATL', 'SIN');
if (test5.success) {
  console.log(`\n   📌 Ruta MÁS BARATA:`);
  console.log(`      Path: ${test5.comparison.costRoute.path}`);
  console.log(`      Costo: $${test5.comparison.costRoute.totalCost}`);
  console.log(`      Tiempo: ${test5.comparison.costRoute.totalTime} min (${test5.comparison.costRoute.timeInHours}h)`);
  console.log(`      Hops: ${test5.comparison.costRoute.hops}`);

  console.log(`\n   ⚡ Ruta MÁS RÁPIDA:`);
  console.log(`      Path: ${test5.comparison.timeRoute.path}`);
  console.log(`      Tiempo: ${test5.comparison.timeRoute.totalTime} min (${test5.comparison.timeRoute.timeInHours}h)`);
  console.log(`      Costo: $${test5.comparison.timeRoute.totalCost}`);
  console.log(`      Hops: ${test5.comparison.timeRoute.hops}`);

  console.log(`\n   📊 DIFERENCIAS:`);
  console.log(`      Misma ruta: ${test5.comparison.samePath ? 'SÍ ✓' : 'NO ✗'}`);
  console.log(`      Ahorro de tiempo: ${test5.comparison.savings.timeSavings} minutos`);
  console.log(`      Sobrecosto por speed: $${test5.comparison.savings.costOverhead}`);
} else {
  console.log(`   ✗ Error: ${test5.error}`);
}

// Test 6: K rutas más rápidas
console.log('\n6️⃣ K rutas más rápidas: LON → TYO (k=1)');
const test6 = timeOptimizedService.findKFastestRoutes('LON', 'TYO', 1);
if (test6.success) {
  console.log(`   ✓ Se encontraron ${test6.routes.length} ruta(s)`);
  test6.routes.forEach((route, idx) => {
    console.log(`     Ruta ${idx + 1}: ${route.path.join(' → ')}`);
    console.log(`     Tiempo: ${route.totalTime} min (${route.timeInHours} horas), Hops: ${route.hops}`);
  });
} else {
  console.log(`   ✗ Error: ${test6.error}`);
}

// Test 7: Manejo de errores
console.log('\n7️⃣ Manejo de errores');
console.log('   a) Origen inválido:');
const test7a = timeOptimizedService.findFastestRoute('XXX', 'LAX');
console.log(`      ✓ Código de error: ${test7a.code}`);

console.log('   b) Mismo origen/destino:');
const test7b = timeOptimizedService.findFastestRoute('ATL', 'ATL');
console.log(`      ✓ Código de error: ${test7b.code}`);

console.log('   c) Destino inválido:');
const test7c = timeOptimizedService.findFastestRoute('ATL', 'UNKNOWN');
if (!test7c.success) {
  console.log(`      ✓ Código de error: ${test7c.code}`);
}

// Estadísticas
console.log('\n📊 Estadísticas del servicio');
const stats = timeOptimizedService.getStats();
console.log(`   • Nodos: ${stats.totalNodes}`);
console.log(`   • Aristas: ${stats.totalEdges}`);
console.log(`   • Grado promedio: ${stats.avgDegree}`);

// Test 8: Intercomparación: Ruta ATL→LAX vs ATL→DFW
console.log('\n8️⃣ Análisis comparativo: ATL → LAX vs ATL → DFW');
const fastest_lax = timeOptimizedService.findFastestRoute('ATL', 'LAX');
const fastest_dfw = timeOptimizedService.findFastestRoute('ATL', 'DFW');

if (fastest_lax.success && fastest_dfw.success) {
  console.log(`   ATL → LAX: ${fastest_lax.totalTime.toFixed(2)} min`);
  console.log(`   ATL → DFW: ${fastest_dfw.totalTime.toFixed(2)} min`);
  console.log(`   Diferencia: ${(fastest_lax.totalTime - fastest_dfw.totalTime).toFixed(2)} min`);
  const faster = fastest_dfw.totalTime < fastest_lax.totalTime ? 'DFW' : 'LAX';
  console.log(`   ⚡ ${faster} es más rápido`);
}

console.log('\n═══════════════════════════════════════════════════');
console.log('✅ TICKET #14 - DEMOSTRACIONES COMPLETADAS');
console.log('═══════════════════════════════════════════════════\n');

process.exit(0);
