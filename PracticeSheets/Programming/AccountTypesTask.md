# Task: account types (inheritance and polymorphism)

## Setup

Your existing work is in `DailyPractice/practice26Oct/`. From `system-design/`, open it with `code DailyPractice/practice26Oct`.

These were the setup commands for an empty folder. **Do not run the copy command again:** it would overwrite your existing `BankAccount.java`. For a new attempt, use a fresh folder instead.

```
cp DailyPractice/practice24Oct/BankAccount.java DailyPractice/practice26Oct/
code DailyPractice/practice26Oct
```

## What the program models

The bank now offers two kinds of accounts. Both are bank accounts, but they have different withdrawal rules.

## What to build

### Changes to `BankAccount` (the parent)

- Add `getBalance()`. Subclasses need to read the balance, but the field stays `private`.
- `addDebit(amount)` throws for an amount of 0 or less (as now), then asks `canDebit(amount)`, and subtracts only if it's allowed.
- `canDebit(amount)` just answers `balance >= amount`, without throwing. Subclasses override this method to change the rule.
- Good moment for the polish items from the last task (`this(...)` in constructors, `long` instead of `Long`, and so on), because other classes now build on this one.

### `SavingsAccount extends BankAccount`

| | Rule |
|---|---|
| Opened with | an owner, an opening balance and an interest rate in percent. Reject a negative rate |
| Withdraw | refused if it would leave less than 500 in the account |
| `addInterest()` | adds balance × rate / 100 through the parent's deposit method. Does nothing when that's 0. Whole numbers, so any fraction is dropped |
| Printed as | `Savings 1001 (Samyak): balance 1040, interest 4%` |

### `CurrentAccount extends BankAccount`

| | Rule |
|---|---|
| Opened with | an owner, an opening balance and an overdraft limit. Reject a negative limit |
| Withdraw | allowed down to minus the overdraft limit: with a limit of 2000, the balance can go as low as -2000 |
| Printed as | `Current 1002 (Ravi): balance -1600, overdraft 2000` |

For the printed text, you can reuse the parent's text with `super.toString()`, or build it from getters.

### `AccountDemo.java`

1. Open a savings account for Samyak with 1000 at 4%, and a current account for Ravi with 1000 and an overdraft limit of 2000.
2. Put both in one `BankAccount[]` array.
3. Loop over the array and withdraw 600 from each account, printing each result. It's the same call, with different rules: savings refuses (1000 − 600 would leave less than 500), current allows it.
4. Withdraw 2000 from Ravi's account. It's allowed: 400 becomes -1600.
5. Add interest to Samyak's account.
6. Loop over the array again and print every account.

Expected output (your wording can differ, but the numbers and results must match):

```
withdraw 600 from 1001: false
withdraw 600 from 1002: true
withdraw 2000 from 1002: true
Savings 1001 (Samyak): balance 1040, interest 4%
Current 1002 (Ravi): balance -1600, overdraft 2000
```

## Experiments (guess the result first, then try)

- **a.** Write `BankAccount a = new SavingsAccount(...)` and call `a.addInterest()`.
- **b.** With the same `a`, call `a.addDebit(600)`. Whose rule runs?
- **c.** In `SavingsAccount`, misspell `canDebit` as `canDebt` and leave out `@Override`. Run step 3 again. Then put `@Override` back.
- **d.** Make `BankAccount` `abstract` and try `new BankAccount("x")`.
- **e.** Mark `canDebit` as `final` in `BankAccount`.
- **f.** Think: `BankAccount` promised "the balance is never negative". Does `CurrentAccount` keep that promise? What could go wrong in code that only knows it has a `BankAccount`?

Concepts behind this task: `InheritanceDocs.md`.
