$ErrorActionPreference = 'Stop'
$env:CI = 'true'

$projectRoot = $PSScriptRoot
$adminUrl = 'http://localhost:3000/admin'
$bundledDependencies = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies'
$bundledNode = Join-Path $bundledDependencies 'node\bin\node.exe'
$bundledPnpm = Join-Path $bundledDependencies 'bin\fallback\pnpm.cmd'

function Test-AdminPort {
  $client = [System.Net.Sockets.TcpClient]::new()
  try {
    $connection = $client.ConnectAsync('127.0.0.1', 3000)
    return $connection.Wait(250) -and $client.Connected
  }
  catch {
    return $false
  }
  finally {
    $client.Dispose()
  }
}

if (Test-AdminPort) {
  Write-Host 'The admin server is already running. Opening the admin page...' -ForegroundColor Green
  Start-Process $adminUrl
  exit 0
}

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$pnpmCommand = Get-Command pnpm.cmd -ErrorAction SilentlyContinue

if (-not $nodeCommand -or -not $pnpmCommand) {
  if (-not (Test-Path -LiteralPath $bundledNode) -or -not (Test-Path -LiteralPath $bundledPnpm)) {
    throw 'Node.js and pnpm were not found. Install Node.js 20.9 or newer, then install pnpm.'
  }

  $env:PATH = "$(Split-Path $bundledNode);$(Split-Path $bundledPnpm);$env:PATH"
  $nodePath = $bundledNode
  $pnpmPath = $bundledPnpm
  Write-Host 'Using the Node.js runtime bundled with Codex.' -ForegroundColor Cyan
}
else {
  $nodePath = $nodeCommand.Source
  $pnpmPath = $pnpmCommand.Source
}

if (-not (Test-Path -LiteralPath (Join-Path $projectRoot 'node_modules'))) {
  Write-Host 'First run: installing project dependencies...' -ForegroundColor Yellow
  & $pnpmPath install
  if ($LASTEXITCODE -ne 0) {
    throw "Dependency installation failed with exit code $LASTEXITCODE."
  }
}

Write-Host 'Starting the club website admin server...' -ForegroundColor Cyan
$nextCli = Join-Path $projectRoot 'node_modules\next\dist\bin\next'
if (-not (Test-Path -LiteralPath $nextCli)) {
  throw 'Next.js is missing. Delete node_modules and run this script again to reinstall dependencies.'
}

$env:NODE_OPTIONS = '--no-deprecation'
$server = Start-Process -FilePath $nodePath -ArgumentList @($nextCli, 'dev') -WorkingDirectory $projectRoot -NoNewWindow -PassThru

try {
  $ready = $false
  for ($attempt = 0; $attempt -lt 120; $attempt++) {
    if ($server.HasExited) {
      throw "The admin process exited early with code $($server.ExitCode)."
    }

    if (Test-AdminPort) {
      $ready = $true
      break
    }

    Start-Sleep -Milliseconds 500
  }

  if (-not $ready) {
    throw 'The admin server did not become ready within 60 seconds.'
  }

  Write-Host "Admin server ready: $adminUrl" -ForegroundColor Green
  Write-Host 'Keep this window open. Press Ctrl+C to stop the server.' -ForegroundColor DarkGray
  Start-Process $adminUrl
  Wait-Process -Id $server.Id
}
finally {
  if (-not $server.HasExited) {
    Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
  }
}
