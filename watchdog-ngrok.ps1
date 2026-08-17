# watchdog-ngrok.ps1
# This script monitors the local ngrok agent API and automatically restarts the tunnel if it is down.
# You can run this script via Windows Task Scheduler every 5 minutes.

$ngrokApiUrl = "http://127.0.0.1:4040/api/tunnels"
$ngrokDomain = "crunchy-result-crier.ngrok-free.dev"
$logFile = Join-Path $PSScriptRoot "watchdog-ngrok.log"

function Write-Log($message) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $message"
    Write-Host $logMessage
    Add-Content -Path $logFile -Value $logMessage
}

function Start-NgrokTunnel {
    Write-Log "Attempting to restart ngrok tunnel..."
    
    # 1. Kill any existing stale ngrok processes
    Get-Process -Name "ngrok" -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2
    
    # 2. Start ngrok in the background (hidden window)
    try {
        Start-Process -FilePath "ngrok" -ArgumentList "http", "54321", "--url=$ngrokDomain" -WindowStyle Hidden -ErrorAction Stop
        Start-Sleep -Seconds 5
        Write-Log "ngrok process spawned successfully."
    } catch {
        Write-Log "ERROR: Failed to start ngrok process. Is it in your system PATH? Details: $_"
    }
}

# Main monitoring check
try {
    # Request the active tunnels list from the local ngrok inspector
    $response = Invoke-RestMethod -Uri $ngrokApiUrl -Method Get -TimeoutSec 5 -ErrorAction Stop
    $activeTunnel = $response.tunnels | Where-Object { $_.public_url -like "*$ngrokDomain*" }
    
    if (-not $activeTunnel) {
        Write-Log "WARNING: ngrok is running, but target tunnel ($ngrokDomain) is inactive."
        Start-NgrokTunnel
    } else {
        # Tunnel is alive and well
        Write-Log "OK: Tunnel is active at $($activeTunnel.public_url)"
    }
} catch {
    Write-Log "WARNING: Local ngrok API is unreachable. Tunnel is likely down."
    Start-NgrokTunnel
}
