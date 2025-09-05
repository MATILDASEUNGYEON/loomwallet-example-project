# packages/proxy-cli/scripts/install-native-host.ps1
param(
    [string]$ProjectRoot = "$(Split-Path -Parent $PSScriptRoot)",
    [string]$ExtensionId,
    [string]$InstallerDir
)

$ErrorActionPreference = "Stop"
$HostName = "com.lsware.totalproject_host"

if (-not $ExtensionId) { throw "Extension ID not provided. Aborting installation." }
if (-not (Test-Path -Path $InstallerDir -PathType Container)) {
    throw "InstallerDir not found: $InstallerDir"
}

# DEV: ...\proxy-cli\build\proxy-cli.exe
# PROD: ...\resources\proxy-cli.exe
$ExePath      = Join-Path $InstallerDir "proxy-cli.exe"
$ManifestDir  = Join-Path $InstallerDir "manifests\windows"
$TemplatePath = Join-Path $ManifestDir "$HostName.json"
$OutPath      = Join-Path $ManifestDir "$HostName.json"

if (-not (Test-Path -Path $ExePath -PathType Leaf)) {
    throw "proxy-cli.exe not found at: $ExePath"
}
if (-not (Test-Path -Path $TemplatePath -PathType Leaf)) {
    throw "Manifest template not found at: $TemplatePath"
}

$ExePathEscaped = (Resolve-Path $ExePath).Path.Replace('\','\\')
$ManifestContent = Get-Content -Path $TemplatePath -Raw -ErrorAction Stop
$ManifestContent = $ManifestContent.
    Replace("__EXE_PATH__", $ExePathEscaped).
    Replace("__EXT_ID__",   $ExtensionId)

if (-not (Test-Path -Path $ManifestDir -PathType Container)) {
    New-Item -ItemType Directory -Path $ManifestDir -Force | Out-Null
}
$ManifestContent | Out-File -Encoding utf8 -FilePath $OutPath -Force
# Write-Host "Manifest written to: $OutPath"

$RegKey = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\$HostName"
if (-not (Test-Path $RegKey)) { New-Item -Path $RegKey -Force | Out-Null }
New-ItemProperty -Path $RegKey -Name '(Default)' -Value $OutPath -PropertyType String -Force | Out-Null
# Write-Host "Registered Native Host at HKCU with manifest: $OutPath"
exit 0
