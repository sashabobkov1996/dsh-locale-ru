# Install the Russian language pack into the DSH desktop profile.
# Idempotent: running it twice does not duplicate the patch entry.
$ErrorActionPreference = 'Stop'

$pluginDir = Split-Path -Parent $PSScriptRoot
$profileDir = Join-Path $env:USERPROFILE '.dsh\profiles\desktop'
$patchPath = Join-Path $profileDir 'cordis.patch.yml'

if (-not (Test-Path (Join-Path $pluginDir 'package.json'))) { Write-Error "plugin package not found: $pluginDir"; exit 1 }
if (-not (Test-Path $patchPath)) { Write-Error "DSH desktop profile not found: $patchPath"; exit 1 }

$runtime = Join-Path $env:USERPROFILE '.dsh\dsh-runtimes\dsh-primary-runtime\dependencies'
$nodeExe = Join-Path $runtime 'node\bin\node.exe'
$pnpmMjs = Join-Path $runtime 'pnpm\bin\pnpm.mjs'

Write-Host "plugin:  $pluginDir"
Write-Host "profile: $profileDir"

Push-Location $profileDir
try {
  if ((Test-Path $nodeExe) -and (Test-Path $pnpmMjs)) {
    & $nodeExe $pnpmMjs add "file:$pluginDir"
  } else {
    & pnpm add "file:$pluginDir"
  }
} finally {
  Pop-Location
}

$text = [IO.File]::ReadAllText($patchPath)
$text = [regex]::Replace($text, '(?m)^(\s*preference:\s*)en\s*$', '${1}ru')

if ($text -notmatch 'id:\s*dsh-locale-ru') {
  if (-not $text.EndsWith("`n")) { $text += "`n" }
  $text += "- insert:`n    - id: dsh-locale-ru`n      name: `"dsh-locale-ru`"`n"
}

[IO.File]::WriteAllText($patchPath, $text, (New-Object Text.UTF8Encoding($false)))
Write-Host 'Done. Restart DeepSeek Harness to load the Russian locale.'
