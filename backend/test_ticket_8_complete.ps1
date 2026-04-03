# Script completo de testing para TICKET #8 - Vector Clocks
# Inicia los 3 nodos en paralelo y ejecuta pruebas

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "TICKET #8: Testing Vector Clocks" -ForegroundColor Cyan
Write-Host "Iniciando 3 nodos..." -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Matar procesos anteriores
Write-Host "Limpiando puertos anteriores..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null | Out-Null
Start-Sleep -Seconds 1

# Iniciar 3 nodos en paralelo
Write-Host "Iniciando Nodo 1 en puerto 3001..." -ForegroundColor Green
Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd backend && set NODE_ID=1 && npm start" `
  -NoNewWindow -RedirectStandardOutput "node1.log"

Write-Host "Iniciando Nodo 2 en puerto 3002..." -ForegroundColor Green
Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd backend && set NODE_ID=2 && npm start" `
  -NoNewWindow -RedirectStandardOutput "node2.log"

Write-Host "Iniciando Nodo 3 en puerto 3003..." -ForegroundColor Green
Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd backend && set NODE_ID=3 && npm start" `
  -NoNewWindow -RedirectStandardOutput "node3.log"

Write-Host "Esperando a que los nodos se inicien..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# URLs base
$baseUrl1 = "http://localhost:3001"
$baseUrl2 = "http://localhost:3002"
$baseUrl3 = "http://localhost:3003"

# 1. Health check
Write-Host ""
Write-Host "1. Health Check" -ForegroundColor Yellow
Write-Host "===============" -ForegroundColor Yellow

try {
  $health1 = Invoke-WebRequest -Uri "$baseUrl1/health" -Method GET -ErrorAction SilentlyContinue | ConvertFrom-Json
  Write-Host "Nodo 1: OK ($($health1.message))" -ForegroundColor Green
} catch {
  Write-Host "Nodo 1: ERROR" -ForegroundColor Red
}

try {
  $health2 = Invoke-WebRequest -Uri "$baseUrl2/health" -Method GET -ErrorAction SilentlyContinue | ConvertFrom-Json
  Write-Host "Nodo 2: OK ($($health2.message))" -ForegroundColor Green
} catch {
  Write-Host "Nodo 2: ERROR" -ForegroundColor Red
}

try {
  $health3 = Invoke-WebRequest -Uri "$baseUrl3/health" -Method GET -ErrorAction SilentlyContinue | ConvertFrom-Json
  Write-Host "Nodo 3: OK ($($health3.message))" -ForegroundColor Green
} catch {
  Write-Host "Nodo 3: ERROR" -ForegroundColor Red
}

# 2. Vector Clock Inicial
Write-Host ""
Write-Host "2. Vector Clock Inicial" -ForegroundColor Yellow
Write-Host "=======================" -ForegroundColor Yellow

try {
  $vc1 = (Invoke-WebRequest -Uri "$baseUrl1/sync/vector-clock" -Method GET -ErrorAction SilentlyContinue).Content | ConvertFrom-Json
  Write-Host "Nodo 1: $($vc1.data.currentVector)" -ForegroundColor Green
  
  $vc2 = (Invoke-WebRequest -Uri "$baseUrl2/sync/vector-clock" -Method GET -ErrorAction SilentlyContinue).Content | ConvertFrom-Json
  Write-Host "Nodo 2: $($vc2.data.currentVector)" -ForegroundColor Green
  
  $vc3 = (Invoke-WebRequest -Uri "$baseUrl3/sync/vector-clock" -Method GET -ErrorAction SilentlyContinue).Content | ConvertFrom-Json
  Write-Host "Nodo 3: $($vc3.data.currentVector)" -ForegroundColor Green
} catch {
  Write-Host "ERROR al obtener Vector Clock" -ForegroundColor Red
}

# 3. Crear eventos en diferentes nodos
Write-Host ""
Write-Host "3. Generando eventos en diferentes nodos" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

# Crear vuelo primero
Write-Host "Creando vuelo..." -ForegroundColor Gray
$flightBody = @{
  flightNumber = "TEST001"
  route = "MEX-NY"
  totalFirstClass = 5
  totalBusinessClass = 10
  totalEconomyClass = 100
} | ConvertTo-Json

try {
  $createFlightResp = Invoke-WebRequest -Uri "$baseUrl1/flights" `
    -Method POST `
    -ContentType "application/json" `
    -Body $flightBody `
    -ErrorAction SilentlyContinue

  $flight = $createFlightResp.Content | ConvertFrom-Json
  $flightId = $flight.data.id
  Write-Host "Vuelo creado: $flightId" -ForegroundColor Green
} catch {
  Write-Host "Error creando vuelo" -ForegroundColor Red
  exit
}

# Evento 1: Reserva en Nodo 1
Write-Host ""
Write-Host "Evento 1: Reserva en Nodo 1" -ForegroundColor Gray
$reserveBody = @{
  flightId = $flightId
  seatNumber = 1
  userId = "user1"
  holdDuration = 300
} | ConvertTo-Json

try {
  $reserve1 = Invoke-WebRequest -Uri "$baseUrl1/reservar" `
    -Method POST `
    -ContentType "application/json" `
    -Body $reserveBody `
    -ErrorAction SilentlyContinue

  Write-Host "Reserva en Nodo 1: OK" -ForegroundColor Green
} catch {
  Write-Host "Error: $_" -ForegroundColor Red
}

# Esperar sincronización
Start-Sleep -Seconds 1

# Evento 2: Compra en Nodo 2
Write-Host "Evento 2: Compra en Nodo 2" -ForegroundColor Gray
$purchaseBody = @{
  flightId = $flightId
  seatNumber = 2
  passengerId = "pass1"
  passengerName = "Pasajero 1"
} | ConvertTo-Json

try {
  $purchase = Invoke-WebRequest -Uri "$baseUrl2/comprar" `
    -Method POST `
    -ContentType "application/json" `
    -Body $purchaseBody `
    -ErrorAction SilentlyContinue

  Write-Host "Compra en Nodo 2: OK" -ForegroundColor Green
} catch {
  Write-Host "Error: $_" -ForegroundColor Red
}

# Esperar sincronización
Start-Sleep -Seconds 2

# 4. Vector Clock después de eventos
Write-Host ""
Write-Host "4. Vector Clock después de eventos" -ForegroundColor Yellow
Write-Host "===================================" -ForegroundColor Yellow

try {
  $vc1After = (Invoke-WebRequest -Uri "$baseUrl1/sync/vector-clock" -Method GET -ErrorAction SilentlyContinue).Content | ConvertFrom-Json
  Write-Host "Nodo 1: $($vc1After.data.currentVector) (local: $($vc1After.data.stats.localEvents), remoto: $($vc1After.data.stats.remoteEvents))" -ForegroundColor Green
  
  $vc2After = (Invoke-WebRequest -Uri "$baseUrl2/sync/vector-clock" -Method GET -ErrorAction SilentlyContinue).Content | ConvertFrom-Json
  Write-Host "Nodo 2: $($vc2After.data.currentVector) (local: $($vc2After.data.stats.localEvents), remoto: $($vc2After.data.stats.remoteEvents))" -ForegroundColor Green
  
  $vc3After = (Invoke-WebRequest -Uri "$baseUrl3/sync/vector-clock" -Method GET -ErrorAction SilentlyContinue).Content | ConvertFrom-Json
  Write-Host "Nodo 3: $($vc3After.data.currentVector) (local: $($vc3After.data.stats.localEvents), remoto: $($vc3After.data.stats.remoteEvents))" -ForegroundColor Green
} catch {
  Write-Host "ERROR al obtener Vector Clock" -ForegroundColor Red
}

# 5. Historial de eventos
Write-Host ""
Write-Host "5. Historial de eventos (Nodo 1)" -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Yellow

try {
  $history = (Invoke-WebRequest -Uri "$baseUrl1/sync/vector-history?limit=10" -Method GET -ErrorAction SilentlyContinue).Content | ConvertFrom-Json
  Write-Host "Total de eventos: $($history.count)" -ForegroundColor Green
  
  foreach ($event in $history.vectorHistory) {
    Write-Host "  - $($event.action) (Nodo $($event.nodeId)): Vector $($event.vectorString) | Fuente: $($event.source)" -ForegroundColor Gray
  }
} catch {
  Write-Host "ERROR al obtener historial" -ForegroundColor Red
}

# 6. Detección de concurrencia
Write-Host ""
Write-Host "6. Detección de eventos concurrentes (Nodo 1)" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow

try {
  $concurrent = (Invoke-WebRequest -Uri "$baseUrl1/sync/concurrent-events" -Method GET -ErrorAction SilentlyContinue).Content | ConvertFrom-Json
  Write-Host "Pares concurrentes detectados: $($concurrent.concurrentPairsCount)" -ForegroundColor Green
  
  foreach ($pair in $concurrent.concurrentEvents) {
    Write-Host "  - $($pair.event1.action) (Nodo $($pair.event1.nodeId)) || $($pair.event2.action) (Nodo $($pair.event2.nodeId))" -ForegroundColor Gray
  }
} catch {
  Write-Host "ERROR al detectar concurrencia" -ForegroundColor Red
}

# 7. Estadísticas
Write-Host ""
Write-Host "7. Estadísticas de sincronización (Nodo 1)" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Yellow

try {
  $stats = (Invoke-WebRequest -Uri "$baseUrl1/sync/stats" -Method GET -ErrorAction SilentlyContinue).Content | ConvertFrom-Json
  Write-Host "Lamport Clock actual: $($stats.data.lamportClock.currentLamportClock)" -ForegroundColor Green
  Write-Host "Vector Clock actual: $($stats.data.vectorClock.currentVector)" -ForegroundColor Green
  Write-Host "Eventos totales (Lamport): $($stats.data.lamportClock.totalEventsRecorded)" -ForegroundColor Green
  Write-Host "Eventos totales (Vector): $($stats.data.vectorClock.totalEventsRecorded)" -ForegroundColor Green
  Write-Host "Eventos locales (Vector): $($stats.data.vectorClock.localEvents)" -ForegroundColor Green
  Write-Host "Eventos remotos (Vector): $($stats.data.vectorClock.remoteEvents)" -ForegroundColor Green
  Write-Host "Eventos concurrentes: $($stats.data.vectorClock.concurrentEventPairs)" -ForegroundColor Green
} catch {
  Write-Host "ERROR al obtener estadísticas" -ForegroundColor Red
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Testing completado" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
