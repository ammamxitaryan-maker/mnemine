# Test script to check exchange rate functionality
$mockTelegramData = "user=%7B%22id%22%3A6760298907%2C%22first_name%22%3A%22Admin%22%2C%22last_name%22%3A%22User%22%2C%22username%22%3A%22admin_test%22%2C%22language_code%22%3A%22en%22%7D&chat_instance=-123456789&chat_type=private&auth_date=1234567890&hash=mock_hash_for_testing"

Write-Host "Testing exchange rate functionality..."

try {
    # First get current exchange rate
    Write-Host "Getting current exchange rate..."
    $rateResponse = Invoke-WebRequest -Uri "http://localhost:10112/api/exchange/rate" -Method GET -Headers @{
        "Content-Type" = "application/json"
    }
    
    Write-Host "Rate response status: $($rateResponse.StatusCode)"
    $rateData = $rateResponse.Content | ConvertFrom-Json
    Write-Host "Current rate: $($rateData.rate)"
    
    # Now try to set a new exchange rate
    Write-Host "`nAttempting to set new exchange rate..."
    $newRate = 1.5
    $rateBody = @{
        rate = $newRate
    } | ConvertTo-Json
    
    $setResponse = Invoke-WebRequest -Uri "http://localhost:10112/api/admin/rate" -Method POST -Headers @{
        "x-telegram-init-data" = $mockTelegramData
        "Content-Type" = "application/json"
    } -Body $rateBody
    
    Write-Host "Set rate response status: $($setResponse.StatusCode)"
    Write-Host "Set rate response: $($setResponse.Content)"
    
    # Verify the rate was updated
    Write-Host "`nVerifying rate was updated..."
    $verifyResponse = Invoke-WebRequest -Uri "http://localhost:10112/api/exchange/rate" -Method GET -Headers @{
        "Content-Type" = "application/json"
    }
    
    $verifyData = $verifyResponse.Content | ConvertFrom-Json
    Write-Host "Updated rate: $($verifyData.rate)"
    
} catch {
    Write-Host "Error testing exchange rate: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode)"
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body: $responseBody"
    }
}
