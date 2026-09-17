; Included by electron-builder's NSIS script (nsis.include in electron-builder.yml).

; Uninstalling removes the sign-in entry that the settings' "launch elecdex when
; you sign in to Windows" wrote (src/main/background/login-item.ts), and its
; Task Manager switch, so no dead entry is left behind. Not on an update: the
; installer runs the old uninstaller first, and the entry must survive that.
!macro customUnInstall
  ${ifNot} ${isUpdated}
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "dev.kurouna.elecdex"
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run" "dev.kurouna.elecdex"
  ${endIf}
!macroend
