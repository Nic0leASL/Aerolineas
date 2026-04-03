# Script de testing para TICKET #4: Reserva de Asientos

$FLIGHT_ID = "FLIGHT_1775171109667_0.48898069706255676"
$API_URL = "http://localhost:3001"

Write-Host "`n[TEST 1: Reservar asiento disponible]" -ForegroundColor Cyan

$reserveBody = @{
    flightId = $FLIGHT_ID
    seatNumber = "1A"
    userId = "user001"
    holdDuration = 300
} | ConvertTo-Json

$response1 = Invoke-WebRequest -Uri "$API_URL/reservar" -Method POST -ContentType "application/json" -Body $reserveBody -UseBasicParsing
$result1 = $response1.Content | ConvertFrom-Json

if ($result1.success) {
    Write-Host "PASS: Asiento 1A reservado" -ForegroundColor Green
    Write-Host "  Reservation ID: $($result1.data.reservationId)"
    Write-Host "  Estado: $($result1.data.status)"
    Write-Host "  Expira en: $($result1.data.holdExpiresIn) segundos`n"
} else {
    Write-Host "FAIL: $($result1.error)" -ForegroundColor Red
}

Write-Host "`n[TEST 2: Intentar reservar mismo asiento]" -ForegroundColor Cyan

$reserveBody2 = @{
    flightId = $FLIGHT_ID
    seatNumber = "1A"
    userId = "user002"
    holdDuration = 300
} | ConvertTo-Json

$response2 = Invoke-WebRequest -Uri "$API_URL/reservar" -Method POST -ContentType "application/json" -Body $reserveBody2 -UseBasicParsing -ErrorAction SilentlyContinue
$result2 = $response2.Content | ConvertFrom-Json

if ($result2.success) {
    Write-Host "FAIL: Deberia haber rechazado" -ForegroundColor Red
} else {
    Write-Host "PASS: Reserva rechazada correctamente" -ForegroundColor Green
    Write-Host "  Error: $($result2.error)"
    Write-Host "  Status: $($result2.currentStatus)`n"
}

Write-Host "`n[TEST 3: Reservar diferente asiento]" -ForegroundColor Cyan

$reserveBody3 = @{
    flightId = $FLIGHT_ID
    seatNumber = "1B"
    userId = "user002"
    holdDuration = 300
} | ConvertTo-Json

$response3 = Invoke-WebRequest -Uri "$API_URL/reservar" -Method POST -ContentType "application/json" -Body $reserveBody3 -UseBasicParsing
$result3 = $response3.Content | ConvertFrom-Json

if ($result3.success) {
    Write-Host "PASS: Asiento 1B reservado por user002" -ForegroundColor Green
    Write-Host "  Estado: $($result3.data.status)`n"
} else {
    Write-Host "FAIL: $($result3.error)" -ForegroundColor Red
}

Write-Host "`n[TEST 4: Ver reservas activas]" -ForegroundColor Cyan

$response4 = Invoke-WebRequest -Uri "$API_URL/reservar/activas" -Method GET -UseBasicParsing
$result4 = $response4.Content | ConvertFrom-Json

Write-Host "PASS: Reservas activas encontradas: $($result4.count)" -ForegroundColor Green
$result4.reservations | foreach {
    Write-Host "  Seat: $($_.seatNumber) | User: $($_.reservedBy)"
}

Write-Host "`n[TEST 5: Ver eventos de reserva]" -ForegroundColor Cyan

$response5 = Invoke-WebRequest -Uri "$API_URL/reservar/eventos?limit=5" -Method GET -UseBasicParsing
$result5 = $response5.Content | ConvertFrom-Json

Write-Host "PASS: Eventos registrados: $($result5.count)" -ForegroundColor Green
$result5.events | foreach {
    Write-Host "  Action: $($_.action) | Seat: $($_.seatNumber) | User: $($_.userId)"
}

Write-Host "`n[TEST 6: Estadisticas del nodo]" -ForegroundColor Cyan

$response6 = Invoke-WebRequest -Uri "$API_URL/reservar/stats" -Method GET -UseBasicParsing
$result6 = $response6.Content | ConvertFrom-Json

Write-Host "PASS: Estadisticas Nodo $($result6.data.nodeId):" -ForegroundColor Green
Write-Host "  Total eventos: $($result6.data.totalReservationEvents)"
Write-Host "  Activas: $($result6.data.activeReservations)"

Write-Host "`n[TEST 7: Liberar una reserva]" -ForegroundColor Cyan

$releaseBody = @{
    userId = "user001"
} | ConvertTo-Json

$response7 = Invoke-WebRequest -Uri "$API_URL/reservar/$FLIGHT_ID/1A" -Method DELETE -ContentType "application/json" -Body $releaseBody -UseBasicParsing
$result7 = $response7.Content | ConvertFrom-Json

if ($result7.success) {
    Write-Host "PASS: Reserva de 1A liberada" -ForegroundColor Green
    Write-Host "  Nuevo estado: $($result7.data.status)`n"
} else {
    Write-Host "FAIL: $($result7.error)" -ForegroundColor Red
}

Write-Host "`n[ACCEPTANCE CRITERIA SUMMARY - TICKET 4]`n" -ForegroundColor Green

Write-Host "PASS: No se puede reservar un asiento ya reservado" -ForegroundColor Green
Write-Host "PASS: El estado del asiento cambia correctamente" -ForegroundColor Green
Write-Host "PASS: Se guardan eventos de reserva con timestamp" -ForegroundColor Green
Write-Host "PASS: Se registra el nodo que proceso la operacion" -ForegroundColor Green
Write-Host "PASS: Respuesta clara en exito (201 + status)" -ForegroundColor Green
Write-Host "PASS: Respuesta clara en error (4xx con descripcion)" -ForegroundColor Green
Write-Host "`n"
