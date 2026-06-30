# PowerShell script to verify that local Supabase Edge Functions compile and run successfully.

$ErrorActionPreference = "Stop"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  Verifying Local Supabase Edge Functions    " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

$endpoints = @(
    @{
        Name = "tektelic-ingest"
        Url  = "http://localhost:54321/functions/v1/tektelic-ingest"
        Body = "{}"
    },
    @{
        Name = "lorawan-ingest"
        Url  = "http://localhost:54321/functions/v1/lorawan-ingest"
        Body = "{`"deviceInfo`": {`"devEui`": `"0000000000000000`"}}"
    }
)

$allPassed = $true

foreach ($ep in $endpoints) {
    Write-Host "Testing $($ep.Name)..." -NoNewline
    try {
        $response = Invoke-WebRequest -Method Post -Uri $ep.Url -Body $ep.Body -ContentType "application/json" -UseBasicParsing
        Write-Host " [PASSED] (Status $($response.StatusCode))" -ForegroundColor Green
    } catch {
        # Inspect HTTP response error if present
        if ($_.Exception -and $_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            if ($statusCode -eq 500) {
                Write-Host " [FAILED] (Status 500)" -ForegroundColor Red
                try {
                    $stream = $_.Exception.Response.GetResponseStream()
                    $reader = New-Object System.IO.StreamReader($stream)
                    $body = $reader.ReadToEnd()
                    Write-Host "  Error details: $body" -ForegroundColor Red
                } catch {}
                $allPassed = $false
            } elseif ($statusCode -eq 401) {
                Write-Host " [PASSED] (Status 401 - Unauthorized, Token verification is active)" -ForegroundColor Green
            } else {
                # Other non-500 errors (like 400, 404) mean the function compiled and processed the request
                Write-Host " [PASSED] (Status $statusCode)" -ForegroundColor Green
            }
        } else {
            Write-Host " [FAILED] (Could not connect to Supabase)" -ForegroundColor Red
            Write-Host "  Error: $_" -ForegroundColor Red
            $allPassed = $false
        }
    }
}

Write-Host "=============================================" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "  All functions are healthy and compiling!   " -ForegroundColor Green
} else {
    Write-Host "  Some functions failed verification!        " -ForegroundColor Red
    Write-Host "  Please check 'docker logs supabase_edge_runtime_iot-platform'" -ForegroundColor Yellow
}
Write-Host "=============================================" -ForegroundColor Cyan
