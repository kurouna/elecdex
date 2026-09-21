# elecdex shell integration for PowerShell (Windows PowerShell 5.1 and pwsh 7+).
#
# This is the piece that gives elecdex working-directory tracking on Windows,
# which the original eDEX-UI could not do at all: it polled /proc and lsof, and
# fell back to a detached file browser on win32.
#
# Run via `-NoExit -Command`, which does NOT suppress the user's profile
# (PowerShell already ran it), so there is nothing to source back.

# This text arrived in an environment variable (see shell-integration.ts). Taken
# out before anything else, so no program started from this shell inherits it.
Remove-Item Env:ELECDEX_PS_INIT -ErrorAction SilentlyContinue

if ($env:ELECDEX_SHELL_INTEGRATION) { return }
$env:ELECDEX_SHELL_INTEGRATION = '1'

$global:__elecdexRan = $false

function global:__Elecdex-Esc([string]$Payload) {
    # "$([char]27)]" + payload + BEL
    Write-Host -NoNewline ("$([char]27)]" + $Payload + "$([char]7)")
}

function global:__Elecdex-Cwd {
    $path = (Get-Location).Path
    # Only report real filesystem locations; PowerShell providers such as
    # HKLM:\ or Cert:\ are not directories and would confuse the file browser.
    if ((Get-Location).Provider.Name -ne 'FileSystem') { return }

    $encoded = ($path -replace '\\', '/')
    # Percent-encode, then put the path separators back.
    $encoded = [System.Uri]::EscapeDataString($encoded) -replace '%2F', '/'
    __Elecdex-Esc "7;file://$($env:COMPUTERNAME)/$encoded"
}

# PowerShell has no preexec hook. The prompt function runs after each command,
# so emit D (finished) for the previous command, then the markers for the new
# prompt. C (execution start) is emitted from the PSReadLine key handler below
# when it is available, and otherwise skipped - D and the cwd are what the UI
# actually needs.
$global:__elecdexOriginalPrompt = $function:prompt

function global:prompt {
    $exit = $LASTEXITCODE
    $ok = $?
    if ($global:__elecdexRan) {
        $code = if ($null -ne $exit) { $exit } elseif ($ok) { 0 } else { 1 }
        __Elecdex-Esc "133;D;$code"
    }
    $global:__elecdexRan = $true

    __Elecdex-Cwd
    __Elecdex-Esc '133;A'

    # Render the user's real prompt, then mark where input begins.
    $rendered = & $global:__elecdexOriginalPrompt
    "$rendered$([char]27)]133;B$([char]7)"

    $global:LASTEXITCODE = $exit
}

if (Get-Module -ListAvailable -Name PSReadLine) {
    try {
        Import-Module PSReadLine -ErrorAction Stop
        Set-PSReadLineKeyHandler -Chord Enter -ScriptBlock {
            __Elecdex-Esc '133;C'
            [Microsoft.PowerShell.PSConsoleReadLine]::AcceptLine()
        }
    } catch {
        # PSReadLine unavailable or locked down: the prompt hook alone still
        # gives us cwd and exit codes.
    }
}
