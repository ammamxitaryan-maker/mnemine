# PowerShell script to replace CFM with USD and CFMT with MNE throughout the project
# Excludes backup directories and git files

param(
    [switch]$DryRun = $false,
    [switch]$Verbose = $false
)

Write-Host "CFM/CFMT Replacement Script" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green

if ($DryRun) {
    Write-Host "DRY RUN MODE - No files will be modified" -ForegroundColor Yellow
}

# Define replacement patterns
$replacements = @{
    "CFM" = "USD"
    "CFMT" = "MNE"
}

# Get all files excluding backup directories and git files
$files = Get-ChildItem -Recurse -File | Where-Object { 
    $_.FullName -notlike "*backup-20250410-075524*" -and 
    $_.FullName -notlike "*.git*" -and
    $_.FullName -notlike "*node_modules*"
}

$totalReplacements = 0
$filesModified = 0

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -ErrorAction SilentlyContinue
    if ($content -eq $null) { continue }
    
    $originalContent = $content
    $fileReplacements = 0
    
    # Apply replacements
    foreach ($pattern in $replacements.Keys) {
        $replacement = $replacements[$pattern]
        $matches = ([regex]$pattern).Matches($content)
        if ($matches.Count -gt 0) {
            $content = $content -replace $pattern, $replacement
            $fileReplacements += $matches.Count
            $totalReplacements += $matches.Count
            
            if ($Verbose) {
                Write-Host "  Found $($matches.Count) occurrences of '$pattern' in $($file.Name)" -ForegroundColor Cyan
            }
        }
    }
    
    # Write changes if any replacements were made
    if ($fileReplacements -gt 0) {
        $filesModified++
        Write-Host "Modified: $($file.FullName) ($fileReplacements replacements)" -ForegroundColor Green
        
        if (-not $DryRun) {
            Set-Content -Path $file.FullName -Value $content -NoNewline
        }
    }
}

Write-Host "`nSummary:" -ForegroundColor Yellow
Write-Host "Files processed: $($files.Count)" -ForegroundColor White
Write-Host "Files modified: $filesModified" -ForegroundColor White
Write-Host "Total replacements: $totalReplacements" -ForegroundColor White

if ($DryRun) {
    Write-Host "`nThis was a dry run. Run without -DryRun to apply changes." -ForegroundColor Yellow
} else {
    Write-Host "`nReplacements completed successfully!" -ForegroundColor Green
}
