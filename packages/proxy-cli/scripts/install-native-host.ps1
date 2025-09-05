# packages/proxy-cli/scripts/install-native-host.ps1
[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)][string]$ExtensionId,
  [Parameter(Mandatory=$true)][string]$InstallerDir,
  [switch]$RegisterChrome = $true,
  [switch]$RegisterEdge   = $true
)

$ErrorActionPreference = "Stop"
$HostName = "com.lsware.totalproject_host"

# 로그(원하면 -Verbose로 확인)
Write-Verbose "InstallerDir : $InstallerDir"
Write-Verbose "ExtensionId  : $ExtensionId"

# 1) 경로 계산 (InstallerDir는 리소스 루트: ...\resources)
$ExePath     = Join-Path $InstallerDir "proxy-cli.exe"
$ManifestDir = Join-Path $InstallerDir "manifests\windows"
$JsonPath    = Join-Path $ManifestDir "$HostName.json"   # 템플릿/기존 파일 위치

# 2) 필수 확인
if (-not (Test-Path -Path $InstallerDir -PathType Container)) {
  throw "InstallerDir not found: $InstallerDir"
}
if (-not (Test-Path -Path $ExePath -PathType Leaf)) {
  throw "proxy-cli.exe not found at: $ExePath"
}
if (-not (Test-Path -Path $JsonPath -PathType Leaf)) {
  throw "Manifest json not found at: $JsonPath"
}

# 3) JSON 로드 후 값 주입 (템플릿에 __EXT_ID__ 없어도 동작)
$manifest = Get-Content -Path $JsonPath -Raw -ErrorAction Stop | ConvertFrom-Json

# path: 실제 exe 절대경로로 교체
$manifest.path = (Resolve-Path $ExePath).Path

# allowed_origins: 입력받은 확장 ID로 세팅(단일 항목)
$manifest.allowed_origins = @("chrome-extension://$ExtensionId/")

# 4) 저장 (UTF-8 BOM 없음)
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($JsonPath, ($manifest | ConvertTo-Json -Depth 10), $Utf8NoBom)
Write-Verbose "Manifest written to: $JsonPath"

# 5) 레지스트리 등록
function Register-Host($Root, $Name, $Path) {
  $key = Join-Path $Root $Name
  if (-not (Test-Path $key)) { New-Item -Path $key -Force | Out-Null }
  New-ItemProperty -Path $key -Name '(Default)' -Value $Path -PropertyType String -Force | Out-Null
}

if ($RegisterChrome) { Register-Host "HKCU:\Software\Google\Chrome\NativeMessagingHosts"    $HostName $JsonPath }
if ($RegisterEdge)   { Register-Host "HKCU:\Software\Microsoft\Edge\NativeMessagingHosts"    $HostName $JsonPath }

Write-Output "OK"
exit 0
