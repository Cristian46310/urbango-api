#Requires -Version 5.1
<#
.SYNOPSIS
  Abre cada microservicio en su propia ventana de PowerShell.

.EXAMPLE
  .\scripts\start-all.ps1

.EXAMPLE
  .\scripts\start-all.ps1 -Only ms-security,ms-business
#>
[CmdletBinding()]
param(
  [string[]]$Only
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot

function Test-PortListening([int]$Port) {
  [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

function Start-ServiceWindow {
  param(
    [Parameter(Mandatory)][string]$Title,
    [Parameter(Mandatory)][string]$Directory,
    [Parameter(Mandatory)][string]$Command
  )

  if (-not (Test-Path -LiteralPath $Directory)) {
    Write-Host "SKIP  $Title  (no existe $Directory)" -ForegroundColor Yellow
    return
  }

  $safeName = ($Title -replace '[^\w\-]', '_')
  $tempScript = Join-Path $env:TEMP "dev-backend-uc-$safeName.ps1"
  $dirLiteral = $Directory.Replace("'", "''")
  $titleLiteral = $Title.Replace("'", "''")

  $launcher = @"
`$Host.UI.RawUI.WindowTitle = '$titleLiteral'
Set-Location -LiteralPath '$dirLiteral'
Write-Host ''
Write-Host '=== $titleLiteral ===' -ForegroundColor Cyan
Write-Host "Directorio: $dirLiteral" -ForegroundColor DarkGray
Write-Host ''
$Command
if (`$LASTEXITCODE -and `$LASTEXITCODE -ne 0) {
  Write-Host ''
  Write-Host 'El proceso termino con error. Revisa el log de arriba.' -ForegroundColor Red
}
"@

  Set-Content -LiteralPath $tempScript -Value $launcher -Encoding UTF8

  Start-Process -FilePath 'powershell.exe' -WorkingDirectory $Directory -ArgumentList @(
    '-NoExit',
    '-NoLogo',
    '-ExecutionPolicy', 'Bypass',
    '-File', $tempScript
  ) | Out-Null

  Write-Host "OPEN  $Title" -ForegroundColor Green
}

$uvNotifications = @'
$env:PYTHONUTF8 = '1'
$env:UV_PROJECT_ENVIRONMENT = Join-Path $env:LOCALAPPDATA 'uv-projects\ms-notifications'
if (-not (Test-Path (Join-Path $env:UV_PROJECT_ENVIRONMENT 'Scripts\python.exe'))) {
  Write-Host 'Creando venv (fuera de Desktop por App Control)...' -ForegroundColor Yellow
  uv sync --python 3.12
}
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
'@

$uvAi = @'
$env:PYTHONUTF8 = '1'
$env:UV_PROJECT_ENVIRONMENT = Join-Path $env:LOCALAPPDATA 'uv-projects\ms-ai'
if (-not (Test-Path (Join-Path $env:UV_PROJECT_ENVIRONMENT 'Scripts\python.exe'))) {
  Write-Host 'Creando venv (fuera de Desktop por App Control)...' -ForegroundColor Yellow
  uv sync --python 3.12
}
uv run uvicorn main:app --reload --port 8001
'@

$services = @(
  [pscustomobject]@{
    Name = 'ms-notifications'
    Port = 8000
    Dir  = Join-Path $Root 'ms-notifications'
    Cmd  = $uvNotifications
  }
  [pscustomobject]@{
    Name = 'ms-security'
    Port = 8080
    Dir  = Join-Path $Root 'ms-security'
    Cmd  = '.\mvnw.cmd spring-boot:run'
  }
  [pscustomobject]@{
    Name = 'ms-business'
    Port = 3000
    Dir  = Join-Path $Root 'ms-business'
    Cmd  = 'pnpm run start:dev'
  }
  [pscustomobject]@{
    Name = 'ms-messages'
    Port = 3001
    Dir  = Join-Path $Root 'ms-messages'
    # pnpm run dispara un install previo que falla con ERR_PNPM_IGNORED_BUILDS
    Cmd  = 'node .\node_modules\@nestjs\cli\bin\nest.js start --watch'
  }
  [pscustomobject]@{
    Name = 'ms-ai'
    Port = 8001
    Dir  = Join-Path $Root 'ms-ai'
    Cmd  = $uvAi
  }
)

$wanted = $null
if ($Only) {
  $wanted = @(
    $Only |
      ForEach-Object { $_.Trim() } |
      Where-Object { $_ } |
      ForEach-Object { if ($_ -like 'ms-*') { $_ } else { "ms-$_" } }
  )
  $unknown = $wanted | Where-Object { $_ -notin $services.Name }
  if ($unknown) {
    throw "Servicio(s) desconocido(s): $($unknown -join ', '). Usa: $($services.Name -join ', ')"
  }
}

Write-Host "Raiz: $Root" -ForegroundColor DarkGray
Write-Host ''

foreach ($svc in $services) {
  if ($wanted -and $svc.Name -notin $wanted) { continue }

  if (Test-PortListening $svc.Port) {
    Write-Host ("SKIP  {0}  (puerto {1} ya en uso)" -f $svc.Name, $svc.Port) -ForegroundColor Yellow
    continue
  }

  Start-ServiceWindow -Title $svc.Name -Directory $svc.Dir -Command $svc.Cmd
}

Write-Host ''
Write-Host 'Ventanas abiertas. Docs:' -ForegroundColor Cyan
Write-Host '  ms-security      http://localhost:8080/swagger-ui/index.html'
Write-Host '  ms-business      http://localhost:3000/docs'
Write-Host '  ms-messages      http://localhost:3001/docs'
Write-Host '  ms-notifications http://localhost:8000/docs'
Write-Host '  ms-ai            http://localhost:8001/docs'
