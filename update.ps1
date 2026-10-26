# Spielt ein neues ZIP von Claude in diesen Git-Ordner ein, committet und pusht.
# Aufruf (im Git-Ordner, dort wo .git liegt):
#   powershell -ExecutionPolicy Bypass -File .\update.ps1
# oder mit einem bestimmten ZIP:
#   powershell -ExecutionPolicy Bypass -File .\update.ps1 "C:\Pfad\innerpath-app.zip"
param([string]$Zip)
$ErrorActionPreference = 'Stop'
$repo = $PSScriptRoot

if (-not (Test-Path (Join-Path $repo '.git'))) { throw 'Dieses Skript muss im Git-Ordner liegen (dort, wo der Ordner .git ist).' }
if (-not (Test-Path (Join-Path $repo 'package.json'))) { throw 'Im Git-Ordner fehlt package.json - hier stimmt etwas nicht, ich ändere nichts.' }

if (-not $Zip) {
  $found = Get-ChildItem (Join-Path $env:USERPROFILE 'Downloads') -Filter 'innerpath-app*.zip' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if (-not $found) { throw 'Kein innerpath-app*.zip im Downloads-Ordner gefunden. Gib den Pfad an: .\update.ps1 "C:\Pfad\innerpath-app.zip"' }
  $Zip = $found.FullName
}
if (-not (Test-Path $Zip)) { throw "ZIP nicht gefunden: $Zip" }
Write-Host "ZIP: $Zip" -ForegroundColor Cyan

$tmp = Join-Path $env:TEMP ('vma-' + [guid]::NewGuid().ToString('N'))
Expand-Archive -Path $Zip -DestinationPath $tmp
$src = $tmp
if (-not (Test-Path (Join-Path $src 'package.json'))) {
  $sub = Get-ChildItem $tmp -Directory | Where-Object { Test-Path (Join-Path $_.FullName 'package.json') } | Select-Object -First 1
  if ($sub) { $src = $sub.FullName } else { Remove-Item $tmp -Recurse -Force; throw 'Im ZIP wurde keine package.json gefunden - das ist nicht das richtige ZIP.' }
}

# Abgleichen: neue/geänderte Dateien kommen rein, Dateien, die es im ZIP nicht mehr gibt, werden entfernt.
# Bleiben unberührt: .git, node_modules, dist, .vercel, .vscode, Env-Dateien, dieses Skript.
robocopy $src $repo /MIR /XD .git node_modules dist .vercel .vscode /XF update.ps1 .env .env.* *.local /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) { Remove-Item $tmp -Recurse -Force; throw "robocopy-Fehler (Code $LASTEXITCODE)" }
Remove-Item $tmp -Recurse -Force

Set-Location $repo
Write-Host ''
Write-Host 'Das hat sich geändert:' -ForegroundColor Cyan
git status --short
$changes = git status --porcelain
if (-not $changes) { Write-Host 'Keine Änderungen - alles ist schon aktuell.' -ForegroundColor Green; return }
Write-Host ''
$null = Read-Host 'Sieht das richtig aus? Enter = committen und hochladen, Strg+C = abbrechen'
$msg = Read-Host 'Commit-Nachricht (Enter = "Update von Claude")'
if (-not $msg) { $msg = 'Update von Claude' }
git add -A
git commit -m $msg
git push
Write-Host ''
Write-Host 'Fertig. Vercel baut jetzt automatisch.' -ForegroundColor Green
