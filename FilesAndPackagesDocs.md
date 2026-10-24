# Splitting Java code into files and packages (keeping `void main()`)

## First principles: how Java finds a class

- **In C++,** each `.cpp` file is compiled on its own. You `#include` a header to tell the compiler a class exists, and the **linker** joins the compiled pieces into one program.
- **Java has no headers and no linker.** Instead it has one rule: **a class named `X` lives in `X.java` and compiles to `X.class`.**
  - When the compiler meets a name it doesn't know, it looks for `X.java` (or `X.class`) in the folders it searches.
  - When the program runs, Java loads each class the first time it's used. It finds the class by looking for `X.class` in a list of folders called the **class path**.
- **Remember:** in Java, a class's name is the address of its file. That's why the file name must match the class name.

See it for yourself:

- `javac -d out *.java`, then `ls out`: there's one `.class` file per class.
- `javap -p out/X.class` shows what's inside a class. If you didn't write a constructor, you'll still see one listed: the empty constructor Java adds for you.

## Option 1: separate files in the same folder

```
practice24Oct/
├── BankDemo.java       ← void main()
└── BankAccount.java    ← class BankAccount { ... }
```

- **Name the file after the class.** It contains only the class: no `void main()`, and no loose methods or fields outside the class.
- **Run it** with `java BankDemo.java`. Java finds `BankAccount.java` in the same folder automatically.
- **What changes compared with one file:**
  - `private` is enforced. Using `balance` from `main` gives `balance has private access in BankAccount`.
  - Members with no modifier can still be used from `main`, because files in the same folder share a package.
  - The class file needs its own imports, like `import java.util.List;`. Only the `void main()` file gets them automatically. `IO.println` works in every file.

## Option 2: packages (subfolders)

```
practice24Oct/
├── BankDemo.java           ← void main(), with: import bank.BankAccount;
└── bank/
    └── BankAccount.java    ← first line: package bank;
```

1. **Folder name and package name must match.** A file in `bank/` starts with `package bank;`, and a file in `bank/model/` starts with `package bank.model;`. Package names are all lowercase.
2. **The `void main()` file can't be in a package.** Java refuses with `compact source file should not have package declaration`. Keep it in the top folder.
3. **Import the class in the main file** with `import bank.BankAccount;`, or `import bank.*;` for everything in the package.
4. **Access modifiers matter.** The class, its constructors and its methods must be `public`. Without a modifier you get `... is not public in BankAccount; cannot be accessed from outside package`. `private` fields stay private.
5. **Run it from the top folder** with `java BankDemo.java`.

## What `main` can use

| Where `BankAccount` is | `private` members | Members with no modifier | What needs `public` |
|---|---|---|---|
| Same file as `main` | allowed (not enforced) | allowed | nothing |
| Its own file, same folder | blocked | allowed | nothing |
| Its own file, in a package | blocked | blocked | the class, constructors and methods |

## Compared with C++

- A package is like a namespace tied to a folder. `import bank.BankAccount;` is like `using bank::BankAccount;`. It only lets you use the short name and doesn't paste code in like `#include`.
- There are no header files and no include guards.

## If VS Code complains about the package

VS Code may show: `The declared package "" does not match the expected package "practice24Oct"`.

**Why (first principles):** the terminal and VS Code use the same rule: a class's package is its folder path, counted from a top source folder. They just disagree about which folder is the top.

- `java BankDemo.java` treats the folder of the file you run as the top. `BankAccount.java` sits in that same folder, so it needs no package line.
- VS Code's Java extension picks its own top folders. In this repo it uses `system-design/` itself (plus `src/` and `lld-camp-week1-assignment/Java/`), so it thinks `practice24Oct/BankAccount.java` belongs to a package called `practice24Oct`.

**Don't fix it by adding a package line.** With `package practice24Oct;`, the terminal run fails (`file does not contain class BankAccount ... make sure it appears in the correct subdirectory of the sourcepath`), and the `void main()` file can't have a package anyway.

**Fix VS Code instead** (pick one):

- Right-click `practice24Oct` in the Explorer and choose **Add Folder to Java Source Path**. Do this for each new practice folder.
- Or open the practice folder itself in VS Code: `code practice24Oct`.
