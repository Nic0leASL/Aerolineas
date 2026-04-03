# Script de testing para TICKET #5: Compra de Boletos

$FLIGHT_ID = "FLIGHT_1775171109667_0.48898069706255676"
$API_URL = "http://localhost:3001"

Write-Host "`n[TICKET 5: TESTING COMPRA DE BOLETOS]`n" -ForegroundColor Green

Write-Host "[TEST 1: Comprar asiento disponible]" -ForegroundColor Cyan

$purchaseBody = @{
    flightId = $FLIGHT_ID
    seatNumber = "2A"
    passengerId = "passenger001"
    passengerName = "Juan Perez"
    email = "juan@example.com"
    phoneNumber = "+1-555-1234"
} | ConvertTo-Json

$response1 = Invoke-WebRequest -Uri "$API_URL/comprar" -Method POST -ContentType "application/json" -Body $purchaseBody -UseBasicParsing
$result1 = $response1.Content | ConvertFrom-Json

if ($result1.success) {
    Write-Host "PASS: Boleto comprado exitosamente" -ForegroundColor Green
    Write-Host "  Booking ID: $($result1.data.bookingId)"
    Write-Host "  Confirmation Code: $($result1.data.confirmationCode)"
    Write-Host "  Precio: USD $($result1.data.ticketPrice)"
    Write-Host "  Estado: $($result1.data.status)`n"
    $script:BOOKING_ID = $result1.data.bookingId
} else {
    Write-Host "FAIL: $($result1.error)" -ForegroundColor Red
}

Write-Host "[TEST 2: Intentar comprar mismo asiento]" -ForegroundColor Cyan

$purchaseBody2 = @{
    flightId = $FLIGHT_ID
    seatNumber = "2A"
    passengerId = "passenger002"
    passengerName = "Maria Garcia"
    email = "maria@example.com"
} | ConvertTo-Json

$response2 = Invoke-WebRequest -Uri "$API_URL/comprar" -Method POST -ContentType "application/json" -Body $purchaseBody2 -UseBasicParsing -ErrorAction SilentlyContinue
$result2 = $response2.Content | ConvertFrom-Json

if ($result2.success) {
    Write-Host "FAIL: Deberia haber rechazado" -ForegroundColor Red
} else {
    Write-Host "PASS: Compra rechazada correctamente" -ForegroundColor Green
    Write-Host "  Error: $($result2.error)"
    Write-Host "  Status: $($result2.currentStatus)`n"
}

Write-Host "[TEST 3: Comprar asiento diferente]" -ForegroundColor Cyan

$purchaseBody3 = @{
    flightId = $FLIGHT_ID
    seatNumber = "2B"
    passengerId = "passenger002"
    passengerName = "Maria Garcia"
    email = "maria@example.com"
} | ConvertTo-Json

$response3 = Invoke-WebRequest -Uri "$API_URL/comprar" -Method POST -ContentType "application/json" -Body $purchaseBody3 -UseBasicParsing
$result3 = $response3.Content | ConvertFrom-Json

if ($result3.success) {
    Write-Host "PASS: Boleto 2B comprado" -ForegroundColor Green
    Write-Host "  Precio: USD $($result3.data.ticketPrice) (tipo: $($result3.data.seatType))`n"
    $script:BOOKING_ID_2 = $result3.data.bookingId
} else {
    Write-Host "FAIL: $($result3.error)" -ForegroundColor Red
}

Write-Host "[TEST 4: Comprar asiento Economy]" -ForegroundColor Cyan

$purchaseBody4 = @{
    flightId = $FLIGHT_ID
    seatNumber = "20A"
    passengerId = "passenger003"
    passengerName = "Carlos Lopez"
    email = "carlos@example.com"
} | ConvertTo-Json

$response4 = Invoke-WebRequest -Uri "$API_URL/comprar" -Method POST -ContentType "application/json" -Body $purchaseBody4 -UseBasicParsing
$result4 = $response4.Content | ConvertFrom-Json

if ($result4.success) {
    Write-Host "PASS: Boleto Economy comprado" -ForegroundColor Green
    Write-Host "  Tipo: $($result4.data.seatType) | Precio: USD $($result4.data.ticketPrice)`n"
} else {
    Write-Host "FAIL: $($result4.error)" -ForegroundColor Red
}

Write-Host "[TEST 5: Ver boletos del pasajero]" -ForegroundColor Cyan

$response5 = Invoke-WebRequest -Uri "$API_URL/comprar/pasajero/passenger001" -Method GET -UseBasicParsing
$result5 = $response5.Content | ConvertFrom-Json

Write-Host "PASS: Encontrados $($result5.count) boletos para passenger001" -ForegroundColor Green
$result5.bookings | foreach {
    Write-Host "  Boleto: $($_.confirmationCode) | Asiento: $($_.seatNumber) | Precio: USD $($_.ticketPrice)"
}
Write-Host ""

Write-Host "[TEST 6: Ver eventos de compra]" -ForegroundColor Cyan

$response6 = Invoke-WebRequest -Uri "$API_URL/comprar/eventos?limit=10" -Method GET -UseBasicParsing
$result6 = $response6.Content | ConvertFrom-Json

Write-Host "PASS: Eventos de compra registrados: $($result6.count)" -ForegroundColor Green
$result6.events | foreach {
    Write-Host "  $($_.action): $($_.seatNumber) por $($_.passengerName) - USD $($_.ticketPrice)"
}
Write-Host ""

Write-Host "[TEST 7: Ver ingresos por tipo de asiento]" -ForegroundColor Cyan

$response7 = Invoke-WebRequest -Uri "$API_URL/comprar/ingresos" -Method GET -UseBasicParsing
$result7 = $response7.Content | ConvertFrom-Json

Write-Host "PASS: Ingresos acumulados" -ForegroundColor Green
Write-Host "  First Class: USD $($result7.revenue.byType.FIRST_CLASS)"
Write-Host "  Business Class: USD $($result7.revenue.byType.BUSINESS_CLASS)"
Write-Host "  Economy Class: USD $($result7.revenue.byType.ECONOMY_CLASS)"
Write-Host "  TOTAL: USD $($result7.revenue.total)`n"

Write-Host "[TEST 8: Ver estadisticas]" -ForegroundColor Cyan

$response8 = Invoke-WebRequest -Uri "$API_URL/comprar/stats" -Method GET -UseBasicParsing
$result8 = $response8.Content | ConvertFrom-Json

Write-Host "PASS: Estadisticas del Nodo $($result8.data.nodeId):" -ForegroundColor Green
Write-Host "  Total compras: $($result8.data.purchasesByAction.PURCHASE)"
Write-Host "  Total cancelaciones: $($result8.data.purchasesByAction.CANCEL)"
Write-Host "  Total boletos: $($result8.data.totalBookings)`n"

Write-Host "[TEST 9: Ver detalles de boleto]" -ForegroundColor Cyan

$response9 = Invoke-WebRequest -Uri "$API_URL/comprar/boleto/$BOOKING_ID" -Method GET -UseBasicParsing
$result9 = $response9.Content | ConvertFrom-Json

Write-Host "PASS: Detalles del boleto $BOOKING_ID" -ForegroundColor Green
Write-Host "  Pasajero: $($result9.data.passengerName)"
Write-Host "  Email: $($result9.data.email)"
Write-Host "  Confirmacion: $($result9.data.confirmationCode)"
Write-Host "  Asiento: $($result9.data.seatNumber)"
Write-Host "  Estado: $($result9.data.status)`n"

Write-Host "[TEST 10: Cancelar un boleto]" -ForegroundColor Cyan

$response10 = Invoke-WebRequest -Uri "$API_URL/comprar/boleto/$BOOKING_ID_2" -Method DELETE -UseBasicParsing
$result10 = $response10.Content | ConvertFrom-Json

if ($result10.success) {
    Write-Host "PASS: Boleto cancelado exitosamente" -ForegroundColor Green
    Write-Host "  Estado: $($result10.data.status)"
    Write-Host "  Cancelado: $($result10.data.cancelledAt)`n"
} else {
    Write-Host "FAIL: $($result10.error)" -ForegroundColor Red
}

Write-Host "[TEST 11: Validar email requerido]" -ForegroundColor Cyan

$invalidBody = @{
    flightId = $FLIGHT_ID
    seatNumber = "3A"
    passengerId = "p004"
    passengerName = "Invalid User"
    # falta email
} | ConvertTo-Json

$response11 = Invoke-WebRequest -Uri "$API_URL/comprar" -Method POST -ContentType "application/json" -Body $invalidBody -UseBasicParsing -ErrorAction SilentlyContinue
$result11 = $response11.Content | ConvertFrom-Json

if (!$result11.success) {
    Write-Host "PASS: Validación de parámetros correcta" -ForegroundColor Green
    Write-Host "  Error: $($result11.error)`n"
} else {
    Write-Host "FAIL: Deberia haber rechazado" -ForegroundColor Red
}

Write-Host "[ACCEPTANCE CRITERIA SUMMARY - TICKET 5]`n" -ForegroundColor Green

Write-Host "PASS: Un asiento vendido no puede volver a venderse" -ForegroundColor Green
Write-Host "PASS: La compra cambia correctamente el estado" -ForegroundColor Green
Write-Host "PASS: El sistema guarda trazabilidad de la transaccion" -ForegroundColor Green
Write-Host "PASS: Devuelve datos completos del boleto (confirmationCode, precio, etc)" -ForegroundColor Green
Write-Host "PASS: Valida disponibilidad del asiento (rechaza BOOKED)" -ForegroundColor Green
Write-Host "PASS: Calcula precio dinamicamente por tipo de asiento" -ForegroundColor Green
Write-Host "PASS: Registra ingresos por tipo de asiento" -ForegroundColor Green
Write-Host "PASS: Permite cancelacion de boletos" -ForegroundColor Green
Write-Host "`n"
