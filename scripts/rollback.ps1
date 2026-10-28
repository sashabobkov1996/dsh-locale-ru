# Remove the Russian language pack from the DSH desktop profile.
$ErrorActionPreference = 'Stop'

$profileDir = Join-Path $env:USERPROFILE '.dsh\profiles\desktop'
$patchPath = Join-Path $profileDir 'cordis.patch.yml'

if (-not (Test-Path $patchPath)) { Write-Error "DSH desktop profile not found: $patchPath"; exit 1 }

$text = [IO.File]::ReadAllText($patchPath)
$original = $text

$text = [regex]::Replace($text, '(?s)- insert:\s*\r?\n\s*- id: dsh-locale-ru\s*\r?\n\s*name:\s*"?dsh-locale-ru"?\s*\r?\n?', '')
$text = [regex]::Replace($text, '(?m)^(\s*preference:\s*)ru\s*$', '${1}en')

if ($text -eq $original) {
  Write-Host 'Nothing to roll back: the language pack is not enabled in this profile.'
} else {
  [IO.File]::WriteAllText($patchPath, $text, (New-Object Text.UTF8Encoding($false)))
  Write-Host 'Done. Restart DeepSeek Harness; the interface returns to English.'
}

Write-Host "To remove the package itself: cd `"$profileDir`"; pnpm remove dsh-locale-ru"
