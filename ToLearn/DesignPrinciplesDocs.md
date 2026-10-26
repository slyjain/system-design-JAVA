# Design principles

## Encapsulation

- **What it is:** an object keeps its data private and offers methods as the only way to read or change it. The data and the code that guards it live together, like a capsule.
- **Analogy:** a bank vault and an ATM. You can't walk into the vault and take cash; that's the private data. You go through the ATM, the public methods, and it checks your PIN and your balance before giving you anything.
- **In Java:** `private` fields, plus methods that check before they change anything.
- **What it buys you:**
  1. The class can guarantee its invariants (next section), because nothing can get around its checks.
  2. The inside can change without breaking callers. Storing the balance as `long` paise instead of `double` rupees only touches `BankAccount`, as long as its methods stay the same.

## Invariants

- **What it is:** a rule that must be true for an object at all times, whenever code outside looks at it, no matter which methods were called. It's the *rule* that never changes, not the data.
- **An invariant isn't a constant.** "The balance is never negative" is an invariant, even though the balance changes all the time.
- **You already know invariants from DSA:**
  - Binary search: "if the target exists, it's between `lo` and `hi`". `lo` and `hi` change every step, and the rule stays true.
  - Binary heap: "every parent is ≤ its children". Push and pop rearrange the array and may break the rule for a moment *inside* the operation, but they fix it before they finish.
  - BST: everything left of a node is smaller, everything right is bigger.
- A class works the same way: a method may break an invariant briefly while it runs, but it must restore it before it returns.

`BankAccount`'s invariants, and what enforces each one:

| Invariant | Enforced by |
|---|---|
| The balance is never negative | `private` balance, deposit and withdraw check before changing it, and there's no `setBalance` |
| The account number never changes | `final` |
| Account numbers are unique | numbers handed out by one counter inside the class |
| The owner never changes | `final` |

`final` enforces exactly one kind of invariant: "this value never changes after construction". Most invariants, like the balance rule, involve values that do change, and only encapsulation can protect them.

## Responsibility: who owns which data and rules

- Each piece of data, and each rule about it, should have exactly one owner: the class that has the information needed to keep it true.
- A rule about one object ("the balance is never negative") belongs in that object's class.
- A rule about many objects ("no two accounts share a number") can't be checked by one account, because an account doesn't know the others exist. It belongs to whatever holds all of them, like a `Bank` class, or it disappears if the class generates the numbers itself.
- **Single Responsibility Principle (SRP):** a class should have one reason to change. For a concrete habit, see "Keep printing out of your core classes" in `EngineeringHabitsDocs.md`.

## How the three fit together

- **Responsibility** decides *who* owns a rule.
- The **invariant** *is* the rule.
- **Encapsulation** is *how* the owner keeps the rule true.
