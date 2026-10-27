# Task: interest and alerts with interfaces (Concept 4)

Concepts behind this task: `InterfacesDocs.md`.

## Setup

From `system-design/`, copy your Concept 3 classes here and open this folder in its own VS Code window:

```
cp practice26Oct/{BankAccount,SavingsAccount,CurrentAccount}.java practice27Oct/
code practice27Oct
```

The `{a,b,c}` part is *brace expansion*: the shell turns it into three separate paths before `cp` runs. Check what it expands to with `echo practice26Oct/{BankAccount,SavingsAccount}.java`.

## Part 1: a capability shared by unrelated classes

### `InterestBearing.java`

An interface with one method, `addInterest()`.

### Changes

- `SavingsAccount` implements `InterestBearing`.
- New class **`FixedDeposit`**. It is **not** a `BankAccount`, because you can't withdraw from it. It implements `InterestBearing`.

| | `FixedDeposit` |
|---|---|
| Opened with | an owner, an amount and an interest rate in percent. Reject an amount of 0 or less and a negative rate |
| Interest | the same rule as savings |
| Printed as | `FixedDeposit (Meera): amount 5000, interest 7%` |

## Part 2: depend on an interface, not a concrete class

### `Notifier.java`

An interface with one method: `send(String message)`.

### Two implementations

- **`ConsoleNotifier`** prints the message with a `[ALERT]` prefix.
- **`RecordingNotifier`** doesn't print. It stores every message in a `List<String>` and has a getter for that list. This is the kind of fake used in tests.

### `LowBalanceChecker.java`

- It receives a `Notifier` in its constructor and keeps it in a `private final` field. It must never mention `ConsoleNotifier` or `RecordingNotifier`.
- `check(BankAccount account)` sends `Account 1002 is below zero: -1600` if the balance is negative, and does nothing otherwise.

## `InterfacesDemo.java`

1. Create Samyak's savings account (1000 at 4%), Ravi's current account (1000, overdraft 2000), and Meera's fixed deposit (5000 at 7%).
2. Withdraw 2600 from Ravi's account.
3. Put Samyak's account and Meera's deposit in a `List<InterestBearing>`, call `addInterest()` on each in a loop, then print both.
4. Make a `LowBalanceChecker` with a `ConsoleNotifier` and check both bank accounts.
5. Make a second `LowBalanceChecker` with a `RecordingNotifier`, check both accounts, then print how many messages were recorded.

Expected output:

```
Savings 1001 (Samyak): balance 1040, interest 4%
FixedDeposit (Meera): amount 5350, interest 7%
[ALERT] Account 1002 is below zero: -1600
recorded 1 message(s)
```

## Experiments (guess the result first, then try)

- **a.** Remove `public` from `addInterest()` in `FixedDeposit`.
- **b.** Add `int MAX_RATE = 20;` to `InterestBearing`, then try `InterestBearing.MAX_RATE = 30;` in the demo.
- **c.** Try `new Notifier()`.
- **d.** Give both `Notifier` and `InterestBearing` the method `default String describe() { return "..."; }`, with different text, and make one class implement both. What does Java say, and how do you fix it?
- **e.** In the demo, write `Notifier shout = msg -> System.out.println(msg.toUpperCase());` and pass it to a `LowBalanceChecker`. Why does that compile when you never wrote a class?
- **f.** Think: in Concept 3, each account type changed the withdrawal rule by *overriding* `canDebit`. What if instead a `BankAccount` received a `WithdrawalPolicy` interface in its constructor, the way `LowBalanceChecker` receives a `Notifier`? What could you do then that inheritance can't do? (Hint: change an account's rule after it's created, or combine rules.)
