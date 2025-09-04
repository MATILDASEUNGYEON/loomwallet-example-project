# packages/proxy-cli/scripts/install-native-host.ps1
param(
    [string]$ProjectRoot = "$(Split-Path -Parent $PSScriptRoot)"
)
$ErrorActionPreference = "Stop"
$HostName = "com.lsware.totalproject_host"
$ManifestPath = (Resolve-Path "$ProjectRoot\manifests\windows\$HostName.json").Path

# 사용자 범위(HKCU)
New-Item -Path "HKCU:\Software\Google\Chrome\NativeMessagingHosts\$HostName" -Force | Out-Null
New-ItemProperty -Path "HKCU:\Software\Google\Chrome\NativeMessagingHosts\$HostName" `
  -Name '(Default)' -Value $ManifestPath -PropertyType String -Force | Out-Null

Write-Host "Registered Native Host at HKCU with manifest: $ManifestPath"
