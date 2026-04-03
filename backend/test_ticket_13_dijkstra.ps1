# Test TICKET #13 - Dijkstra Algorithm
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🧪 TESTING TICKET #13 - Algoritmo de Dijkstra" -ForegroundColor Yellow
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

# Run Dijkstra demonstration
Write-Host "Ejecutando demostración de Dijkstra..." -ForegroundColor Green
Write-Host ""

try {
    node run_ticket_13.js
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Host ""
        Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host "✅ TICKET #13 - PRUEBAS EXITOSAS" -ForegroundColor Green
        Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host ""
        Write-Host "Componentes completados:" -ForegroundColor Cyan
        Write-Host "  ✓ DijkstraService.js      - Algoritmo de búsqueda"
        Write-Host "  ✓ DijkstraController.js   - Controlador REST"
        Write-Host "  ✓ dijkstraRoutes.js       - Definiciones de rutas"
        Write-Host "  ✓ run_ticket_13.js        - Script de demostración"
        Write-Host ""
        Write-Host "Próximos pasos:" -ForegroundColor Yellow
        Write-Host "  1. Integrar en index.js"
        Write-Host "  2. Iniciar servidor: npm start"
        Write-Host "  3. Probar endpoints Dijkstra"
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "✗ Error durante ejecución (código: $exitCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
    exit 1
}
