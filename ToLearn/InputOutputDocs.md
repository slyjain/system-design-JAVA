# Input and Output in Java (compared with C++)

## The main difference

In C++, `cin` and `cout` both do the work for you. `cin >> x` reads input and converts it to whatever type `x` is, and `cout << x` prints any basic type.

In Java, printing is just as easy, but reading isn't. `System.in` only gives you raw bytes, so you put a reader on top of it that understands text. The usual choices are `Scanner`, which is easy, and `BufferedReader`, which is fast.

| | C++ | Java |
|---|---|---|
| Normal output | `std::cout` | `System.out` |
| Error output | `std::cerr` | `System.err` |
| Input | `std::cin` | `System.in` plus a reader on top |
| What you need at the top of the file | `#include <iostream>` | Nothing for `System.out`. `import java.util.Scanner;` for Scanner, `import java.io.*;` for BufferedReader |

## Output

| Task | C++ | Java |
|---|---|---|
| Print, then a new line | `cout << x << '\n';` | `System.out.println(x);` |
| Print with no new line | `cout << x;` | `System.out.print(x);` |
| Several values | `cout << a << " " << b << '\n';` | `System.out.println(a + " " + b);` |
| Formatted | `printf("%.2f\n", d);` | `System.out.printf("%.2f%n", d);` |
| Format into a string | `std::format("{:.2f}", d)` (C++20) | `String.format("%.2f", d)` |
| Print your own class | overload `operator<<` | override `toString()` |

### Traps

- **`+` works left to right.** `1 + 2 + "x"` gives `3x`, but `"x" + 1 + 2` gives `x12`. Use brackets to get `x3`: `"x" + (1 + 2)`. In C++, `"x" + 1` is pointer arithmetic. In Java, adding anything to a String always joins them as text.
- **Arrays don't print their contents.** `System.out.println(arr)` prints something like `[I@258e2e41`. Use `Arrays.toString(arr)`, or `Arrays.deepToString(arr)` for a 2D array (both need `import java.util.Arrays;`). Lists do print properly, as `[1, 2, 3]`.
- **Decimal numbers print differently.**
  - Java prints `1.0` where C++ prints `1`.
  - For `0.1 + 0.2`, Java prints `0.30000000000000004`, while C++ rounds it to `0.3`.
  - When the exact format matters, use `printf`.
- **`println` flushes the output every time,** just like `endl` in C++. That's fine for small output but slow when you print 100,000+ lines. See "Fast input and output" below.

## Reading input with Scanner (the closest thing to `cin`)

Create one Scanner at the start: `Scanner sc = new Scanner(System.in);`

| Task | C++ | Java |
|---|---|---|
| Read an int | `cin >> n;` | `int n = sc.nextInt();` |
| Read a long or double | `cin >> x;` | `sc.nextLong()`, `sc.nextDouble()` |
| Read one word | `cin >> s;` | `String s = sc.next();` |
| Read one character | `cin >> c;` | `char c = sc.next().charAt(0);` (there's no `nextChar`) |
| Read a whole line | `getline(cin, line);` | `String line = sc.nextLine();` |
| Read until the input ends | `while (cin >> x)` | `while (sc.hasNextInt())`, then call `sc.nextInt()` inside the loop |

### How it differs from C++

- **There's a separate method for each type.** C++ works out the type from the variable, but Java makes you call `nextInt`, `nextLong` and so on.
- **The newline trap is the same as in C++.**
  - In C++, `getline` right after `cin >> n` returns an empty line. In Java, `sc.nextLine()` right after `sc.nextInt()` returns an empty string, `""`.
  - The fix is the same idea too: call `sc.nextLine()` once to skip the rest of the line, like `cin.ignore()` in C++.
- **Bad input crashes the program.** If the input is `abc` and you call `nextInt()`, Java stops with an `InputMismatchException`. In C++, `cin` quietly goes into a failed state and stops reading.
- **Use one Scanner for the whole program and don't close it early.** Closing it also closes `System.in`, and after that you can't read anything else.

## Fast input and output (for large inputs)

Scanner is easy but slow. For large inputs, roughly 100,000 numbers or more, which is common in competitive programming, use Java's equivalent of `ios::sync_with_stdio(false); cin.tie(nullptr);`.

**For input**, create a `BufferedReader`: `BufferedReader br = new BufferedReader(new InputStreamReader(System.in));`

- `br.readLine()` reads one line as a String. It returns `null` when the input ends, so it works like `while (getline(cin, line))`.
- Split the line into words with `StringTokenizer` (in `java.util`), which handles any spacing, or with `line.split(" ")`.
- Convert the words to numbers yourself (see the table below).

**For output**, either:

- add everything to a `StringBuilder` and print it once at the end, or
- use a `PrintWriter` and call `flush()` at the end. If you forget `flush()`, some or all of the output never appears. This is a classic bug.

**`readLine()` can throw `IOException`,** a checked exception, so `main` needs `throws IOException` or a `try`/`catch`. What "checked" means is in `ExceptionsDocs.md`.

**Use only one reader per program.** If you mix `Scanner` and `BufferedReader` on `System.in`, some input gets lost, because each one reads ahead and keeps what it read in its own storage.

### Converting text to numbers

| C++ | Java |
|---|---|
| `stoi(s)` | `Integer.parseInt(s)` |
| `stoll(s)` | `Long.parseLong(s)` |
| `stod(s)` | `Double.parseDouble(s)` |

## The `IO` class (Java 25 and later)

Java 25 added the `IO` class, which needs no import and no setup:

- `IO.println(x)` and `IO.print(x)`
- `String s = IO.readln();`, or `IO.readln("Enter your name: ")` to show a prompt first

It only reads whole lines as Strings, so you have to convert numbers yourself, for example `Integer.parseInt(IO.readln())`. It's handy for quick experiments. Many coding platforms run older versions of Java that don't have `IO`, though, so learn `System.out` and `Scanner` as well.

## Testing with an input file

Redirect a file into the program's input, exactly as in C++ (`./a.out < input.txt`). How `<` and `>` work is in `StandardStreamsDocs.md`.

## Where you'll need this

- **LeetCode:** there's no reading or printing to do. LeetCode calls your method and checks what it returns. You only print things to help you debug.
- **HackerRank, Codeforces, CodeChef and company online tests:** you read the input and print the output yourself, so you need `Scanner` or `BufferedReader`.

## Practice exercise

Read a number `n`, then `n` numbers, and print their sum. Write it once with `Scanner` and once with `BufferedReader`, then run both with `< input.txt`.
