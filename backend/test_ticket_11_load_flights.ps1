Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "TICKET #11: Carga y Limpieza de Dataset de Vuelos" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan

# Cambiar al directorio backend
Set-Location "d:\UNIVERSIDAD\7 Semestre\Sistemas Distribuidos\Practica3\backend"

Write-Host "`n1️⃣ Crear script de carga..." -ForegroundColor Magenta

# Crear archivo temporal de test
$testScript = @'
const FlightDataLoaderService = require('./src/services/FlightDataLoaderService.js');

const loader = new FlightDataLoaderService();
const result = loader.executeFullPipeline();

if (result.success) {
  console.log(`\n✅ ÉXITO: Pipeline completado`);
  console.log(`📁 Archivo exportado: ${result.exportPath}`);
  console.log(`📊 Estadísticas finales:`, JSON.stringify(result.stats, null, 2));
  
  console.log(`\n📋 Muestra de datos limpios:`);
  const sample = loader.getSampleCleanedData(3);
  sample.forEach((flight, idx) => {
    console.log(`\n  [${idx + 1}] ${flight.flightId}`);
    console.log(`      Ruta: ${flight.origin} → ${flight.destination}`);
    console.log(`      Fecha: ${flight.flight_date} | Hora: ${flight.flight_time}`);
    console.log(`      Status: ${flight.status}`);
    console.log(`      Gate: ${flight.gate}`);
    console.log(`      Tiene retorno: ${flight.hasReturnRoute}`);
  });
  
  process.exit(0);
} else {
  console.error(`\n❌ ERROR:`, result.error);
  process.exit(1);
}
'@

$testScript | Out-File -FilePath "load_flights.js" -Encoding UTF8

Write-Host "✓ Script de carga creado: load_flights.js" -ForegroundColor Green

Write-Host "`n2️⃣ Ejecutando carga del CSV..." -ForegroundColor Magenta

# Ejecutar el script
node load_flights.js

if ($LASTEXITCODE -eq 0) {
  Write-Host "`n✅ Carga completada exitosamente" -ForegroundColor Green
  
  Write-Host "`n3️⃣ Verificando archivo exportado..." -ForegroundColor Magenta
  
  if (Test-Path "d:\UNIVERSIDAD\7 Semestre\Sistemas Distribuidos\Practica3\flights_cleaned.json") {
    $fileSize = (Get-Item "d:\UNIVERSIDAD\7 Semestre\Sistemas Distribuidos\Practica3\flights_cleaned.json").Length
    $fileSizeMB = [math]::Round($fileSize / 1MB, 2)
    Write-Host "✓ Archivo exportado: flights_cleaned.json ($fileSizeMB MB)" -ForegroundColor Green
    
    # Ver estadísticas del archivo
    $data = Get-Content "d:\UNIVERSIDAD\7 Semestre\Sistemas Distribuidos\Practica3\flights_cleaned.json" | ConvertFrom-Json
    Write-Host "`n📊 Estadísticas del archivo exportado:" -ForegroundColor Cyan
    Write-Host "  Total flights: $($data.data.Count)" -ForegroundColor White
    Write-Host "  Export date: $($data.metadata.exportDate)" -ForegroundColor White
  } else {
    Write-Host "✗ Archivo no encontrado" -ForegroundColor Red
  }
} else {
  Write-Host "`n❌ Error durante la carga" -ForegroundColor Red
}

Write-Host "`n4️⃣ Limpiando archivos temporales..." -ForegroundColor Magenta
Remove-Item "load_flights.js" -Force -ErrorAction SilentlyContinue
Write-Host "✓ Limpieza completada" -ForegroundColor Green

Write-Host "`n═══════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "✅ Test de TICKET #11 completado" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
