# Interfaces (and when to use an abstract class instead)

`abstract` classes are covered in `InheritanceDocs.md`. This file is about interfaces and choosing between the two.

## The first-principles idea

Inheritance answers "what **is** this?" (a savings account *is a* bank account). An interface answers "what **can** this do?":

> An interface describes a contract that classes from different families can implement. It cannot declare per-instance fields.

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
| Several of them | multiple inheritance (with the diamond problem) | `implements A, B, C`. Interfaces don't add per-instance fields; conflicting default methods still need resolving |
| Interface extends interface | inheritance | `interface B extends A` |
| Default behaviour | a virtual function with a body | a `default` method |

## The rules, and why they exist

- **Abstract interface methods are implicitly `public`.** The implementing method must also be `public`, or you get "weaker access privileges". Interfaces can also have private helper methods (Java 9+).
- **Fields are automatically `public static final`.** They are shared, not per-object. `final` prevents reassignment; an object referenced by a field can still be mutable.
- **No constructors.** You can't instantiate an interface directly with `new Notifier()`, but an implementing object can be created, including with an anonymous class or lambda.
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
| Shared code | `default`, `static`, and private helper methods; no instance fields | normal methods, which can use instance fields |

Rule of thumb: **start with an interface.** Use an abstract class when several classes really are one family and share state and code (like `BankAccount` with its balance and account number). They combine well: an abstract class can implement an interface and leave some methods for its subclasses.

## Program to an interface

You already did this: `List<BankAccount> accounts = new ArrayList<>();`. The variable's type is the promise (`List`), and only the `new` mentions the real class. To switch to `LinkedList`, you change one word, and nothing else in the code notices.

The same idea for your own classes: a class that needs to send messages should depend on a `Notifier` interface, not on `EmailNotifier`. Whoever creates the class passes in the real notifier, usually through the constructor. This is called *dependency injection*. It gives you two things:

- **Swapping without editing:** console today, SMS tomorrow. The class using the notifier never changes.
- **Testing:** pass in a fake notifier that just records the messages, then check them. No real emails get sent.

This is the "D" of SOLID (Dependency Inversion): depend on promises (interfaces), not on concrete classes.

## Lambdas: a short implementation of a functional interface

`Notifier` has one abstract method, `send(String)`, so it is a functional interface. In `Notifier shout = msg -> System.out.println(msg.toUpperCase());`, Java uses the target type `Notifier` to know that `msg` is a `String` and the body implements `send`. Default and static methods do not count as abstract methods. The lambda supplies an object usable as a `Notifier`; it is not a bare function or the interface itself.

Creating the lambda or passing it to `LowBalanceChecker` doesn't execute the body. The body runs when the checker calls `send`, for example when checking an account with a negative balance.

## Composition and the Strategy idea

Inheritance puts a withdrawal rule in a subclass's overridden method. With composition, an account **has a** `WithdrawalPolicy`: `addDebit` asks that object whether a withdrawal is allowed. Different policy implementations can express a minimum balance or an overdraft.

This separates account data from the rule, and lets different accounts use different policies without a subclass for every combination. A policy can also combine two rules, allowing a withdrawal only if both agree. Changing a policy after construction is possible only if the account is designed to permit replacement; it must validate that the new rule remains compatible with the current balance. This pattern is called **Strategy**.
