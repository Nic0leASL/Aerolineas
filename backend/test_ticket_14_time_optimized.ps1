# Test TICKET #14 - Time Optimized Dijkstra
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🧪 TESTING TICKET #14 - Algoritmo de Dijkstra por Tiempo" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check if flights_cleaned.json exists
$cleanedFile = ".\flights_cleaned.json"
if (-not (Test-Path $cleanedFile)) {
    Write-Host "✗ Error: flights_cleaned.json no encontrado" -ForegroundColor Red
    Write-Host "  Ejecuta primero: node run_ticket_11.js" -ForegroundColor Yellow
    exit 1
}

# Check if FlightGraphService exists
$graphServiceFile = ".\src\services\FlightGraphService.js"
if (-not (Test-Path $graphServiceFile)) {
    Write-Host "✗ Error: FlightGraphService.js no encontrado" -ForegroundColor Red
    Write-Host "  Ejecuta primero: node run_ticket_12.js" -ForegroundColor Yellow
    exit 1
}

# Check if TimeOptimizedService exists
$timeServiceFile = ".\src\services\TimeOptimizedService.js"
if (-not (Test-Path $timeServiceFile)) {
    Write-Host "✗ Error: TimeOptimizedService.js no encontrado" -ForegroundColor Red
    exit 1
}

# Run Time Optimized demonstration
Write-Host "Ejecutando demostración de Dijkstra por tiempo..." -ForegroundColor Green
Write-Host ""

try {
    node run_ticket_14.js
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Host ""
        Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host "✅ TICKET #14 - PRUEBAS EXITOSAS" -ForegroundColor Green
        Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host ""
        Write-Host "Componentes completados:" -ForegroundColor Cyan
        Write-Host "  ✓ TimeOptimizedService.js    - Algoritmo de búsqueda por tiempo"
        Write-Host "  ✓ TimeOptimizedController.js - Controlador REST"
        Write-Host "  ✓ timeOptimizedRoutes.js     - Definiciones de rutas"
        Write-Host "  ✓ run_ticket_14.js           - Script de demostración"
        Write-Host ""
        Write-Host "Diferencias principales vs TICKET #13:" -ForegroundColor Yellow
        Write-Host "  • TICKET #13: Dijkstra optimizado por COSTO (precio)"
        Write-Host "  • TICKET #14: Dijkstra optimizado por TIEMPO (duración)"
        Write-Host "  • Comparación: Ruta más barata vs Ruta más rápida"
        Write-Host ""
        Write-Host "Próximos pasos:" -ForegroundColor Yellow
        Write-Host "  1. Iniciar servidor: npm start"
        Write-Host "  2. Probar endpoints Time-Optimized en /time-optimized/*"
        Write-Host "  3. Comparar resultados con /dijkstra/* (TICKET #13)"
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "✗ Error durante ejecución (código: $exitCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
    exit 1
}
