# packages/proxy-cli/scripts/install-native-host.ps1
param(
    [string]$ProjectRoot = "$(Split-Path -Parent $PSScriptRoot)",
    [string]$ExtensionId,
    [string]$InstallerDir
)

$ErrorActionPreference = "Stop"

$HostName = "com.lsware.totalproject_host"

# 1) 매니페스트 템플릿을 읽고, 실제 경로와 ID로 치환하여 저장
# 매니페스트 파일의 최종 경로를 설정
$ManifestDir = "$InstallerDir\resources\manifests\windows"
$OutPath = "$ManifestDir\$HostName.json"

# 확장 ID가 전달되었는지 확인합니다.
if (-not $ExtensionId) {
    throw "Extension ID not provided. Aborting installation."
}
# 네이티브 실행 파일의 경로를 올바르게 설정합니다.
# extraFiles 설정에 따라 proxy-cli.exe는 resources 폴더 아래에 위치합니다.
$ExePath = (Resolve-Path "$InstallerDir\resources\proxy-cli.exe").Path.Replace("\","\\")

# 템플릿 파일을 읽습니다. 이 파일은 인스톨러에 의해 resources/manifests/windows에 복사됩니다.
$TemplatePath = (Resolve-Path "$InstallerDir\resources\manifests\windows\$HostName.json").Path
$ManifestContent = Get-Content $TemplatePath -Raw

# 플레이스홀더를 실제 값으로 교체합니다.
$ManifestContent = $ManifestContent.Replace("__EXE_PATH__", $ExePath).Replace("__EXT_ID__", $ExtensionId)

# 최종 매니페스트 파일을 저장합니다.
$ManifestContent | Out-File -Encoding utf8 $OutPath

Write-Host "Manifest written to: $OutPath"

# 사용자 범위(HKCU)
New-Item -Path "HKCU:\Software\Google\Chrome\NativeMessagingHosts\$HostName" -Force | Out-Null
New-ItemProperty -Path "HKCU:\Software\Google\Chrome\NativeMessagingHosts\$HostName" `
  -Name '(Default)' -Value $OutPath -PropertyType String -Force | Out-Null

Write-Host "Registered Native Host at HKCU with manifest: $OutPath"
