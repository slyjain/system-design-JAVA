# Commands cheat sheet

## How to learn and remember commands

1. **Look it up quickly.**
   - `man cmd` opens the full manual. Type `/word` to search, `n` for the next match, and `q` to quit.
   - `cmd --help` prints a shorter summary.
   - `tldr cmd` shows practical examples. Install it with `sudo pacman -S tealdeer`, then run `tldr --update` once.
2. **Write it down:** what the name stands for, plus one example you actually ran.
3. **Recall it later.** Trying to remember something is what moves it into long-term memory.

## Files and folders

| Command | What the name means | What it does | Example |
|---|---|---|---|
| `mv a b` | move | Moves a file or folder. Renaming is moving to a new name in the same folder. Trap: if `b` is an existing folder, `a` is moved *into* it instead of being renamed | `mv AGENT.md AGENTS.md` |
| `cp source target` | copy | Copies a file. If the target is a folder, the copy keeps its name | `cp practice24Oct/BankAccount.java practice25Oct/` |
| `rmdir folder` | remove directory | Deletes a folder, but only if it's empty, so it can't delete work by accident | `rmdir practice25Oct` |
| `rm files` | remove | Deletes files permanently: there's no trash and no undo. Check what a pattern matches first with `echo`, like `echo *.class` | `rm *.class` |
| `ln -s target link` | link, `-s` = symbolic | Creates a shortcut (symlink) that points to the target file | `ln -s AGENT.md AGENTS.md` |
| `touch a b` | "touches" the last-modified time | Updates that time, and creates empty files if they don't exist | `touch BankAccount.java BankDemo.java` |
| `tree` | draws folders as a tree | Shows the folder structure | `tree practice24Oct` |
| `ls -lt` | list, `-l` = long, `-t` = sort by time | Shows details like size and last-modified time, newest first | spotting an outdated `.class` file |
| `ls -a` | list, `-a` = all | Also shows hidden files. Any name starting with `.` is hidden by convention, like `.git` or `.vscode` | checking whether a folder has a `.vscode` settings folder |
| `echo *.java` | echo = repeat back | Prints its arguments, so you can see what the shell expanded | |
| `code folder` | VS Code's command-line launcher | Opens VS Code with that folder as the top folder | `code practice24Oct`, or `code .` for the current folder |

## Shell basics

- **`.` and `..`:** `.` means the current folder and `..` means the folder above it. `cd ..` goes up one level, and `code .` opens VS Code on the folder you're in.
- **Globbing:** the shell expands `*` before the command even runs. `javac *.java` actually receives `javac BankAccount.java BankDemo.java`. Check with `echo *.java`.
- **Quoting a pattern:** in quotes, `'*.class'` reaches the program as the pattern itself, so the program does the matching instead of the shell. `git rm --cached '*.class'` lets git match `.class` files in every folder. Without quotes, zsh expands the pattern in the current folder only, and if nothing matches it stops with `no matches found` and runs nothing.
- **Feeding input without typing:** `printf '5\nRavi\n' | java Main.java` sends two lines to the program as its input. `printf` = print formatted, and `\n` = new line.
- **Chaining commands:**
  - `a && b` runs `b` only if `a` succeeded.
  - `a || b` runs `b` only if `a` failed.
  - `a ; b` runs both, no matter what.
  - Every command ends with an exit code: 0 means success, anything else means failure. `&&` and `||` check that code.

## Java tools

| Command | What the name means | What it does |
|---|---|---|
| `java File.java` | run straight from the source file | Compiles in memory and runs, leaving no `.class` files behind |
| `javac -d out *.java` | `-d` = destination folder | Compiles into `.class` files inside `out/` |
| `java -cp out BankDemo` | `-cp` = class path | Runs `BankDemo`, looking for `.class` files in `out/` |
| `javac -Xlint:all -d out *.java` | `-X` = extra (non-standard) option. "lint" is the fluff a lint roller picks off clothes: the tool picks suspicious code out of yours | Compiles and shows every warning, not just errors |
| `javap -p out/X.class` | memory hook: "java peek". `-p` = show private members too | Shows what's inside a compiled class |

## Re-running commands (history)

- **Up arrow:** brings back the previous command.
- **`!!`** ("bang bang"): reruns the last command. A classic use is `sudo !!` when you forgot `sudo`.
- **`!java`:** reruns the most recent command that started with `java`.
- **Ctrl + R, then type:** searches your history backwards (R = reverse). Press Ctrl + R again for older matches, and Enter to run.
- **`history | grep java`:** lists every past command containing `java`. `grep` comes from the old editor command `g/re/p`: **g**lobally search for a **r**egular **e**xpression and **p**rint the matching lines.

## Streams and redirection

For `>`, `>>`, `2>`, `<`, `|`, `2>&1`, `&>`, `|&`, `/dev/null` and `tee`, see `StandardStreamsDocs.md`.
