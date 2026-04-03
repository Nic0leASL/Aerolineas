import SeatOccupancyService from './src/services/SeatOccupancyService.js';
import { Flight } from './src/models/Flight.js';

console.log('\n═══════════════════════════════════════════════════');
console.log('🚀 TICKET #17: Simulación Inicial de Ocupación');
console.log('═══════════════════════════════════════════════════\n');

const seatOccupancyService = new SeatOccupancyService();

// Test 1: Crear vuelo y simular ocupación
console.log('1️⃣  Simular ocupación para 1 vuelo');
const flight1 = new Flight({
    id: 'FL001',
    flightNumber: 'AA100',
    aircraft: 'Boeing 777',
    origin: 'ATL',
    destination: 'LON',
    departureTime: '2026-04-05T10:00:00',
    arrivalTime: '2026-04-05T22:00:00',
    price: 850,
    nodeId: 1
});

const result1 = seatOccupancyService.simularOcupacion(flight1);
if (result1.success) {
    console.log(`   ✓ Vuelo: ${result1.flightId}`);
    console.log(`   Distribución:`);
    for (const [type, stats] of Object.entries(result1.distribucion)) {
        console.log(`     ${type}: Total=${stats.total}, Vendidos=${stats.vendidos}, Reservados=${stats.reservados}, Disponibles=${stats.disponibles}`);
    }
    console.log(`   Resumen: ${result1.resumen.vendidos}V / ${result1.resumen.reservados}R / ${result1.resumen.disponibles}D (${result1.resumen.pctOcupacion}% ocupación)`);
} else {
    console.log(`   ✗ ${result1.error}`);
}

// Test 2: Simulación masiva
console.log('\n2️⃣  Simulación masiva (3 vuelos)');
const flights = [
    new Flight({ id: 'FL001', flightNumber: 'AA100', aircraft: 'B777', origin: 'ATL', destination: 'LON', price: 850, nodeId: 1 }),
    new Flight({ id: 'FL002', flightNumber: 'BA200', aircraft: 'A380', origin: 'LON', destination: 'DXB', price: 700, nodeId: 1 }),
    new Flight({ id: 'FL003', flightNumber: 'EK300', aircraft: 'B787', origin: 'DXB', destination: 'TYO', price: 900, nodeId: 1 })
];

const result2 = seatOccupancyService.simularOcupacionMasiva(flights);
if (result2.success) {
    console.log(`   ✓ Vuelos simulados: ${result2.vuelosSimulados}`);
    console.log(`   Global: ${result2.resumenGlobal.vendidos}V / ${result2.resumenGlobal.reservados}R / ${result2.resumenGlobal.disponibles}D`);
    console.log(`   Ocupación global: ${result2.resumenGlobal.pctOcupacion}%`);
}

// Test 3: Exportar distribución
console.log('\n3️⃣  Exportar distribución');
const result3 = seatOccupancyService.exportarDistribucion(flight1);
if (result3.success) {
    console.log(`   ✓ Total asientos exportados: ${result3.totalAsientos}`);
    const booked = result3.asientos.filter(s => s.status === 'BOOKED').length;
    const reserved = result3.asientos.filter(s => s.status === 'RESERVED').length;
    const available = result3.asientos.filter(s => s.status === 'AVAILABLE').length;
    console.log(`   BOOKED: ${booked}, RESERVED: ${reserved}, AVAILABLE: ${available}`);
}

// Test 4: Actualizar configuración
console.log('\n4️⃣  Actualizar configuración');
const result4 = seatOccupancyService.actualizarConfiguracion({
    vendido: { FIRST_CLASS: 50, ECONOMY_CLASS: 60 },
    reservado: { FIRST_CLASS: 10, ECONOMY_CLASS: 15 }
});
if (result4.success) {
    console.log(`   ✓ Config actualizada:`);
    console.log(`   Vendido: FC=${result4.configuracion.vendido.FIRST_CLASS}%, BC=${result4.configuracion.vendido.BUSINESS_CLASS}%, EC=${result4.configuracion.vendido.ECONOMY_CLASS}%`);
    console.log(`   Reservado: FC=${result4.configuracion.reservado.FIRST_CLASS}%, BC=${result4.configuracion.reservado.BUSINESS_CLASS}%, EC=${result4.configuracion.reservado.ECONOMY_CLASS}%`);
}

// Test 5: Validación de config (error)
console.log('\n5️⃣  Validación de configuración inválida');
const result5 = seatOccupancyService.actualizarConfiguracion({
    vendido: { FIRST_CLASS: 90 },
    reservado: { FIRST_CLASS: 20 }
});
console.log(`   ✓ Error esperado: ${result5.error}`);

// Test 6: Obtener configuración
console.log('\n6️⃣  Obtener configuración actual');
const result6 = seatOccupancyService.getConfiguracion();
console.log(`   Capacidad por tipo: FC=${result6.capacidadPorTipo.FIRST_CLASS}, BC=${result6.capacidadPorTipo.BUSINESS_CLASS}, EC=${result6.capacidadPorTipo.ECONOMY_CLASS}`);

console.log('\n═══════════════════════════════════════════════════');
console.log('✅ TICKET #17 — DEMOSTRACIONES COMPLETADAS');
console.log('═══════════════════════════════════════════════════\n');

process.exit(0);
