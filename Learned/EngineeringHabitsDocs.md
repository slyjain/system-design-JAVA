# Engineering habits

## Build in small steps

- Write a little, run it, and repeat.
- **Why:** when something breaks, the bug is almost certainly in the few lines you just wrote. Each run cuts down where you have to look, a bit like binary search for bugs.

## Keep printing out of your core classes

- A class like `BankAccount` stores data, enforces the rules and returns results, such as `true` or `false`. The code that uses it (`main`, a REST controller, a UI) decides what to print or send.