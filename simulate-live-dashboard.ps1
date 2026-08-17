# simulate-live-dashboard.ps1
# This script sends simulated real-time telemetry updates to the dashboard device
# run this during your presentation to show live charts and gauge updates.

$deviceId = "88fb00e0-1c9e-4591-8f9c-c80b7b2ac3b1"
$ingestUrl = "http://127.0.0.1:3001/api/v1/ingest/$deviceId"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   IoT Platform Live Telemetry Simulator     " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Target Device: Axioma Watermeter ($deviceId)"
Write-Host "Target Endpoint: $ingestUrl"
Write-Host "Press Ctrl+C to stop simulation at any time.`n"

# Initial base values
$totalIn = 1250.0
$totalOut = 840.0

$i = 1
while ($true) {
    # Generate random increment values
    $incIn = [Math]::Round((Get-Random -Minimum 0.5 -Maximum 2.5), 2)
    $incOut = [Math]::Round((Get-Random -Minimum 0.3 -Maximum 1.8), 2)
    
    $totalIn = [Math]::Round(($totalIn + $incIn), 2)
    $totalOut = [Math]::Round(($totalOut + $incOut), 2)
    $periodIn = [Math]::Round((Get-Random -Minimum 5.0 -Maximum 25.0), 2)
    $periodOut = [Math]::Round((Get-Random -Minimum 2.0 -Maximum 15.0), 2)

    # Build payload JSON
    $payload = @{
        timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ")
        data = @{
            line_1_total_in = $totalIn
            line_1_total_out = $totalOut
            line_1_period_in = $periodIn
            line_1_period_out = $periodOut
        }
    } | ConvertTo-Json

    # Send POST request
    try {
        $response = Invoke-RestMethod -Uri $ingestUrl -Method Post -Body $payload -ContentType "application/json" -TimeoutSec 3
        if ($response.success) {
            Write-Host "[$i] Sending: Total In=$totalIn (+${incIn}), Period In=${periodIn} | Ingest Success!" -ForegroundColor Green
        } else {
            Write-Host "[$i] Ingest failed: $($response.error)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "[$i] Ingest Request Failed: $_" -ForegroundColor Red
    }

    $i++
    Start-Sleep -Seconds 3
}
