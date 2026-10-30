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
| `cp source target` | copy | Copies a file. If the target is a folder, the copy keeps its name | `cp DailyPractice/practice24Oct/BankAccount.java DailyPractice/practice25Oct/` |
| `rmdir folder` | remove directory | Deletes a folder, but only if it's empty, so it can't delete work by accident | `rmdir empty-folder` |
| `rm files` | remove | Deletes files permanently: there's no trash and no undo. Check what a pattern matches first with `echo`, like `echo *.class` | `rm *.class` |
| `ln -s target link` | link, `-s` = symbolic | Creates a shortcut (symlink) that points to the target file | `ln -s AGENT.md AGENTS.md` |
| `touch a b` | "touches" the last-modified time | Updates that time, and creates empty files if they don't exist | `touch BankAccount.java BankDemo.java` |
| `tree` | draws folders as a tree | Shows the folder structure | `tree DailyPractice/practice24Oct` |
| `ls -lt` | list, `-l` = long, `-t` = sort by time | Shows details like size and last-modified time, newest first | spotting an outdated `.class` file |
| `ls -a` | list, `-a` = all | Also shows hidden files. Any name starting with `.` is hidden by convention, like `.git` or `.vscode` | checking whether a folder has a `.vscode` settings folder |
| `echo *.java` | echo = repeat back | Prints its arguments, so you can see what the shell expanded | |
| `code folder` | VS Code's command-line launcher | Opens VS Code with that folder as the top folder | `code DailyPractice/practice24Oct`, or `code .` for the current folder |

Git doesn't track empty directories. A placeholder file such as `.gitkeep` lets you keep an otherwise empty directory in the repository; the name is a convention, not a Git feature.

## Shell basics

- **`.` and `..`:** `.` means the current folder and `..` means the folder above it. `cd ..` goes up one level, and `code .` opens VS Code on the folder you're in.
- **Globbing:** the shell expands `*` before the command even runs. `javac *.java` actually receives `javac BankAccount.java BankDemo.java`. Check with `echo *.java`.
- **Brace expansion:** `{a,b,c}` becomes three words, whether or not the files exist (unlike `*`). `cp src/{A,B}.java dest/` runs `cp src/A.java src/B.java dest/`. Also: `mkdir -p app/{src,test}`, and `cp file{,.bak}` (= `cp file file.bak`). Check with `echo`.
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

## GitHub CLI

For `gh` commands, see `GitHubCLIDocs.md`.

## Running the counter lab

Run these commands from `HLD/counter-app/`:

| Command | Meaning and memory hook |
|---|---|
| `npm ci` | Clean, lockfile-based dependency installation, commonly used in continuous integration. Replaces `node_modules` and fails if the manifest and lockfile disagree |
| `npm run build` | Runs the project's `build` script from `package.json`; the name is a convention, so inspect that file to see the actual commands |
| `docker compose up -d --wait` | `compose` manages the services described in `compose.yaml`; `up` creates/starts them, `-d` detaches, and `--wait` waits for running/healthy state |
| `docker compose ps` | Lists the Compose project's containers and their status; `ps` is the familiar process-status name |
| `docker compose logs --tail=30 mongo` | Reads the latest 30 log lines from the `mongo` service |
| `docker compose stop` | Stops containers while retaining them and their data volumes |
| `curl --fail-with-body -X POST http://localhost:3001/api/increment` | Sends an HTTP request; `-X` selects the method. `--fail-with-body` returns a nonzero exit code for HTTP errors while retaining the response body |

`MONGODB_URI=mongodb://127.0.0.1:27018 npm start` sets an environment variable for that command and its children. Unlike `export`, it does not change the variable for later commands in your shell. The app's `*:local` scripts use this to select Docker rather than the Atlas URI saved in `.env.local`.

`docker compose down` removes the project's containers and network but normally retains named volumes. Adding `-v` removes those volumes too, including this lab's saved counter. Remember **v = volumes**, not just stopping a process.

## Extracting PDF text

`pdftotext` converts selectable PDF text into a text file. Example:

```bash
pdftotext -f 27 -l 55 -layout '/home/heisenberg/Downloads/Database Internals.pdf' /tmp/opencode/database-internals-ch1.txt
```

- `-f` = first PDF page; `-l` = last PDF page, inclusive. These count pages in the PDF, which can differ from printed page numbers.
- `-layout` tries to preserve spacing and columns; it doesn't extract diagrams or perform OCR on scanned images.
- Quotes keep the filename with spaces as one argument. The last argument is the output file, which is overwritten if it already exists. `/tmp/opencode/` is temporary working space.
- No terminal output is normal when writing to a file; it doesn't by itself prove success. Check `echo $?` immediately after the command (`0` means success), or read the file with `less /tmp/opencode/database-internals-ch1.txt` (`q` quits).
- Use `-` as the output filename to write to standard output instead, for example `pdftotext -f 27 -l 28 -layout 'book.pdf' - | less`.

## Streams and redirection

For `>`, `>>`, `2>`, `<`, `|`, `2>&1`, `&>`, `|&`, `/dev/null` and `tee`, see `StandardStreamsDocs.md`.
