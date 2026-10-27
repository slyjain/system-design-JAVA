# Interfaces (and when to use an abstract class instead)

`abstract` classes are covered in `InheritanceDocs.md`. This file is about interfaces and choosing between the two.

## The first-principles idea

Inheritance answers "what **is** this?" (a savings account *is a* bank account). An interface answers "what **can** this do?":

> An interface is a promise of methods, with no data. Any class, from any family, can sign it.

A savings account and a fixed deposit aren't the same kind of thing. A fixed deposit can't be withdrawn from, so it shouldn't extend `BankAccount`. But both *can earn interest*. An interface captures exactly that one ability:

```java
interface InterestBearing {
    void addInterest();          // automatically public and abstract
}

class SavingsAccount extends BankAccount implements InterestBearing { ... }
class FixedDeposit implements InterestBearing { ... }   // not a BankAccount at all

List<InterestBearing> items = ...;   // holds both
for (InterestBearing i : items) i.addInterest();
```

The loop doesn't know or care what the objects really are. It only relies on the promise. That's also the clean fix for Concept 3's experiment a: instead of `instanceof`, keep the things that earn interest in a list of `InterestBearing`.

## C++ comparison

| Idea | C++ | Java |
|---|---|---|
| Interface | a class with only pure virtual functions, by convention | a real keyword: `interface` |
| Sign it | `class A : public IShape` | `class A implements Shape` |
| Several of them | multiple inheritance (with the diamond problem) | `implements A, B, C`. No diamond problem for data, because interfaces have no fields |
| Interface extends interface | inheritance | `interface B extends A` |
| Default behaviour | a virtual function with a body | a `default` method |

## The rules, and why they exist

- **Every method is automatically `public`.** A promise that nobody outside can see is useless. So the implementing method must also be `public`, or you get "weaker access privileges".
- **Fields are automatically `public static final`, so they're constants.** An interface has no data of its own; it can't hold state for each object.
- **No constructors, no `new`.** There's nothing to build, only a promise.
- **`default` methods** have a body. They exist so an interface can get a new method later without breaking every class that already implements it. If two interfaces give the same default method, you must override it and choose (`A.super.m()`).
- **`static` methods** are helpers that belong to the interface, like `List.of(...)`.
- **One abstract method means a lambda can implement it.** Such an interface is a *functional interface*: `Notifier n = msg -> System.out.println(msg);`. Lambdas come later, in Stage 3.

## Interface or abstract class?

| Question | Interface | Abstract class |
|---|---|---|
| Relationship | "can do" (a capability) | "is a" (a family) |
| Fields for each object | no | yes |
| Constructors | no | yes |
| How many per class | any number | exactly one parent |
| Shared code | only `default` methods, which can't use fields | normal methods, which can use fields |

Rule of thumb: **start with an interface.** Use an abstract class when several classes really are one family and share state and code (like `BankAccount` with its balance and account number). They combine well: an abstract class can implement an interface and leave some methods for its subclasses.

## Program to an interface

You already did this: `List<BankAccount> accounts = new ArrayList<>();`. The variable's type is the promise (`List`), and only the `new` mentions the real class. To switch to `LinkedList`, you change one word, and nothing else in the code notices.

The same idea for your own classes: a class that needs to send messages should depend on a `Notifier` interface, not on `EmailNotifier`. Whoever creates the class passes in the real notifier, usually through the constructor. This is called *dependency injection*. It gives you two things:

- **Swapping without editing:** console today, SMS tomorrow. The class using the notifier never changes.
- **Testing:** pass in a fake notifier that just records the messages, then check them. No real emails get sent.

This is the "D" of SOLID (Dependency Inversion): depend on promises (interfaces), not on concrete classes.
