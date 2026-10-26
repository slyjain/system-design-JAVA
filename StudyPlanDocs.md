# Study plan: Java + LLD

Goal: learn Java (coming from C++) and Low-Level Design, with concurrency along the way. No fixed schedule: we move to the next part when the current one is done.

## How each topic is studied

1. A lesson from first principles, compared with C++.
2. A practice task you write yourself, in a dated practice folder.
3. Experiments: guess the result first, then try it.
4. A review: lenient in learning mode, strict in serious mode.
5. Anything worth keeping goes into a `*Docs.md` file in `ToLearn/`, without repeating information.
6. When you've understood a part, you move it into the same-named file in `Learned/`. Each piece of information lives in exactly one of the two, and a doc name like `InheritanceDocs.md` means whichever of the two files holds that part.

## Stage 1: Java concepts (current)

| # | Concept | Status | Where |
|---|---|---|---|
| 1 | Types and references (primitives vs objects) | Done, one leftover (below) | `practice24Oct/copyingVariable.java`, `PrimitivesVsObjectsDocs.md` |
| 2 | Classes and objects (constructors, `static`, `final`, encapsulation, invariants) | Done | `practice24Oct/BankAccount*`, `ClassesAndObjectsDocs.md`, `DesignPrinciplesDocs.md` |
| 3 | Inheritance and polymorphism | **Now** | `practice26Oct/AccountTypesTask.md`, `InheritanceDocs.md` |
| 4 | Interfaces and abstract classes | Next | |
| 5 | Collections (`List`, `Map`, `Set`) and generics. Practice: a `Bank` class that owns all accounts | | |
| 6 | Exceptions | Started | `ExceptionsDocs.md` |
| 7 | Concurrency: threads, `synchronized`, atomics, executors. Practice: break `BankAccount` with two threads, then fix it | | |

## Stage 2: LLD camp week-1 assignment (serious mode)

After Concept 4. Three SOLID refactors in `lld-camp-week1-assignment/Java`:

- `InvoiceSRPOCP.java`: Single Responsibility and Open/Closed
- `MediaLSTIsp.java`: Liskov Substitution and Interface Segregation
- `NotifyDIPOCP.java`: Dependency Inversion and Open/Closed

Its Dockerfile uses Java 11: use classic `public static void main(String[] args)`, and no newer features like `void main()` files or `record`.

## Stage 3: Java toolkit

- Enums, records, `Optional`
- Lambdas and streams, `Comparable` and `Comparator`
- Maven or Gradle, and tests with JUnit 5
- UML class diagrams (Mermaid): association, aggregation, composition, inheritance

## Stage 4: Design principles

SOLID in depth, DRY/KISS/YAGNI, composition over inheritance, programming to interfaces.

## Stage 5: Design patterns

- First: Strategy, Factory, Singleton, Observer, Builder
- Then: Decorator, Adapter, State, Command, Chain of Responsibility, Template Method, Facade
- Later: Composite, Proxy, Iterator, Abstract Factory, Visitor, Mediator, Memento

For each: the problem it solves, its class diagram, write it from memory, then find it in the JDK.

## Stage 6: LLD problems

Approach for each: requirements → main methods → classes → relationships → what might change → code → test edge cases → discuss extensions.

- **Easy:** Tic-Tac-Toe, Snake & Ladder, Parking Lot, Vending Machine, Library Management
- **Medium:** LRU Cache, Logger, Elevator, ATM, Splitwise, Notification Service, Rate Limiter, in-memory Key-Value Store
- **Hard:** BookMyShow (concurrent seat booking), Chess, Uber, Food Delivery, Pub-Sub queue, Stock Exchange order book

## Small leftovers

- Concept 1, step 5: fix `src/main.java` (`Integer x` should be `int`, and the `nextInt()`/`nextLine()` newline trap).
- The practice exercise at the end of `InputOutputDocs.md`: sum of `n` numbers, once with `Scanner` and once with `BufferedReader`.
- LeetCode 1603 (Design Parking System), if not done yet.
- Optional extra practice: the Exercism Java track.
