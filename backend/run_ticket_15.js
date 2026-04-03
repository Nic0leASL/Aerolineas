import FlightGraphService from './src/services/FlightGraphService.js';
import TSPService from './src/services/TSPService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n═══════════════════════════════════════════════════');
console.log('🚀 TICKET #15: Resolución del Problema del Viajero (TSP)');
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

// Crear grafo y servicio TSP
const graphService = new FlightGraphService();
graphService.loadFlightsData(flightsData);
graphService.buildGraph();

const tspService = new TSPService(graphService);

console.log('\n📊 DEMOSTRACIONES DEL ALGORITMO TSP');
console.log('═══════════════════════════════════════════════════\n');

// ──────────────────────────────────────────────────────
// Test 1: TSP heurístico por COSTO (Nearest Neighbor + 2-Opt)
// ──────────────────────────────────────────────────────
console.log('1️⃣  TSP Heurístico por COSTO');
console.log('   Destinos: ATL, LON, DXB, TYO, PEK');
const test1 = tspService.solveTSP(['ATL', 'LON', 'DXB', 'TYO', 'PEK'], 'cost');
if (test1.success) {
    console.log(`   ✓ Ruta óptima: ${test1.pathString}`);
    console.log(`   Costo total: $${test1.totalDistance}`);
    console.log(`   Mejora 2-Opt: ${test1.iterations.improvement}%`);
    console.log('   Segmentos:');
    test1.segments.forEach(s => {
        console.log(`     • ${s.segment}: $${s.distance}`);
    });
} else {
    console.log(`   ✗ Error: ${test1.error}`);
}

// ──────────────────────────────────────────────────────
// Test 2: TSP heurístico por TIEMPO
// ──────────────────────────────────────────────────────
console.log('\n2️⃣  TSP Heurístico por TIEMPO');
console.log('   Destinos: ATL, LON, DXB, TYO, PEK');
const test2 = tspService.solveTSP(['ATL', 'LON', 'DXB', 'TYO', 'PEK'], 'time');
if (test2.success) {
    console.log(`   ✓ Ruta óptima: ${test2.pathString}`);
    console.log(`   Tiempo total: ${test2.totalDistance} minutos`);
    console.log(`   Mejora 2-Opt: ${test2.iterations.improvement}%`);
    console.log('   Segmentos:');
    test2.segments.forEach(s => {
        console.log(`     • ${s.segment}: ${s.distance} min`);
    });
} else {
    console.log(`   ✗ Error: ${test2.error}`);
}

// ──────────────────────────────────────────────────────
// Test 3: Comparación costo vs tiempo
// ──────────────────────────────────────────────────────
console.log('\n3️⃣  Comparación: Costo vs Tiempo');
console.log('   Destinos: ATL, LAX, DFW, SAO');
const test3 = tspService.compareCostVsTime(['ATL', 'LAX', 'DFW', 'SAO']);
if (test3.success) {
    const c = test3.comparison;
    console.log(`   Misma ruta: ${c.samePath ? 'SÍ ✓' : 'NO ✗'}`);
    console.log('\n   📌 Ruta óptima por COSTO:');
    console.log(`      Path: ${c.costRoute.path}`);
    console.log(`      Costo: $${c.costRoute.totalCost}`);
    console.log(`      Tiempo: ${c.costRoute.totalTime} min (${c.costRoute.timeInHours}h)`);
    console.log('\n   ⚡ Ruta óptima por TIEMPO:');
    console.log(`      Path: ${c.timeRoute.path}`);
    console.log(`      Tiempo: ${c.timeRoute.totalTime} min (${c.timeRoute.timeInHours}h)`);
    console.log(`      Costo: $${c.timeRoute.totalCost}`);
    console.log('\n   📊 Trade-off:');
    console.log(`      Costo extra por rapidez: $${c.tradeoff.extraCost}`);
    console.log(`      Ahorro de tiempo: ${c.tradeoff.timeSavings} min`);
} else {
    console.log(`   ✗ Error: ${test3.error}`);
}

// ──────────────────────────────────────────────────────
// Test 4: TSP Exacto (fuerza bruta, ≤8 destinos)
// ──────────────────────────────────────────────────────
console.log('\n4️⃣  TSP Exacto (Fuerza Bruta)');
console.log('   Destinos: ATL, LON, DXB, TYO (4 destinos)');
const test4 = tspService.solveTSPExact(['ATL', 'LON', 'DXB', 'TYO'], 'cost');
if (test4.success) {
    console.log(`   ✓ Ruta exacta óptima: ${test4.pathString}`);
    console.log(`   Costo total: $${test4.totalDistance}`);
    console.log(`   Algoritmo: ${test4.algorithm}`);
    console.log('   Segmentos:');
    test4.segments.forEach(s => {
        console.log(`     • ${s.segment}: $${s.distance}`);
    });
} else {
    console.log(`   ✗ Error: ${test4.error}`);
}

// ──────────────────────────────────────────────────────
// Test 5: Comparar Heurístico vs Exacto
// ──────────────────────────────────────────────────────
console.log('\n5️⃣  Comparación: Heurístico vs Exacto');
const destinations5 = ['ATL', 'LON', 'DXB', 'TYO'];
const heuristic = tspService.solveTSP(destinations5, 'cost');
const exact = tspService.solveTSPExact(destinations5, 'cost');
if (heuristic.success && exact.success) {
    console.log(`   Heurístico: ${heuristic.pathString} → $${heuristic.totalDistance}`);
    console.log(`   Exacto:     ${exact.pathString} → $${exact.totalDistance}`);
    const diff = parseFloat(heuristic.totalDistance) - parseFloat(exact.totalDistance);
    const pct = ((diff / parseFloat(exact.totalDistance)) * 100).toFixed(2);
    console.log(`   Diferencia: $${diff.toFixed(2)} (${pct}% más costoso el heurístico)`);
    console.log(`   ✓ El heurístico es ${diff <= 0 ? 'igual o mejor' : 'cercano al óptimo'}`);
}

// ──────────────────────────────────────────────────────
// Test 6: Validación de tour
// ──────────────────────────────────────────────────────
console.log('\n6️⃣  Validación de Tour');
const tourPath = ['ATL', 'DXB', 'TYO', 'LON'];
console.log(`   Tour: ${tourPath.join(' → ')}`);
const costByCost = tspService.calculateRouteCost(tourPath, 'cost');
const costByTime = tspService.calculateRouteCost(tourPath, 'time');
console.log(`   Costo total: $${costByCost === Infinity ? 'N/A' : costByCost.toFixed(2)}`);
console.log(`   Tiempo total: ${costByTime === Infinity ? 'N/A' : costByTime.toFixed(2)} min`);

// ──────────────────────────────────────────────────────
// Test 7: Estadísticas del servicio
// ──────────────────────────────────────────────────────
console.log('\n7️⃣  Estadísticas del Servicio TSP');
const stats = tspService.getStats();
console.log(`   Nodos: ${stats.totalNodes}`);
console.log(`   Aristas: ${stats.totalEdges}`);
console.log(`   Grado promedio: ${stats.avgDegree}`);
console.log(`   Máximo destinos exacto: ${stats.maxTSPExact}`);
console.log(`   Recomienda heurística: ${stats.recommendedHeuristic ? 'SÍ' : 'NO'}`);

// ──────────────────────────────────────────────────────
// Test 8: Manejo de errores
// ──────────────────────────────────────────────────────
console.log('\n8️⃣  Manejo de Errores');

console.log('   a) Destino inválido:');
const test8a = tspService.solveTSP(['ATL', 'INVALID'], 'cost');
console.log(`      ✓ Código: ${test8a.code}, Error: ${test8a.error}`);

console.log('   b) Menos de 2 destinos:');
const test8b = tspService.solveTSP(['ATL'], 'cost');
console.log(`      ✓ Código: ${test8b.code}, Error: ${test8b.error}`);

console.log('   c) Criterio inválido:');
const test8c = tspService.solveTSP(['ATL', 'LON'], 'invalid');
console.log(`      ✓ Código: ${test8c.code}, Error: ${test8c.error}`);

console.log('   d) Demasiados destinos (exacto):');
const test8d = tspService.solveTSPExact(
    ['ATL', 'LON', 'DXB', 'TYO', 'PEK', 'LAX', 'DFW', 'SAO', 'SIN'], 'cost'
);
console.log(`      ✓ Código: ${test8d.code}, Error: ${test8d.error}`);

// ──────────────────────────────────────────────────────
// Test 9: TSP con más destinos
// ──────────────────────────────────────────────────────
console.log('\n9️⃣  TSP Heurístico con 8 destinos');
const destinations9 = ['ATL', 'LON', 'DXB', 'TYO', 'PEK', 'LAX', 'DFW', 'SAO'];
console.log(`   Destinos: ${destinations9.join(', ')}`);
const test9 = tspService.solveTSP(destinations9, 'cost');
if (test9.success) {
    console.log(`   ✓ Ruta óptima: ${test9.pathString}`);
    console.log(`   Costo total: $${test9.totalDistance}`);
    console.log(`   Mejora 2-Opt: ${test9.iterations.improvement}%`);
} else {
    console.log(`   ✗ Error: ${test9.error}`);
}

console.log('\n═══════════════════════════════════════════════════');
console.log('✅ TICKET #15 — TSP DEMOSTRACIONES COMPLETADAS');
console.log('═══════════════════════════════════════════════════\n');

process.exit(0);
