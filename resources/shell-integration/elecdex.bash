# elecdex shell integration for bash.
#
# Sourced via `bash --init-file`, which REPLACES the user's own startup file - so
# this script must source it back before doing anything else. See
# src/main/pty/shell-integration.ts.
#
# Emits:
#   OSC 7   ; file://<host><cwd>   the working directory
#   OSC 133 ; A / B / C / D;<code> the prompt / input / exec / finished markers

# Guard against double-sourcing (a nested interactive bash, for instance).
if [ -n "$ELECDEX_SHELL_INTEGRATION" ]; then return 0 2>/dev/null || exit 0; fi
ELECDEX_SHELL_INTEGRATION=1

# Restore the user's normal startup. --init-file suppressed it, so without this
# their aliases, prompt and PATH tweaks would all silently vanish.
if [ -f /etc/bash.bashrc ]; then . /etc/bash.bashrc; fi
if [ -f "$HOME/.bashrc" ]; then . "$HOME/.bashrc"; fi

__elecdex_esc() { printf '\033]%s\007' "$1"; }

__elecdex_cwd() {
  # Percent-encode everything outside the unreserved set plus '/'.
  local path="$PWD" out='' i c
  for ((i = 0; i < ${#path}; i++)); do
    c=${path:i:1}
    case "$c" in
      [a-zA-Z0-9/._~-]) out+="$c" ;;
      *) out+=$(printf '%%%02X' "'$c") ;;
    esac
  done
  __elecdex_esc "7;file://$HOSTNAME$out"
}

# Runs immediately before each command: mark execution start.
__elecdex_preexec() {
  # DEBUG fires for every command in a compound statement; only the first one,
  # while we are still "at the prompt", marks the real execution start.
  if [ "$__elecdex_at_prompt" = 1 ]; then
    __elecdex_at_prompt=0
    __elecdex_esc '133;C'
  fi
}

# Runs before each prompt: report the previous exit code, then the new prompt.
__elecdex_precmd() {
  local code=$?
  if [ "$__elecdex_at_prompt" != 1 ]; then
    __elecdex_esc "133;D;$code"
  fi
  __elecdex_at_prompt=1
  __elecdex_cwd
  __elecdex_esc '133;A'
  return $code
}

__elecdex_at_prompt=1

# PROMPT_COMMAND may already be set by the user's rc; prepend ours.
case "$PROMPT_COMMAND" in
  *__elecdex_precmd*) ;;
  '') PROMPT_COMMAND='__elecdex_precmd' ;;
  *) PROMPT_COMMAND="__elecdex_precmd;$PROMPT_COMMAND" ;;
esac

# Mark where input begins, at the very end of the prompt.
PS1="$PS1\[$(printf '\033]133;B\007')\]"

trap '__elecdex_preexec' DEBUG
