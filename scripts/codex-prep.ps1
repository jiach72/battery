param(
  [string]$ProjectPath = (Get-Location).Path,
  [string]$PalacePath
)

function Get-ProjectRoot {
  param([string]$StartPath)

  $current = (Resolve-Path $StartPath).Path
  while ($true) {
    if (Test-Path (Join-Path $current 'mempalace.yaml')) {
      return $current
    }

    $parent = Split-Path $current -Parent
    if ($parent -eq $current) {
      return (Resolve-Path $StartPath).Path
    }
    $current = $parent
  }
}

function Get-WingName {
  param([string]$RootPath)

  $configPath = Join-Path $RootPath 'mempalace.yaml'
  if (Test-Path $configPath) {
    $match = Select-String -Path $configPath -Pattern '^\s*wing:\s*(.+?)\s*$' | Select-Object -First 1
    if ($match) {
      return $match.Matches[0].Groups[1].Value.Trim()
    }
  }

  return Split-Path $RootPath -Leaf
}

$root = Get-ProjectRoot -StartPath $ProjectPath
$wing = Get-WingName -RootPath $root

Write-Host "MemPalace project: $root"
Write-Host "MemPalace wing:    $wing"
Write-Host ""

$env:PYTHONUTF8 = "1"

$pythonArgs = @('-m', 'mempalace', 'wake-up', '--wing', $wing)
if ($PalacePath) {
  $pythonArgs += @('--palace', $PalacePath)
}

& python @pythonArgs
