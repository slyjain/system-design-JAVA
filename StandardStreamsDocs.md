# Standard streams: 0, 1, 2 and `2>&1`

## Every program starts with three open streams

| Number | Name | Where it goes by default | In Java |
|---|---|---|---|
| 0 | stdin (standard input) | from the keyboard | `System.in` |
| 1 | stdout (standard output) | to the terminal | `System.out` |
| 2 | stderr (standard error) | to the terminal | `System.err` |

- The numbers are **file descriptors**: numbered handles the operating system gives a program for the files it has open.
- On Linux, the terminal, real files and pipes are all treated as files. A program just writes to "descriptor 1" and doesn't know or care where that ends up. The shell decides that before the program starts.
- **Why two output streams?** So results and error messages can go to different places. You can save the results to a file and still see the errors on screen.

## Redirection symbols

- `cmd > file`: send stream 1 into `file` (replaces what was there)
- `cmd >> file`: add stream 1 to the end of `file`
- `cmd 2> file`: send stream 2 into `file`
- `cmd < file`: read stream 0 (the input) from `file`
- `cmd1 | cmd2`: connect stream 1 of `cmd1` to stream 0 of `cmd2` (a pipe)

## What `2>&1` means

- `2>` redirects stream 2.
- `&1` means "the same place as stream 1". The `&` matters: `2>1` (without `&`) writes the errors into a **file named `1`**.
- So `2>&1` means: **send stream 2 wherever stream 1 is going right now.**

## Why you need it with pipes

- Without a pipe or a redirect, both streams go to the terminal, so you see everything.
- A pipe `|` only carries stream 1. Errors (stream 2) skip the pipe and go straight to the terminal.
- `java BankDemo.java | tee run.log`: compile errors show on screen but are **not** saved in `run.log`.
- `java BankDemo.java 2>&1 | tee run.log`: errors join stream 1 before the pipe, so `tee` saves them too. (Tested with a compile error: 0 lines in the log without `2>&1`, all 5 error lines with it.)

## Order matters: redirects are applied left to right

`2>&1` copies stream 1's destination **at that moment**. It's not a permanent link.

- `cmd > out.txt 2>&1`: both streams end up in `out.txt`. Stream 1 is pointed at the file first, then stream 2 copies that destination.
- `cmd 2>&1 > out.txt`: only stream 1 goes to the file, and errors still appear on screen. Stream 2 copied stream 1's destination while it was still the terminal, and only then did stream 1 move to the file.
- `cmd 2>&1 | tee file` works because the shell connects the pipe first, then applies the redirects.

## Shortcuts (zsh and bash)

- `cmd &> file`: both streams into `file` (same as `> file 2>&1`)
- `cmd1 |& cmd2`: pipe both streams (same as `2>&1 |`)
- `cmd 2> /dev/null`: throw the errors away. `/dev/null` is a special file that discards everything written to it.

## In Java

- Try it: write a program that prints one line with each, then run it with `> out.txt`. Only the `System.err` line stays on screen.

## Remember

> 0 is input, 1 is output, 2 is errors.
> `|` only carries 1.
> `2>&1` = "2 goes to (`>`) the same place as (`&`) 1", copied at that moment, left to right.
