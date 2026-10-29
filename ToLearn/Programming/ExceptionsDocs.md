# Exceptions in Java

## What `throw` does (first principles)

- `throw` ends the current method immediately, like `return`. Instead of handing a value back to the caller, it hands back an exception object.
- The exception travels up the call stack: out of the method, out of the method that called it, and so on, until some code catches it with `try`/`catch`.
- If nothing catches it, the program stops and prints the exception with its **stack trace**: the chain of calls it travelled through, newest first.

```
Exception in thread "main" java.lang.IllegalArgumentException: The value credited should be positive
	at BankAccount.addCredit(BankAccount.java:44)
	at BankDemo.deposit(BankDemo.java:20)
	at BankDemo.main(BankDemo.java:11)
```

Read it from the top: thrown in `addCredit` at line 44, which was called by `deposit` at line 20, which was called by `main` at line 11.

## Code after `throw` never runs

- A statement right after `throw` (or `return`) in the same block can never run. Java makes that a compile error, `unreachable statement`, where C++ compilers at most warn.
- So in any given case, a method either throws or returns. Never both.

## Exception or return value?

- **Throw** when the caller broke the method's rules, like depositing -50. A correct caller never asks for that, so it's a bug and should be loud. `IllegalArgumentException` is the standard exception for a bad argument.
- **Return a result**, like `false`, for normal outcomes the caller is expected to handle, like a withdrawal bigger than the balance. That happens to correct programs every day.
- A method named like a question, such as `canDebit`, should answer `true` or `false`, not throw. Questions answer; actions act.

## Catching: `try`/`catch`

```java
try {
    account.addCredit(amount);
} catch (IllegalArgumentException e) {
    System.out.println("rejected: " + e.getMessage());
}
```

- If anything inside `try` throws an exception of that type, Java jumps to the `catch` block, and the program carries on after it. `e.getMessage()` is the text given when the exception was created.
- Catch an exception where you can actually do something about it, like telling the user. Don't wrap everything.

## Checked vs unchecked

| Kind | Examples | Rule |
|---|---|---|
| Checked | `IOException` | The compiler forces you to catch it, or to declare it with `throws` in the method's signature. Used for problems outside the program's control, like a missing file |
| Unchecked | `IllegalArgumentException`, `NullPointerException`, anything extending `RuntimeException` | No `throws` needed (allowed, but optional). Used for programming mistakes |

C++ has no checked exceptions: any function can throw anything without saying so.
