# elecdex shell integration for fish.
#
# Loaded through XDG_DATA_DIRS as a vendor conf.d snippet, so fish runs it
# automatically AFTER the user's own config - no need to source anything back.
# See src/main/pty/shell-integration.ts.

if set -q ELECDEX_SHELL_INTEGRATION
    exit 0
end
set -g ELECDEX_SHELL_INTEGRATION 1

function __elecdex_esc
    printf '\033]%s\007' $argv[1]
end

function __elecdex_cwd
    # fish's string escape --style=url encodes '/' too, so encode each
    # component and rejoin.
    set -l parts (string split '/' -- $PWD)
    set -l encoded
    for part in $parts
        set -a encoded (string escape --style=url -- $part)
    end
    __elecdex_esc "7;file://$hostname"(string join '/' -- $encoded)
end

function __elecdex_preexec --on-event fish_preexec
    __elecdex_esc '133;C'
    set -g __elecdex_ran 1
end

function __elecdex_precmd --on-event fish_prompt
    set -l code $status
    if set -q __elecdex_ran
        __elecdex_esc "133;D;$code"
        set -e __elecdex_ran
    end
    __elecdex_cwd
    __elecdex_esc '133;A'
end

# fish has no PS1 to append to; wrap fish_prompt so 133;B lands after it.
if functions -q fish_prompt
    functions --copy fish_prompt __elecdex_original_fish_prompt
    function fish_prompt
        __elecdex_original_fish_prompt
        __elecdex_esc '133;B'
    end
end
