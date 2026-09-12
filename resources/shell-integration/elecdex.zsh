# elecdex shell integration for zsh.
#
# Installed by pointing ZDOTDIR at a temp dir holding this file as `.zshrc`, so
# it must source the user's real dotfiles itself. See
# src/main/pty/shell-integration.ts.

if [[ -n "$ELECDEX_SHELL_INTEGRATION" ]]; then return 0; fi
ELECDEX_SHELL_INTEGRATION=1

# Hand ZDOTDIR back before sourcing the user's rc, so anything inside it that
# references ZDOTDIR (or that re-sources itself) sees the real location.
if [[ -n "$ELECDEX_USER_ZDOTDIR" ]]; then
  ZDOTDIR="$ELECDEX_USER_ZDOTDIR"
  unset ELECDEX_USER_ZDOTDIR
else
  ZDOTDIR="$HOME"
fi
[[ -f "$ZDOTDIR/.zshrc" ]] && source "$ZDOTDIR/.zshrc"

__elecdex_esc() { printf '\033]%s\007' "$1" }

__elecdex_cwd() {
  # zsh's ${(j::)...} with the `q` flag is not a URI encoder, so do it directly.
  local path=$PWD out='' i c
  for (( i = 1; i <= ${#path}; i++ )); do
    c=$path[i]
    if [[ "$c" == [a-zA-Z0-9/._~-] ]]; then
      out+="$c"
    else
      out+=$(printf '%%%02X' "'$c")
    fi
  done
  __elecdex_esc "7;file://${HOST}${out}"
}

__elecdex_preexec() { __elecdex_esc '133;C' }

__elecdex_precmd() {
  local code=$?
  [[ -n "$__elecdex_ran" ]] && __elecdex_esc "133;D;$code"
  __elecdex_ran=1
  __elecdex_cwd
  __elecdex_esc '133;A'
}

autoload -Uz add-zsh-hook
add-zsh-hook precmd __elecdex_precmd
add-zsh-hook preexec __elecdex_preexec

# Mark where input begins. %{...%} tells zsh these bytes take no display width.
PS1="$PS1%{$(printf '\033]133;B\007')%}"
