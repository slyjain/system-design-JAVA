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

## Keep imports clean

- Editors can add imports automatically while you type, for example `java.lang.reflect.Array` when you meant `Arrays`.
- Delete the ones you don't use. They mislead readers, and some, like `java.util.stream.Gatherer` (Java 24 and later only), break the file on older Java.

## Learning mode vs serious mode

- **Learning mode** (practice folders like `practice24Oct`): focus on the concept. Shortcuts like `double` for money and assuming the input is valid are fine.
- **Serious mode** (LLD camp assignments, real projects): strict review of correctness, edge cases, naming, design principles, error handling and thread safety, the way a senior engineer would review it.

## Learning commands

See `CommandsDocs.md`.
