# ═══════════════════════════════════════════════════
# TICKET #15: Test TSP REST API
# Prerequisito: servidor corriendo en puerto 3001
# ═══════════════════════════════════════════════════

$BASE_URL = "http://localhost:3001"
$passed = 0
$failed = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [string]$Body = $null,
        [int]$ExpectedStatus = 200
    )

    Write-Host "`n━━━ TEST: $Name ━━━" -ForegroundColor Cyan

    try {
        $params = @{
            Uri = $Url
            Method = $Method
            ContentType = "application/json"
        }
        if ($Body) {
            $params.Body = $Body
        }

        $response = Invoke-RestMethod @params
        Write-Host "  ✓ Status: OK" -ForegroundColor Green
        Write-Host "  Respuesta:" -ForegroundColor Yellow
        $response | ConvertTo-Json -Depth 5 | Write-Host
        $script:passed++
        return $response
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq $ExpectedStatus -and $ExpectedStatus -ne 200) {
            Write-Host "  ✓ Status esperado: $statusCode" -ForegroundColor Green
            $script:passed++
        } else {
            Write-Host "  ✗ Error: $_" -ForegroundColor Red
            $script:failed++
        }
        return $null
    }
}

Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "🚀 TICKET #15: Test TSP REST API" -ForegroundColor Magenta
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Magenta

# Test 1: GET /tsp/stats
Test-Endpoint `
    -Name "GET /tsp/stats" `
    -Method "GET" `
    -Url "$BASE_URL/tsp/stats"

# Test 2: POST /tsp/solve (por costo)
Test-Endpoint `
    -Name "POST /tsp/solve (costo)" `
    -Method "POST" `
    -Url "$BASE_URL/tsp/solve" `
    -Body '{"destinations": ["ATL", "LON", "DXB", "TYO", "PEK"], "criterion": "cost"}'

# Test 3: POST /tsp/solve (por tiempo)
Test-Endpoint `
    -Name "POST /tsp/solve (tiempo)" `
    -Method "POST" `
    -Url "$BASE_URL/tsp/solve" `
    -Body '{"destinations": ["ATL", "LON", "DXB", "TYO", "PEK"], "criterion": "time"}'

# Test 4: POST /tsp/solve-exact
Test-Endpoint `
    -Name "POST /tsp/solve-exact" `
    -Method "POST" `
    -Url "$BASE_URL/tsp/solve-exact" `
    -Body '{"destinations": ["ATL", "LON", "DXB", "TYO"], "criterion": "cost"}'

# Test 5: POST /tsp/compare
Test-Endpoint `
    -Name "POST /tsp/compare" `
    -Method "POST" `
    -Url "$BASE_URL/tsp/compare" `
    -Body '{"destinations": ["ATL", "LAX", "DFW", "SAO"]}'

# Test 6: POST /tsp/validate-tour
Test-Endpoint `
    -Name "POST /tsp/validate-tour" `
    -Method "POST" `
    -Url "$BASE_URL/tsp/validate-tour" `
    -Body '{"path": ["ATL", "DXB", "TYO", "LON"]}'

# Test 7: Error - destinos insuficientes
Test-Endpoint `
    -Name "Error: destinos insuficientes" `
    -Method "POST" `
    -Url "$BASE_URL/tsp/solve" `
    -Body '{"destinations": ["ATL"], "criterion": "cost"}' `
    -ExpectedStatus 400

# Test 8: Error - criterio invalido
Test-Endpoint `
    -Name "Error: criterio invalido" `
    -Method "POST" `
    -Url "$BASE_URL/tsp/solve" `
    -Body '{"destinations": ["ATL", "LON"], "criterion": "invalid"}' `
    -ExpectedStatus 400

# Test 9: TSP con 8 destinos
Test-Endpoint `
    -Name "POST /tsp/solve (8 destinos)" `
    -Method "POST" `
    -Url "$BASE_URL/tsp/solve" `
    -Body '{"destinations": ["ATL", "LON", "DXB", "TYO", "PEK", "LAX", "DFW", "SAO"], "criterion": "cost"}'

# Resumen
Write-Host "`n═══════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "📊 RESULTADOS" -ForegroundColor Magenta
Write-Host "   Pasados: $passed" -ForegroundColor Green
Write-Host "   Fallidos: $failed" -ForegroundColor $(if($failed -gt 0){"Red"}else{"Green"})
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Magenta
