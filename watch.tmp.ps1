$seen = @{}
$end = (Get-Date).AddSeconds(45)
while ((Get-Date) -lt $end) {
  Get-CimInstance Win32_Process -Filter "Name='netsh.exe' OR Name='powershell.exe' OR Name='wmic.exe' OR Name='PING.EXE'" -ErrorAction SilentlyContinue | ForEach-Object {
    if (-not $seen.ContainsKey($_.ProcessId)) {
      $seen[$_.ProcessId] = 1
      $parent = (Get-CimInstance Win32_Process -Filter "ProcessId=$($_.ParentProcessId)" -ErrorAction SilentlyContinue).Name
      $cmd = if ($_.CommandLine) { $_.CommandLine.Substring(0, [Math]::Min(140, $_.CommandLine.Length)) } else { '' }
      Write-Output "$((Get-Date).ToString('HH:mm:ss.fff')) $($_.Name) parent=$parent $cmd"
    }
  }
  Start-Sleep -Milliseconds 150
}
