# Konquer — inicia o painel Guilda ITA e abre no navegador.
$ErrorActionPreference = 'SilentlyContinue'
Set-Location $PSScriptRoot

function Test-Panel {
  try {
    Invoke-WebRequest -UseBasicParsing 'http://localhost:5173' -TimeoutSec 2 | Out-Null
    return $true
  } catch {
    return $false
  }
}

if (-not (Test-Panel)) {
  Start-Process -WindowStyle Minimized -FilePath 'cmd.exe' -ArgumentList '/c', 'npm run dev' -WorkingDirectory $PSScriptRoot
  for ($i = 0; $i -lt 80; $i++) {
    Start-Sleep -Milliseconds 500
    if (Test-Panel) { break }
  }
}

Start-Process 'http://localhost:5173'
