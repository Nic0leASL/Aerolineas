import FlightStatusService from './src/services/FlightStatusService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n═══════════════════════════════════════════════════');
console.log('🚀 TICKET #18: Actualización Automática de Estados');
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

const flightStatusService = new FlightStatusService();

// Test 1: Validar consistencia ANTES de actualizar
console.log('1️⃣  Validar consistencia (antes de actualizar)');
const result1 = flightStatusService.validarConsistencia(flightsData);
if (result1.success) {
    console.log(`   Total vuelos: ${result1.totalVuelos}`);
    console.log(`   Inconsistencias: ${result1.inconsistenciasEncontradas}`);
    console.log(`   Consistente: ${result1.consistente ? 'SÍ ✓' : 'NO ✗'}`);
    if (result1.inconsistencias.length > 0) {
        console.log(`   Primeras 5 inconsistencias:`);
        result1.inconsistencias.slice(0, 5).forEach((inc, i) => {
            console.log(`     ${i + 1}. ${inc.flightId}: ${inc.problema}`);
        });
    }
}

// Test 2: Actualizar estados
console.log('\n2️⃣  Actualizar estados de vuelos');
const result2 = flightStatusService.actualizarEstados(flightsData);
if (result2.success) {
    console.log(`   Total: ${result2.resumen.total}`);
    console.log(`   Futuros: ${result2.resumen.futuros}`);
    console.log(`   Pasados: ${result2.resumen.pasados}`);
    console.log(`   Actualizados: ${result2.resumen.actualizados}`);
    console.log(`   Ya correctos: ${result2.resumen.yaCorrectos}`);
    if (result2.cambiosRealizados.length > 0) {
        console.log(`   Cambios realizados (primeros 5):`);
        result2.cambiosRealizados.slice(0, 5).forEach((c, i) => {
            console.log(`     ${i + 1}. ${c.flightId}: ${c.estadoAnterior} → ${c.estadoNuevo} (${c.razon})`);
        });
    }
}

// Test 3: Validar consistencia DESPUÉS de actualizar
console.log('\n3️⃣  Validar consistencia (después de actualizar)');
const result3 = flightStatusService.validarConsistencia(flightsData);
if (result3.success) {
    console.log(`   Inconsistencias: ${result3.inconsistenciasEncontradas}`);
    console.log(`   Consistente: ${result3.consistente ? 'SÍ ✓' : 'NO ✗'}`);
}

// Test 4: Validar rutas de aviones
console.log('\n4️⃣  Validar rutas de aviones (conflictos)');
const result4 = flightStatusService.validarRutasAvion(flightsData);
if (result4.success) {
    console.log(`   Total aviones: ${result4.totalAviones}`);
    console.log(`   Conflictos: ${result4.conflictosDetectados}`);
    if (result4.conflictos.length > 0) {
        console.log(`   Primeros 5:`);
        result4.conflictos.slice(0, 5).forEach((c, i) => {
            console.log(`     ${i + 1}. Avión ${c.aircraftId}: ${c.vuelo1.ruta} → ${c.vuelo2.ruta} (${c.diferenciaMinutos}min)`);
        });
    }
}

// Test 5: Obtener log
console.log('\n5️⃣  Log de actualizaciones');
const result5 = flightStatusService.getLog();
console.log(`   Entradas en log: ${result5.totalEntradas}`);

// Test 6: Distribución de estados
console.log('\n6️⃣  Distribución actual de estados');
const statusCounts = {};
for (const flight of flightsData) {
    statusCounts[flight.status] = (statusCounts[flight.status] || 0) + 1;
}
for (const [status, count] of Object.entries(statusCounts).sort((a, b) => b[1] - a[1])) {
    const pct = (count / flightsData.length * 100).toFixed(1);
    console.log(`   ${status}: ${count} (${pct}%)`);
}

console.log('\n═══════════════════════════════════════════════════');
console.log('✅ TICKET #18 — DEMOSTRACIONES COMPLETADAS');
console.log('═══════════════════════════════════════════════════\n');

process.exit(0);
