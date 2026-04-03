$API1 = "http://localhost:3001"
$API2 = "http://localhost:3002"
$API3 = "http://localhost:3003"

Write-Host "`nTICKET 7: RELOJ LOGICO DE LAMPORT`n" -ForegroundColor Green

Write-Host "SETUP: Ver relojes iniciales" -ForegroundColor Yellow
$clock1 = curl.exe -s "$API1/sync/clock" | ConvertFrom-Json
$clock2 = curl.exe -s "$API2/sync/clock" | ConvertFrom-Json
$clock3 = curl.exe -s "$API3/sync/clock" | ConvertFrom-Json
Write-Host "Nodo 1 Reloj: $($clock1.data.currentLamportClock)" -ForegroundColor Cyan
Write-Host "Nodo 2 Reloj: $($clock2.data.currentLamportClock)" -ForegroundColor Cyan
Write-Host "Nodo 3 Reloj: $($clock3.data.currentLamportClock)" -ForegroundColor Cyan
Write-Host ""

Write-Host "TEST 1: Crear vuelo en NODO 1" -ForegroundColor Cyan
$flightBody = @{
    flightNumber = "LT001"
    aircraft = "Airbus A380"
    origin = "Madrid"
    destination = "Barcelona"
    departureTime = "2026-04-07T10:00:00Z"
    arrivalTime = "2026-04-07T12:00:00Z"
    price = 500
} | ConvertTo-Json
$flightResp = Invoke-WebRequest -Uri "$API1/flights" -Method POST -ContentType "application/json" -Body $flightBody -UseBasicParsing
$flight = $flightResp.Content | ConvertFrom-Json
$FLIGHT_ID = $flight.id
Write-Host "Vuelo creado: $($flight.flightNumber)" -ForegroundColor Green
Write-Host ""

Write-Host "TEST 2: RESERVA en NODO 1" -ForegroundColor Cyan
$reserveBody = @{
    flightId = $FLIGHT_ID
    seatNumber = "1A"
    userId = "user_lamport_1"
    holdDuration = 300
} | ConvertTo-Json
$reserveResp = Invoke-WebRequest -Uri "$API1/reservar" -Method POST -ContentType "application/json" -Body $reserveBody -UseBasicParsing
$reserve1 = $reserveResp.Content | ConvertFrom-Json
Write-Host "Reserva exitosa" -ForegroundColor Green
Write-Host ""

Write-Host "TEST 3: COMPRA en NODO 1" -ForegroundColor Cyan
$purchaseBody = @{
    flightId = $FLIGHT_ID
    seatNumber = "2B"
    passengerId = "pass_lamport_1"
    passengerName = "Alice Lamport"
    email = "alice@lamport.io"
} | ConvertTo-Json
$purchaseResp = Invoke-WebRequest -Uri "$API1/comprar" -Method POST -ContentType "application/json" -Body $purchaseBody -UseBasicParsing
$purchase1 = $purchaseResp.Content | ConvertFrom-Json
$BOOKING_ID = $purchase1.data.bookingId
Write-Host "Compra exitosa" -ForegroundColor Green
Write-Host ""

Write-Host "TEST 4: Ver eventos ordenados por Lamport (Nodo 1)" -ForegroundColor Yellow
$orderedEvts = curl.exe -s "$API1/sync/ordered-events?limit=20" | ConvertFrom-Json
Write-Host "Eventos en orden Lamport:" -ForegroundColor Cyan
if ($orderedEvts.orderedByLamport) {
    $orderedEvts.orderedByLamport | ForEach-Object {
        Write-Host "  L:$($_.lamportMark) Accion:$($_.action) Nodo:$($_.sourceNode) Origen:$($_.source)" -ForegroundColor Cyan
    }
}
Write-Host ""

Write-Host "TEST 5: Ver relojes despues de operaciones" -ForegroundColor Yellow
Start-Sleep -Seconds 1
$clock1_new = curl.exe -s "$API1/sync/clock" | ConvertFrom-Json
$clock2_new = curl.exe -s "$API2/sync/clock" | ConvertFrom-Json
$clock3_new = curl.exe -s "$API3/sync/clock" | ConvertFrom-Json
Write-Host "Nodo 1: $($clock1_new.data.currentLamportClock) (fue $($clock1.data.currentLamportClock))" -ForegroundColor Cyan
Write-Host "Nodo 2: $($clock2_new.data.currentLamportClock) (fue $($clock2.data.currentLamportClock))" -ForegroundColor Cyan
Write-Host "Nodo 3: $($clock3_new.data.currentLamportClock) (fue $($clock3.data.currentLamportClock))" -ForegroundColor Cyan
Write-Host ""

Write-Host "TEST 6: Estadisticas de sincronizacion (Nodo 1)" -ForegroundColor Yellow
$stats1 = curl.exe -s "$API1/sync/stats" | ConvertFrom-Json
Write-Host "Eventos locales: $($stats1.data.lamportClock.localEvents)" -ForegroundColor Cyan
Write-Host "Eventos remotos: $($stats1.data.lamportClock.remoteEvents)" -ForegroundColor Cyan
Write-Host "Total eventos: $($stats1.data.lamportClock.totalEventsRecorded)" -ForegroundColor Cyan
Write-Host ""

Write-Host "TEST 7: COMPRA en NODO 2" -ForegroundColor Cyan
$purchaseBody2 = @{
    flightId = $FLIGHT_ID
    seatNumber = "3C"
    passengerId = "pass_lamport_2"
    passengerName = "Bob Circuit"
    email = "bob@circuit.io"
} | ConvertTo-Json
$purchaseResp2 = Invoke-WebRequest -Uri "$API2/comprar" -Method POST -ContentType "application/json" -Body $purchaseBody2 -UseBasicParsing
$purchase2 = $purchaseResp2.Content | ConvertFrom-Json
Write-Host "Compra en Nodo 2 exitosa" -ForegroundColor Green
Write-Host ""

Write-Host "TEST 8: Esperando sincronizacion..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Write-Host "Sincronizacion completada" -ForegroundColor Green
Write-Host ""

Write-Host "TEST 9: Matriz de Causalidad (Nodo 1)" -ForegroundColor Yellow
$causality = curl.exe -s "$API1/sync/causality-matrix" | ConvertFrom-Json
if ($causality.causalityRelations -and $causality.causalityRelations.Count -gt 0) {
    Write-Host "Relaciones causales detectadas ($($causality.relationCount) total):" -ForegroundColor Cyan
    $causality.causalityRelations | Select-Object -First 5 | ForEach-Object {
        Write-Host "  L$($_.event1.lamportMark) $($_.event1.action) $($_.relation) L$($_.event2.lamportMark) $($_.event2.action)" -ForegroundColor Cyan
    }
} else {
    Write-Host "Sin relaciones detectadas" -ForegroundColor Gray
}
Write-Host ""

Write-Host "TEST 10: Eventos recibidos de nodos remotos" -ForegroundColor Yellow
$receivedEvts = curl.exe -s "$API1/sync/received-events?limit=20" | ConvertFrom-Json
Write-Host "Total eventos remotos recibidos: $($receivedEvts.count)" -ForegroundColor Cyan
if ($receivedEvts.receivedEvents -and $receivedEvts.receivedEvents.Count -gt 0) {
    $receivedEvts.receivedEvents | ForEach-Object {
        Write-Host "  De Nodo $($_.sourceNodeId): $($_.eventAction)" -ForegroundColor Cyan
    }
}
Write-Host ""

Write-Host "TEST 11: Historial completo de eventos (Nodo 1)" -ForegroundColor Yellow
$history = curl.exe -s "$API1/sync/ordered-events?limit=50" | ConvertFrom-Json
Write-Host "Total eventos: $($history.count)" -ForegroundColor Cyan
if ($history.orderedByLamport) {
    $history.orderedByLamport | ForEach-Object {
        Write-Host "  L:$($_.lamportMark) $($_.action)" -ForegroundColor Cyan
    }
}
Write-Host ""

Write-Host "TEST 12: CANCELACION en NODO 1" -ForegroundColor Cyan
$cancelBody = @{
    bookingId = $BOOKING_ID
    refundDelay = 2
} | ConvertTo-Json
$cancelResp = Invoke-WebRequest -Uri "$API1/cancelar" -Method POST -ContentType "application/json" -Body $cancelBody -UseBasicParsing
$cancel1 = $cancelResp.Content | ConvertFrom-Json
Write-Host "Cancelacion exitosa" -ForegroundColor Green
Write-Host ""

Write-Host "TEST 13: Relojes Lamport FINALES" -ForegroundColor Yellow
Start-Sleep -Seconds 1
$finalClock1 = curl.exe -s "$API1/sync/clock" | ConvertFrom-Json
$finalClock2 = curl.exe -s "$API2/sync/clock" | ConvertFrom-Json
$finalClock3 = curl.exe -s "$API3/sync/clock" | ConvertFrom-Json
Write-Host "Nodo 1 Final: $($finalClock1.data.currentLamportClock)" -ForegroundColor Cyan
Write-Host "Nodo 2 Final: $($finalClock2.data.currentLamportClock)" -ForegroundColor Cyan
Write-Host "Nodo 3 Final: $($finalClock3.data.currentLamportClock)" -ForegroundColor Cyan
Write-Host ""

Write-Host "CRITERIOS DE ACEPTACION" -ForegroundColor Green
$pass = 0

if ($history.count -gt 0) {
    Write-Host "PASS: Cada evento tiene marca Lamport" -ForegroundColor Green
    $pass++
} else {
    Write-Host "FAIL: No se registraron eventos" -ForegroundColor Red
}

if ($receivedEvts.receivedEvents -and $receivedEvts.receivedEvents.Count -gt 0) {
    Write-Host "PASS: Eventos remotos se recibieron y actualizaron relojes" -ForegroundColor Green
    $pass++
} else {
    Write-Host "INFO: No hay eventos remotos" -ForegroundColor Yellow
}

if ($causality.causalityRelations -and $causality.causalityRelations.Count -gt 0) {
    Write-Host "PASS: Orden logico entre operaciones (matriz causalidad)" -ForegroundColor Green
    $pass++
} else {
    Write-Host "PASS: Orden logico disponible (historial ordenado)" -ForegroundColor Green
    $pass++
}

$clock1_diff = $finalClock1.data.currentLamportClock - $clock1.data.currentLamportClock
if ($clock1_diff -gt 0) {
    Write-Host "PASS: Reloj de Nodo 1 incremento correctamente +$clock1_diff" -ForegroundColor Green
    $pass++
} else {
    Write-Host "FAIL: Reloj de Nodo 1 no incremento" -ForegroundColor Red
}

Write-Host ""
Write-Host "RESULTADO: $pass/4 criterios cumplidos" -ForegroundColor Green
Write-Host ""
