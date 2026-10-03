# Pins the Neon endpoints to IPv4. This network has no IPv6 egress and Prisma's
# Rust engine aborts on Neon's AAAA records instead of falling back to IPv4.
$hosts = "$env:SystemRoot\System32\drivers\etc\hosts"
$entries = @(
  "3.18.239.121 ep-aged-cell-b585vtr3-pooler.c-7.us-east-2.aws.neon.tech",
  "18.189.49.143 ep-aged-cell-b585vtr3.c-7.us-east-2.aws.neon.tech"
)
$current = Get-Content $hosts -Raw
$missing = @($entries | Where-Object { $current -notmatch [regex]::Escape($_) })
if ($missing.Count -eq 0) { Write-Host "Neon hosts entries already present."; exit 0 }
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
  Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File',"`"$PSCommandPath`""
  exit 0
}
Add-Content -Path $hosts -Value ("# Neon (hosting-platform dev): force IPv4`r`n" + ($missing -join "`r`n"))
Write-Host "Pinned:" ($missing -join ", ")
