# Common errors and what they mean

## How to read an error

- Fix the **first** error first. One mistake can cause several errors after it.
- The `^` shows where Java noticed the problem. The real mistake is often just before that point, for example a missing `;` at the end of the previous line.

## Compile errors (from `javac` or `java File.java`)

| Error message | What it means | Fix |
|---|---|---|
| `variable x might not have been initialized` | You read a local variable before giving it a value | Assign it first. Fields get default values, locals don't |
| `';' expected` | A statement or declaration is missing its `;`, for example `package io` | Add the `;` where the `^` points, or at the end of the line before |
| `<identifier> expected` | Java expected a name, for example after an unfinished `package ` line | Finish the line, or delete it |
| `cannot find symbol` | A name Java doesn't know: a typo, or a missing import | Fix the spelling, or add the import. Only `void main()` files import common classes automatically |
| `x has private access in Y` | Code outside class `Y` used one of its private members | Use one of `Y`'s methods, like a getter, instead |
| `x is not public in Y; cannot be accessed from outside package` | A member with no modifier was used from another package | Make it `public` if it should be usable from outside |
| `toString() in X cannot override toString() in Object ... attempting to assign weaker access privileges; was public` | Your `toString()` is less visible than the `public` one it replaces | Add `public` |
| `non-static variable this cannot be referenced from a static context` | In a `void main()` file, you created an object inside a `static` method | Remove `static` from that method |
| `compact source file should not have package declaration` | A `void main()` file has a `package` line | Delete it, and keep the main file in the top folder |
| `cannot access X ... file does not contain class X ... correct subdirectory of the sourcepath` | `X.java` has a package line that doesn't match its folder | Delete the package line, or move the file into the matching folder |

## Launcher errors (when running `java File.java`)

| Error message | What it means | Fix |
|---|---|---|
| `no class declared in source file` | The file you ran is empty | Write the code, or run the right file |
| `can't find main(String[]) or main() method in class: X` | The file you ran has no `main` | Run the file that has `main`, for example `java BankDemo.java`, not `java BankAccount.java` |

## Runtime errors (exceptions)

| Error | What it means | Fix |
|---|---|---|
| `InputMismatchException` | `Scanner.nextInt()` got input that isn't a number | Check with `hasNextInt()` first, or give the right input |
| `NullPointerException` | You used a reference that is `null`, for example by calling a method on it | Make sure it points to an object first |

## VS Code

| Message | What it means | Fix |
|---|---|---|
| `The declared package "" does not match the expected package "practice24Oct"` | VS Code picked a different top folder than the terminal does | See "If VS Code complains about the package" in `FilesAndPackagesDocs.md` |
