; installer.nsh

RequestExecutionLevel admin

Function .onInstSuccess

  MessageBox MB_OK "Installer.nsh is running!"

  ; PowerShell 스크립트 실행 (올바른 구문)
  nsExec::Exec `"$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -File "$INSTDIR\resources\install-native-host.ps1" -ExecutionPolicy Bypass`

FunctionEnd