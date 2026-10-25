# Task: BankAccount and BankDemo

## What the program models

A tiny bank. People open accounts, put money in and take money out. The bank numbers the accounts automatically and knows how many have been opened.

## The two files and their jobs

- **`BankAccount.java`** is one bank account. It remembers its data and enforces the rules. It never prints anything (see "Keep printing out of your core classes" in [EngineeringHabitsDocs.md](../EngineeringHabitsDocs.md)).
- **`BankDemo.java`** is the customer. Its `main` opens accounts, calls their methods and prints what happened.

## BankAccount

### What each account remembers

| Data | Rule |
|---|---|
| Account number | Given automatically when the account is opened: 1001, 1002, 1003 and so on. Never changes |
| Owner's name | Set when the account is opened. Never changes |
| Balance | Starts at the opening amount, or 0. Changes only through deposit and withdraw |

Shared by the whole class, not stored per account: how many accounts have been opened.

### What you can do with an account

| Action | Rule | Returns |
|---|---|---|
| Open with an owner's name | The balance starts at 0 | a new account |
| Open with an owner's name and an opening amount | The balance starts at that amount. A negative amount: throw `IllegalArgumentException` | a new account |
| Deposit an amount | An amount of 0 or less is a caller bug: throw `IllegalArgumentException`. Otherwise the balance goes up | `true` |
| Withdraw an amount | An amount of 0 or less: throw `IllegalArgumentException`. More than the balance is a normal outcome: refuse it. Otherwise the balance goes down | `true` if done, `false` if refused |
| Read the number, the owner or the balance | Getters only, no setters | the value |
| Ask how many accounts exist | Asked on the class, not on one account | the count |
| Print the account | Text like `Account 1001 (Samyak): balance 500.0` | the text, through `toString()` |

### Invariants: what must always be true

- The balance is never negative.
- Each account number is unique and never changes.
- The owner never changes.

What an invariant is, and why it's the reason for `private` fields: [ClassesAndObjectsDocs.md](../ClassesAndObjectsDocs.md).

## BankDemo: the scenario to run

Do these steps in order and print the result of each:

1. Open an account for Samyak with no money, and print it.
2. Open an account for Ravi with 1000, and print it.
3. Deposit 500 into Samyak's account.
4. Withdraw 2000 from Ravi's account.
5. Deposit -50 into Samyak's account.
6. Withdraw 300 from Ravi's account.
7. Print both accounts again.
8. Print how many accounts were opened.

`BankDemo.java` runs exactly these steps. Once `BankAccount` is correct, it prints this (whole numbers, because the balance is stored as a `long`):

```
Account 1001 (Samyak): balance 0
Account 1002 (Ravi): balance 1000
deposit 500 into 1001: true
withdraw 2000 from 1002: false
deposit -50 into 1001: rejected (<your exception message>)
withdraw 300 from 1002: true
Account 1001 (Samyak): balance 500
Account 1002 (Ravi): balance 700
Accounts opened: 2
```

### Edge cases to try next

- Withdraw exactly the whole balance: allowed, and the balance becomes `0`.
- Deposit 0, withdraw 0 or withdraw -5: rejected with an `IllegalArgumentException`.
- Open a third account: it gets 1003, and the count becomes 3.

## Experiments (guess the result first, then try)

- **a.** From `main`, change the balance field directly.
- **b.** Inside a `BankAccount` method, change the account number.
- **c.** Write `BankAccount b = a;`, deposit into `b`, then print `a`.
- **d.** Open two accounts with the same owner and balance, and compare them with `.equals()`.
- **e.** Comment out `toString()` and print an account.

## What serious mode would change

- **Money:** store whole paise or cents in a `long`, or use `BigDecimal`, because `double` has rounding errors (see the decimal-number trap in [InputOutputDocs.md](../InputOutputDocs.md)).
- **Thread safety:** two withdrawals at the same moment can both pass the balance check and overdraw the account (Concept 7).
