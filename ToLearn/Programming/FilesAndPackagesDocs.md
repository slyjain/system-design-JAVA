# Where classes live: one file, separate files, packages

What goes inside a class is in `ClassesAndObjectsDocs.md`. Error messages you can hit here are explained in `CommonErrorsDocs.md`.

## First principles: how Java finds a class

- **In C++,** each `.cpp` file is compiled on its own. You `#include` a header to tell the compiler a class exists, and the **linker** joins the compiled pieces into one program.
- **Java has no headers and no linker.** Instead it has one rule: **a class named `X` lives in `X.java` and compiles to `X.class`.**
  - When the compiler meets a name it doesn't know, it looks for `X.java` (or `X.class`) in the folders it searches.
  - When the program runs, Java loads each class the first time it's used. It finds the class by looking for `X.class` in a list of folders called the **class path**.
- **Remember:** in Java, a class's name is the address of its file. That's why the file name must match the class name.
- **See it for yourself:** `javac -d out *.java`, then `ls out`. There's one `.class` file per class.

## Everything in one file with `void main()`

- Put your classes above or below `void main()`. The order doesn't matter, and there are no forward declarations.
- The file itself becomes a hidden class named after the file, and your classes are nested inside it. In `BankDemo.java`, a class called `Account` is really `BankDemo$Account`. That's why printing it without `toString()` shows something like `BankDemo$Account@3ec300f1`. A class in its own file is top-level and prints without the `$`, like `BankAccount@43ee72e6`.
- This nesting is also why access modifiers aren't enforced in one file (see the table below): Java lets code anywhere inside a class use the private members of classes nested in it, and the whole file is one class.

## Option 1: separate files in the same folder

```
practice24Oct/
├── BankDemo.java       ← void main()
└── BankAccount.java    ← class BankAccount { ... }
```

- **Name the file after the class.** It contains only the class: no `void main()`, and no loose methods or fields outside the class.
- **Run it** with `java BankDemo.java`. Java finds `BankAccount.java` in the same folder by the rule above.
- **Imports:** only the `void main()` file imports common classes automatically. The class file needs its own, like `import java.util.List;`. `IO.println` works in every file.

## Option 2: packages (subfolders)

```
practice24Oct/
├── BankDemo.java           ← void main(), with: import bank.BankAccount;
└── bank/
    └── BankAccount.java    ← first line: package bank;
```

1. **Folder name and package name must match.** A file in `bank/` starts with `package bank;`, and a file in `bank/model/` starts with `package bank.model;`. Package names are all lowercase.
2. **The `void main()` file can't be in a package.** Keep it in the top folder.
3. **Import the class in the main file** with `import bank.BankAccount;`, or `import bank.*;` for everything in the package.
4. **Run it from the top folder** with `java BankDemo.java`.

## What `main` can use in each setup

| Where `BankAccount` is | `private` members | Members with no modifier | What needs `public` |
|---|---|---|---|
| Same file as `main` | allowed (not enforced) | allowed | nothing |
| Its own file, same folder | blocked | allowed | nothing |
| Its own file, in a package | blocked | blocked | the class, constructors and methods |

## Compared with C++

A package is like a namespace tied to a folder. `import bank.BankAccount;` is like `using bank::BankAccount;`. It only lets you use the short name and doesn't paste code in like `#include`.

## If VS Code complains about the package

VS Code may say the declared package doesn't match an expected package such as `DailyPractice.practice24Oct`.

**Why (first principles):** the terminal and VS Code use the same rule: a class's package is its folder path, counted from a top source folder. They just disagree about which folder is the top.

- `java BankDemo.java` treats the folder of the file you run as the top. `BankAccount.java` sits in that same folder, so it needs no package line.
- VS Code's Java extension picks its own top folders. If it uses `system-design/` as a source root, it can think `DailyPractice/practice24Oct/BankAccount.java` belongs to a package called `DailyPractice.practice24Oct`.

**Don't fix it by adding a package line.** Adding a package to the class changes how it must be compiled and loaded; the `void main()` file can't have a package anyway.

**Fix: open each practice folder as its own VS Code window**, for example `code DailyPractice/practice24Oct` from `system-design/`. VS Code then treats that folder as the top, and the error goes away.

**Why a separate window, not "Add Folder to Java Source Path":** VS Code treats each opened folder as one Java project. Putting several practice folders into one source path can make same-named classes clash. `src/main.java` and `DailyPractice/practice23Oct/main.java` are both called `main`, and a `BankAccount` written on another day can clash with this one. Separate windows keep each day's practice apart.
