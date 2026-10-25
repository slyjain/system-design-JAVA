# Engineering habits

## Build in small steps

- Write a little, run it, and repeat.
- **Why:** when something breaks, the bug is almost certainly in the few lines you just wrote. Each run cuts down where you have to look, a bit like binary search for bugs.

## Keep printing out of your core classes

- A class like `BankAccount` stores data, enforces the rules and returns results, such as `true` or `false`. The code that uses it (`main`, a REST controller, a UI) decides what to print or send.
- **Why:** the same class can then be reused in a console app, a web app or a REST API, and you can test it without reading console output. It's the same idea as keeping business logic out of Express route handlers.
- **LLD name:** the Single Responsibility Principle (SRP). A class should have one reason to change.

## Name things after what they do

- A method called `getLength` should get a length. If it changes a value, its name should say so.
- Good names matter a lot in LLD, because other people read your design through its names.
- If one variable needs two names to describe it, it's doing two jobs. `count` used as both "how many accounts exist" and "the last account number" breaks as soon as numbers must start at 1001. Split it.
  - A **count** answers "how many exist?" It can go down, for example when an account is closed.
  - An **ID** answers "which one is this?" It must only go up and never be reused. Otherwise a new account could get a closed account's number, and their records would mix.
  - So keep a separate "next ID" counter that only increases. SQL auto-increment IDs work the same way: deleting a row lowers `COUNT(*)`, but the deleted ID is never handed out again.

## Keep imports clean

- Editors can add imports automatically while you type, for example `java.lang.reflect.Array` when you meant `Arrays`.
- Delete the ones you don't use. They mislead readers, and some, like `java.util.stream.Gatherer` (Java 24 and later only), break the file on older Java.

## Print what actually happened

- In a demo or a test, print the real values and results: the number `getAccountNumber()` returns, the `true` or `false` a method returned. Never print hand-written text of what you expect.
- Do the action first, store its result, then print it. A print statement shouldn't hide an action inside it.
- **Why:** hand-written text can't catch bugs. A demo printing the literal `"deposit 500 into 1001: true"` says that even when the account number is really 0.

## Make wrong calls hard to write

- Two parameters of the same type side by side, like `(Long balance, Long accountNumber)`, can be swapped by the caller without any compiler error. `new BankAccount("Samyak", 1001L, 0L)` creates account 0 with a balance of 1001.
- Remove the chance where you can. If the class assigns account numbers itself, there's no number parameter to swap, and no two accounts can end up with the same number.

## Check everything before changing anything

- If a constructor or method can fail, do all the checks first, and change state only after they pass.
- **Why:** a failure halfway through leaves things half-changed, for example `count` increased for an account that was never created.

## Fail loudly, with a useful message

- When something can't be done, tell the caller: return `false` or throw an exception (which one: `ExceptionsDocs.md`). Never just `return` and do nothing; the caller then believes it worked, and the bug hides.
- Put the bad value in the message, like `Opening balance can't be negative: -5`, so whoever reads it knows what went wrong without a debugger.

## Don't repeat yourself (DRY)

- When the same few lines appear several times with small changes, move them into one method with parameters, like `deposit(account, amount)` in `BankDemo`.
- **Why:** a fix or a change then happens in one place instead of in every copy.

## Delete dead code instead of commenting it out

- Code you no longer need, like a commented-out `// return false;`, should be deleted.
- **Why:** commented-out code makes readers wonder whether it matters, and it goes out of date. Git already keeps every old version: `git log -p file` shows them.

## Keep generated files out of git

- Commit the source (`.java`), not what's built from it (`.class`). Built files can always be recreated, go out of date, and make diffs and merges noisy.
- List them in a `.gitignore` file, like `*.class`. Files git already tracks must also be untracked once with `git rm --cached`, which removes them from git but keeps them on disk.

## Learning mode vs serious mode

- **Learning mode** (practice folders like `practice24Oct`): focus on the concept. Shortcuts like `double` for money and assuming the input is valid are fine.
- **Serious mode** (LLD camp assignments, real projects): strict review of correctness, edge cases, naming, design principles, error handling and thread safety, the way a senior engineer would review it.

## Learning commands

See `CommandsDocs.md`.
