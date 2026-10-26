# Common errors and what they mean

## How to read an error

- Fix the **first** error first. One mistake can cause several errors after it.
- The `^` shows where Java noticed the problem. The real mistake is often just before that point, for example a missing `;` at the end of the previous line.
- Read warnings too: VS Code's yellow underlines, or `javac -Xlint:all`. The code still compiles, but warnings often point at real bugs.

## Compiler warnings (from `javac -Xlint:all`)

| Warning | What it means | Fix |
|---|---|---|
| `[static] static variable should be qualified by type name, X, instead of by an expression` | You used a `static` field through `this` or an object, so it looks per-object but is shared by all objects | Ask whether it should be `static` at all. If yes, write `X.field`. If it's really per object, remove `static` |

## Compile errors (from `javac` or `java File.java`)

| Error message | What it means | Fix |
|---|---|---|
| `variable x might not have been initialized` | You read a local variable before giving it a value, or a constructor ends without setting a `final` field (the `^` then points at the constructor's closing `}`) | Assign the local first. Fields get default values, locals don't. Set every `final` field in every constructor |
| `variable x not initialized in the default constructor` | A `final` field has no value, and the class has no constructor to set it | Write a constructor that sets it, or give it a value where it's declared |
| `';' expected` | A statement or declaration is missing its `;`, for example `package io` | Add the `;` where the `^` points, or at the end of the line before |
| `<identifier> expected` | Java expected a name, for example after an unfinished `package ` line | Finish the line, or delete it |
| `unreachable statement` | A statement comes right after `return`, `throw`, `break` or `continue` in the same block, so it can never run | Delete it, or move it before the jump |
| `illegal start of expression` | Java expected an expression but found something else, for example an empty `if()` | Complete it, like the condition inside `if (...)` |
| `cannot find symbol` | A name Java doesn't know: a typo, a missing import, or a method the variable's type doesn't have (like a subclass-only method called through a parent-type variable) | Fix the spelling, or add the import (only `void main()` files import common classes automatically). For a subclass method, use a variable of the subclass type |
| `constructor X in class X cannot be applied to given types`, or `no suitable constructor found for X(...)` | The arguments don't match any constructor. In a subclass, often a missing `super(...)`: Java then calls the parent's no-argument constructor, which may not exist | Pass the right arguments. In a subclass, call `super(...)` with what the parent needs |
| `interface expected here` | `implements` was used with a class | Use `extends` for a class. `implements` is only for interfaces |
| `X is abstract; cannot be instantiated` | You used `new` on an abstract class | Create one of its subclasses instead |
| `m() in A cannot override m() in B ... overridden method is final` | The parent marked that method `final` | Don't override it, or remove `final` if overriding should be allowed |
| `m() in X does not override or implement a method from a supertype` | `@Override` is on a method that matches no parent method, usually a typo in the name or the parameters | Fix the name or parameters to match the parent's method |
| `cannot assign a value to final variable x` | You tried to change a `final` field or variable after it was set | Don't change it. If it really must change, it shouldn't be `final` |
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
| `IllegalArgumentException: ...` | Code rejected an argument on purpose. The message after the colon says why | Pass a valid value, or catch it with `try`/`catch` (see `ExceptionsDocs.md`) |
| `InputMismatchException` | `Scanner.nextInt()` got input that isn't a number | Check with `hasNextInt()` first, or give the right input |
| `NullPointerException` | You used a reference that is `null`: you called a method on it, or did math with a `null` `Integer` or `Long`. The message names the culprit, like `because "BankAccount.count" is null` | Make it point to an object first. For numbers, use `int` or `long`, which can't be `null` |

## VS Code

| Message | What it means | Fix |
|---|---|---|
| `The declared package "" does not match the expected package "practice24Oct"` | VS Code picked a different top folder than the terminal does | See "If VS Code complains about the package" in `FilesAndPackagesDocs.md` |
