# Inheritance and polymorphism

## First principles: why inheritance exists

- **Reuse:** related classes share fields and methods that are written once, in a parent class.
- **Polymorphism:** code written against the parent type works with every subclass, and each subclass can behave in its own way. One loop over a `BankAccount[]` can withdraw from savings and current accounts alike, and each applies its own rule.
- **Use it only for a real "is-a":** a savings account *is a* bank account. For "has-a" (an account *has an* owner), use a field instead; that's called composition. If a subclass can't keep every promise its parent makes, it isn't a real "is-a" (the Liskov Substitution Principle, part of SOLID).

## The one rule to remember

> The variable's type decides what you're allowed to call. The object's type decides which version runs.

With `BankAccount a = new SavingsAccount(...);`:

- `a.addInterest()` doesn't compile. The compiler only looks at the variable's type, and `BankAccount` has no `addInterest`.
- `a.addDebit(600)` uses `SavingsAccount`'s rules, because at run time Java looks at the actual object.
- This also works for calls *inside* the parent: when `BankAccount.addDebit` calls `canDebit`, a savings account's own `canDebit` runs. A parent method that leaves one step to its subclasses like this is the **Template Method** pattern.

Under the hood it's the same as C++'s vtable: each class has a table of its methods, and every call goes through the actual object's table.

## Compared with C++

| | C++ | Java |
|---|---|---|
| Inherit | `class Savings : public Account` | `class Savings extends Account` (`implements` is only for interfaces) |
| Number of parents | several | exactly one class (plus any number of interfaces, Concept 4) |
| Runtime dispatch | only `virtual` methods | every method, unless it's `static`, `private` or `final` |
| Mark an override | `override` (optional) | `@Override` (optional, but always use it) |
| Call the parent's version | `Account::withdraw(x)` | `super.withdraw(x)` |
| Call the parent's constructor | in the initializer list: `Savings(long b) : Account(b) {}` | `super(b);` inside the constructor |
| Abstract method | pure virtual: `= 0` | `abstract` method in an `abstract class` |
| Forbid overriding or extending | `final` | `final` method, `final` class |
| Slicing (copying a subclass object into a parent variable cuts it down) | happens when copying by value | never happens: variables hold references |
| Virtual destructor | needed in base classes | no destructors |

## Constructors

- A subclass constructor must build the parent part first with `super(...)`. If you don't write it, Java inserts `super()` with no arguments, which fails to compile when the parent has no such constructor.
- Since Java 25, checks may come before `super(...)`, as long as they don't use `this`. Older Java, like the camp's Java 11, requires `super(...)` as the very first line.
- A `static` field in the parent is shared with all subclasses: there's still exactly one copy. Savings and current accounts drawing numbers from `BankAccount`'s counter therefore never collide.

## Overriding rules

- Same name and exactly the same parameter types. `Long` and `long` are different types, so `canDebit(long)` doesn't override `canDebit(Long)`; it's a separate method. Copy the parent's signature.
- The return type must be the same, or a subtype for objects. `boolean` doesn't match a parent's `Boolean`.
- It can't be less visible than the parent's version. That's why `toString()` must stay `public`.
- `@Override` above the method makes a misspelled name or wrong parameters a compile error. Without it, Java silently treats the method as a new one, and the parent's version keeps running.
- Overloading (same name, different parameters) is picked at compile time; overriding is picked at run time. Same as C++.

## `protected` and encapsulation

- A subclass can't touch its parent's `private` fields.
- Don't make fields `protected` just to get access: then every subclass can break the parent's invariants. Give subclasses what they need through methods, like a `getBalance()` getter.

## `abstract` classes

- An `abstract class` can't be created with `new`; only its subclasses can. Use it when the parent is a general idea that never exists on its own.
- An `abstract` method has no body, and every non-abstract subclass must override it.
- Unlike an interface (Concept 4), an abstract class can have fields and constructors.
