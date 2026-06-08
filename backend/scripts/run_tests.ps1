$timeoutSeconds = 600
$command = "npm.cmd"
$arguments = "run test:coverage"
$outputFile = "test_output.txt"

Write-Host "Running tests with a timeout of $timeoutSeconds seconds..."

$processInfo = New-Object System.Diagnostics.ProcessStartInfo
$processInfo.FileName = "cmd.exe"
$processInfo.Arguments = "/c $command $arguments > $outputFile 2>&1"
$processInfo.UseShellExecute = $false
$processInfo.CreateNoWindow = $true

$process = [System.Diagnostics.Process]::Start($processInfo)

if ($process.WaitForExit($timeoutSeconds * 1000)) {
    Write-Host "Tests completed successfully within time limit."
} else {
    Write-Host "Tests timed out after $timeoutSeconds seconds. Terminating process..."
    try {
        $process.Kill()
        $process.WaitForExit()
    } catch {
        Write-Host "Process already exited or could not be killed."
    }
}

Write-Host "`n--- Reading Output from $outputFile ---`n"
if (Test-Path $outputFile) {
    Get-Content $outputFile -Tail 100
} else {
    Write-Host "Output file not found."
}
