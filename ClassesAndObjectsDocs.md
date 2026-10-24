# Classes and objects in Java (in `void main()` files)

## How classes fit into a `void main()` file

- Put your classes in the same file as `void main()`, above or below it. The order doesn't matter, and there are no forward declarations like in C++.
- The file itself becomes a hidden class named after the file, and your classes are nested inside it. In `BankDemo.java`, a class called `Account` is really `BankDemo$Account`.
- To put classes in their own files, see `FilesAndPackagesDocs.md`.

## Shape of a class, compared with C++

- Fields, constructors, and methods with their full code all go inside the class's `{ }`. There's no `.h`/`.cpp` split and no `;` after the closing brace.
- Every class automatically inherits from `Object`, which gives it `toString()` and `equals()`. C++ has no shared base class like this.

## Constructors and `this`

- **Same as C++:** a constructor has the class's name and no return type. If you don't write one, Java adds an empty one. Once you write any constructor, that empty one is gone.
- **No initializer lists:** assign the fields inside the constructor body, like `this.name = name;`.
- **`this` is a reference, not a pointer,** so you write `this.name`, not `this->name`. You need it when a parameter has the same name as a field.
- **One constructor can call another** with `this(...)` at the top, so you don't repeat code.
- **No destructors:** the garbage collector frees objects, and `=` copies the reference, not the object.

## Access modifiers

| Modifier | C++ | Java |
|---|---|---|
| `private` | this class only | same as C++ |
| `public` | everyone | same as C++ |
| `protected` | this class and its subclasses | this class, its subclasses, **and the same package** |
| none | `private` in a class, `public` in a struct | **package-private**: every class in the same package |

- You write the modifier on each member. There are no `public:` sections, and there's no `friend`.
- **LLD rule:** make fields `private` and give access through methods. This is called **encapsulation**.

## `static`

- **Same idea as C++:** a static member belongs to the class and is shared by all objects, so there's one copy for the whole class. Use it through the class name, like `Account.getCount()`.
- **Set its value where you declare it.** There's no separate `int A::count = 0;` outside the class.
- **Static methods have no `this`,** so they can't use the normal (non-static) fields.

## `final` (mostly Java's version of `const`)

- **Set once:** a `final` variable can be assigned only once. A `final` field must be set by the end of the constructor.
- **A `final` reference is like C++'s `T* const p`:** it can't point to a different object, but the object itself can still change.
- **No `const` methods:** to make an object impossible to change, use `private final` fields and no setters. That's how `String` works.

## Getters, setters, `toString()`, `equals()` and `@Override`

- **Naming:** `getBalance()`, `setName(...)`, and `isActive()` for booleans.
- **Only add the setters that make sense.** A bank account shouldn't have `setBalance`: the only allowed ways to change the balance are `deposit` and `withdraw`.
- **`toString()`:** override it to control how your object prints, like overloading `operator<<` in C++. `println` calls it automatically.
- **`equals()`:** by default it only checks whether two variables point to the same object, just like `==`. To compare contents, you override it.
- **`@Override`** on the line above a method tells the compiler "I'm replacing an inherited method." If you misspell the name, you get a compile error instead of a silent bug. It works like C++'s `override` keyword.

## What's different in a `void main()` file

1. **`private` doesn't stop code in the same file.** The whole file is one hidden class, and Java lets any code inside a class use the private fields of classes nested in it. (`a.balance = 999;` in `main` compiles.) Follow the rule yourself; the compiler enforces it once each class has its own file.
2. **`public`, `protected` and no modifier all behave the same here,** for the same reason.
3. **Printing an object without `toString()`** shows something like `BankDemo$Account@3ec300f1`. The `$` means `Account` is nested inside the hidden `BankDemo` class.
4. **"non-static variable this cannot be referenced from a static context":** you created an object inside a method marked `static` outside your classes. Remove the `static`; `main` isn't static in these files.

## The BankAccount exercise: what serious mode would change

The practice version uses shortcuts that are fine for learning. In real code you'd change three things:

- **Money:** store whole paise or cents in a `long`, or use `BigDecimal`. `double` has rounding errors (`0.1 + 0.2` prints `0.30000000000000004`).
- **Bad input:** reject it with exceptions (Concept 6) instead of assuming it's valid.
- **Thread safety:** if two ATMs withdraw from the same account at the same moment, both can succeed and overdraw it (Concept 7).

For the design rule about keeping printing out of `BankAccount`, see `EngineeringHabitsDocs.md`.
