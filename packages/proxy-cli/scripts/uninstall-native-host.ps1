# packages/proxy-cli/scripts/uninstall-native-host.ps1
$ErrorActionPreference = "Stop"
$HostName = "com.lsware.totalproject_host"

# 레지스트리 제거
Remove-Item "HKCU:\Software\Google\Chrome\NativeMessagingHosts\$HostName" -Recurse -ErrorAction SilentlyContinue

# (선택) 빌드 산출물/매니페스트 정리
# Remove-Item "..\build\proxy-cli.exe" -Force -ErrorAction SilentlyContinue

Write-Host "Unregistered Native Host: $HostName"
