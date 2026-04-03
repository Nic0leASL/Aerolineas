import FlightDataLoaderService from './src/services/FlightDataLoaderService.js';

console.log('\n═══════════════════════════════════════════════════');
console.log('🚀 TICKET #11: Carga y Limpieza de Dataset');
console.log('═══════════════════════════════════════════════════\n');

const loader = new FlightDataLoaderService();
const result = loader.executeFullPipeline();

if (result.success) {
  console.log('✅ ÉXITO: Pipeline completado');
  console.log(`📁 Archivo: ${result.exportPath}`);
  console.log(`\n📊 Estadísticas:`);
  console.log(JSON.stringify(result.stats, null, 2));
  
  console.log(`\n📋 Muestra de datos limpios (primeros 3):`);
  const sample = loader.getSampleCleanedData(3);
  sample.forEach((flight, idx) => {
    console.log(`\n  [${idx + 1}] ${flight.flightId}`);
    console.log(`      Ruta: ${flight.origin} → ${flight.destination}`);
    console.log(`      Fecha: ${flight.flight_date} | Hora: ${flight.flight_time}`);
    console.log(`      Status: ${flight.status} | Gate: ${flight.gate}`);
    console.log(`      Tiene retorno: ${flight.hasReturnRoute}`);
  });
  
  console.log('\n═══════════════════════════════════════════════════');
  console.log('✅ TICKET #11 COMPLETADO EXITOSAMENTE');
  console.log('═══════════════════════════════════════════════════\n');
  process.exit(0);
} else {
  console.error('❌ ERROR:', result.error);
  process.exit(1);
}

