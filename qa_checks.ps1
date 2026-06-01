$ErrorActionPreference = "Stop"

# 1. Authenticate all demo accounts
Write-Host "--- Task 1: Authentications ---"
$accounts = @(
    @{email="admin@roomify.demo"; password="Admin@12345"; name="admin"},
    @{email="manager@roomify.com"; password="Demo@2026"; name="manager"},
    @{email="staff@roomify.com"; password="Demo@2026"; name="staff"},
    @{email="guest@roomify.com"; password="Demo@2026"; name="guest"}
)

$tokens = @{}

foreach ($acc in $accounts) {
    try {
        $body = @{email=$acc.email; password=$acc.password} | ConvertTo-Json
        $response = Invoke-RestMethod -Uri 'http://localhost:8080/api/auth/login' -Method Post -ContentType 'application/json' -Body $body
        Write-Host "Login $($acc.name): SUCCESS - Roles: $($response.roles -join ', ')"
        $tokens[$acc.name] = $response.token
    } catch {
        Write-Host "Login $($acc.name): FAILED - $_"
    }
}

# 6. Verify protected APIs (No token)
Write-Host "`n--- Task 6: Protected API without token ---"
try {
    $response = Invoke-RestMethod -Uri 'http://localhost:8080/api/dashboard/metrics?startDate=2024-06-01&endDate=2026-06-01' -Method Get
    Write-Host "Protected API check: FAILED (Returned success unexpectedly)"
} catch {
    Write-Host "Protected API check: SUCCESS (Expected failure) - $($_.Exception.Response.StatusCode)"
}

# 2. & 3. DB validation checks via docker exec
Write-Host "`n--- Task 2 & 3: DB Validation and Counts ---"
function Run-Sql($name, $sql) {
    try {
        $result = docker exec roomify-postgres psql -U roomify_user -d roomify -t -A -c "$sql"
        Write-Host "$name : $result"
        return $result
    } catch {
        Write-Host "$name : ERROR - $_"
        return "ERROR"
    }
}

Run-Sql "Duplicate Confirmations" "SELECT COUNT(*) FROM (SELECT confirmation_number FROM reservations GROUP BY confirmation_number HAVING COUNT(*) > 1) t"
Run-Sql "Duplicate Guest Emails" "SELECT COUNT(*) FROM (SELECT email FROM guests GROUP BY email HAVING COUNT(*) > 1) t"
Run-Sql "Duplicate Room Numbers" "SELECT COUNT(*) FROM (SELECT room_number FROM rooms GROUP BY room_number HAVING COUNT(*) > 1) t"
Run-Sql "Orphan Reservations" "SELECT COUNT(*) FROM reservations r LEFT JOIN rooms rm ON rm.id = r.room_id WHERE rm.id IS NULL"
Run-Sql "Orphan Payments" "SELECT COUNT(*) FROM payments p LEFT JOIN reservations r ON r.id = p.reservation_id WHERE r.id IS NULL"
Run-Sql "Orphan Invoices" "SELECT COUNT(*) FROM invoice i LEFT JOIN reservations r ON r.confirmation_number = i.confirmation_number WHERE r.id IS NULL"
Run-Sql "Invalid Room Types" "SELECT COUNT(*) FROM rooms r LEFT JOIN room_types rt ON rt.id = r.room_type_id WHERE rt.id IS NULL"
Run-Sql "Negative Prices" "SELECT COUNT(*) FROM reservations WHERE total_price < 0"
Run-Sql "Checkout before check-in" "SELECT COUNT(*) FROM reservations WHERE check_out_date < check_in_date"
Run-Sql "Stale check-ins (CONFIRMED/PENDING < today-7)" "SELECT COUNT(*) FROM reservations WHERE status IN ('CONFIRMED', 'PENDING') AND check_in_date < CURRENT_DATE - 7"
Run-Sql "Dirty visible values (guests)" "SELECT COUNT(*) FROM guests WHERE name ILIKE '%test%' OR name ILIKE '%mock%' OR name ILIKE '%lorem%' OR name ILIKE '%John Doe%' OR name ILIKE '%asdf%' OR name ILIKE '%placeholder%' OR name ILIKE '%Demo%'"
Run-Sql "Dirty visible values (room types)" "SELECT COUNT(*) FROM room_types WHERE name ILIKE '%demo%' OR name ILIKE '%test%' OR name ILIKE '%mock%'"

Run-Sql "Rooms by status" "SELECT status || ': ' || COUNT(*) FROM rooms GROUP BY status"
Run-Sql "Reservations by status" "SELECT status || ': ' || COUNT(*) FROM reservations GROUP BY status"
Run-Sql "Invoices count" "SELECT COUNT(*) FROM invoice"
Run-Sql "Payments by status" "SELECT payment_status || ': ' || COUNT(*) FROM payments GROUP BY payment_status"
Run-Sql "Service Requests by status" "SELECT status || ': ' || COUNT(*) FROM service_requests GROUP BY status"
Run-Sql "Notifications count" "SELECT COUNT(*) FROM notifications"
Run-Sql "Current-month expenses count" "SELECT COUNT(*) FROM expenses WHERE date_trunc('month', expense_date) = date_trunc('month', CURRENT_DATE)"

# 4. Verify dashboard aggregation (via API using Manager token)
Write-Host "`n--- Task 4: Dashboard Aggregation Verification ---"
$managerHeaders = @{ "Authorization" = "Bearer $($tokens['manager'])" }
try {
    $dashboardStart = (Get-Date).AddDays(-30).ToString("yyyy-MM-dd")
    $dashboardEnd = (Get-Date).ToString("yyyy-MM-dd")
    $metrics = Invoke-RestMethod -Uri "http://localhost:8080/api/dashboard/metrics?startDate=$dashboardStart&endDate=$dashboardEnd" -Method Get -Headers $managerHeaders
    Write-Host "API activeReservations: $($metrics.activeReservations)"
    Write-Host "API totalRevenue: $($metrics.totalRevenue)"
    Write-Host "API totalExpenses: $($metrics.totalExpenses)"
    Write-Host "API netProfit: $($metrics.netProfit)"
    Write-Host "API occupancyRate: $($metrics.occupancyRate)"
} catch {
    Write-Host "Dashboard API Failed: $_"
}

# 5. Verify AI finance
Write-Host "`n--- Task 5: AI Finance Verification ---"
try {
    $forecast = Invoke-RestMethod -Uri "http://localhost:8000/forecast/full" -Method Post -ContentType 'application/json' -Body '{"forecastDays": 30}'
    Write-Host "AI Forecast Start Date: $($forecast.forecastStart)"
    Write-Host "AI Forecast Days: $($forecast.forecastDays)"
    Write-Host "AI Forecast points count: $($forecast.points.Count)"
    
    $pricing = Invoke-RestMethod -Uri "http://localhost:8000/pricing/recommendations" -Method Post
    Write-Host "AI Pricing Recs count: $($pricing.Count)"
    $pricingNames = $pricing | Select-Object -ExpandProperty roomType
    Write-Host "AI Pricing Room Types: $($pricingNames -join ', ')"
} catch {
    Write-Host "AI Finance API Failed: $_"
}
