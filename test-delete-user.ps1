# Test script to check delete user functionality
$mockTelegramData = "user=%7B%22id%22%3A6760298907%2C%22first_name%22%3A%22Admin%22%2C%22last_name%22%3A%22User%22%2C%22username%22%3A%22admin_test%22%2C%22language_code%22%3A%22en%22%7D&chat_instance=-123456789&chat_type=private&auth_date=1234567890&hash=mock_hash_for_testing"

Write-Host "Testing delete user functionality..."

try {
    # First get users list
    Write-Host "Getting users list..."
    $usersResponse = Invoke-WebRequest -Uri "http://localhost:10112/api/admin/users" -Method GET -Headers @{
        "x-telegram-init-data" = $mockTelegramData
        "Content-Type" = "application/json"
    }
    
    Write-Host "Users response status: $($usersResponse.StatusCode)"
    $usersData = $usersResponse.Content | ConvertFrom-Json
    Write-Host "Users found: $($usersData.data.users.Count)"
    
    if ($usersData.data.users.Count -gt 0) {
        $testUser = $usersData.data.users[0]
        Write-Host "Test user ID: $($testUser.id)"
        Write-Host "Test user name: $($testUser.firstName)"
        
        # Now try to delete the user
        Write-Host "`nAttempting to delete user..."
        $deleteBody = @{
            reason = "Test deletion"
            adminId = "6760298907"
        } | ConvertTo-Json
        
        $deleteResponse = Invoke-WebRequest -Uri "http://localhost:10112/api/admin/delete-user/$($testUser.id)" -Method DELETE -Headers @{
            "x-telegram-init-data" = $mockTelegramData
            "Content-Type" = "application/json"
        } -Body $deleteBody
        
        Write-Host "Delete response status: $($deleteResponse.StatusCode)"
        Write-Host "Delete response: $($deleteResponse.Content)"
    } else {
        Write-Host "No users found to delete"
    }
    
} catch {
    Write-Host "Error testing delete user: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode)"
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body: $responseBody"
    }
}
