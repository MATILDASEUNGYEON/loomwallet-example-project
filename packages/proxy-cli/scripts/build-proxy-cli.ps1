# packages/proxy-cli/scripts/build-proxy-cli.ps1
param(
 [string]$ProjectRoot = "$(Split-Path -Parent $PSScriptRoot)",
 [string]$NodeTarget = "node18-win-x64"
)

$ErrorActionPreference = "Stop"

# 1) host.js → proxy-cli.exe 빌드
Write-Host "Building executable..."
pkg "$ProjectRoot\src\host.js" -t $NodeTarget -o "$ProjectRoot\build\proxy-cli.exe"
Write-Host "Built: $ProjectRoot\build\proxy-cli.exe"

# 2) manifests 템플릿 복사
# 매니페스트 템플릿을 빌드 폴더로 복사
Copy-Item "$ProjectRoot\manifests\windows\com.lsware.totalproject_host.json"  -Destination "$ProjectRoot\build\com.lsware.totalproject_host.json"
Write-Host "Manifest template copied to build folder."

# # 2) manifests 템플릿 → 실제 경로로 치환
# $HostName = "com.lsware.totalproject_host"
# $ManifestDir = "$ProjectRoot\manifests\windows"
# $Template = Get-Content "$ManifestDir\$HostName.json" -Raw

# $ExePath = (Resolve-Path "$ProjectRoot\build\proxy-cli.exe").Path.Replace("\","\\")
# $ExtId = "opnoaogmpliiaoeemmhebpbnkecfjfhk"
# if (-not $ExtId) { throw "EXTENSION_ID env not set." }

# $Manifest = $Template.Replace("__EXE_PATH__", $ExePath).Replace("__EXT_ID__", $ExtId)
# $OutPath  = "$ManifestDir\$HostName.json"
# $Manifest | Out-File -Encoding utf8 $OutPath
# Write-Host "Manifest written: $OutPath"
