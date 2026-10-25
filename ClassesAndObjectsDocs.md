# Classes and objects in Java

Where classes can live (in the same file as `void main()`, in their own files, in packages) is in `FilesAndPackagesDocs.md`.

## The same class in C++ and Java

Both versions were compiled and run, and print the same output.

C++:

```cpp
class Player {
private:
    static int count;
    const string name;
    int score;

public:
    Player(string name, int score) : name(name), score(score) { count++; }
    Player(string name) : Player(name, 0) {}

    string getName() const { return name; }
    int getScore() const { return score; }
    void addPoints(int points) { score += points; }
    static int getCount() { return count; }

    friend ostream& operator<<(ostream& os, const Player& p) {
        return os << "Player " << p.name << ": " << p.score;
    }
};

int Player::count = 0;
```

Java (`Player.java`):

```java
class Player {
    private static int count = 0;
    private final String name;
    private int score;

    Player(String name, int score) {
        this.name = name;
        this.score = score;
        count++;
    }

    Player(String name) {
        this(name, 0);
    }

    String getName() {
        return name;
    }

    int getScore() {
        return score;
    }

    void addPoints(int points) {
        score += points;
    }

    static int getCount() {
        return count;
    }

    @Override
    public String toString() {
        return "Player " + name + ": " + score;
    }
}
```

Using it:

| C++ | Java |
|---|---|
| `Player a("Ravi");` | `Player a = new Player("Ravi");` |
| `Player* b = new Player("Asha", 10);` | `Player b = new Player("Asha", 10);` |
| `a.addPoints(5);` | `a.addPoints(5);` |
| `cout << a << '\n';` | `IO.println(a);` |
| `cout << Player::getCount() << '\n';` | `IO.println(Player.getCount());` |
| `delete b;` | nothing to do |

## What's different from C++

**Shape of a class**

- Everything goes inside the class, including each method's full code. There's no `.h`/`.cpp` split and no `;` after the closing brace.
- The access modifier goes on each member. There are no `public:` sections and no `friend`.
- Every class automatically inherits from `Object`, which gives it `toString()` and `equals()`. C++ has no shared base class.
- `bool` is `boolean`, and `string` is `String` (capitalized because it's a class).

**Fields, `static` and `final`**

- Fields can get their starting value where they're declared, including `static` fields, so there's no separate `int Player::count = 0;`.
- A `static` member belongs to the class: one copy shared by all objects. Use it through the class name, like `Player.getCount()`. Static methods have no `this`.
- **Static or not? Ask: "is this a fact about the whole class, or about one object?"** How many accounts exist is about all accounts, so it's `static`. An account's number is about one account, so it's a normal field. A `static` account number means every account shares one number: the last one handed out.
- **Trap:** Java accepts `this.x` even when `x` is `static`, so the code looks per-object while it changes the one shared copy. `javac -Xlint:all` warns about it (`static variable should be qualified by type name`), and VS Code underlines it in yellow.
- A `static` field that changes, like a set of used account numbers, is shared by the whole program: you can't have two separate banks, and one test's accounts affect the next. Fine for learning. In serious code, prefer an object that owns that state (see "Each invariant needs an owner" below).
- `const` becomes `final`: it can be assigned only once. A `final` field must be set by the end of every constructor.
- A constant (`static final` with a fixed value) is named in UPPER_SNAKE_CASE, like `FIRST_ACCOUNT_NUMBER`. A named constant says what a bare number like `1001` means.
- A `final` reference is like C++'s `T* const p`: it can't point to another object, but the object itself can still change.
- There are no `const` methods. To make an object unchangeable, use `private final` fields and no setters; that's how `String` works.

**Constructors and `this`**

- There's no initializer list: assign the fields in the constructor body.
- `this` is a reference, not a pointer: `this.name`, not `this->name`. You need it when a parameter has the same name as a field, because the parameter hides the field.
- One constructor can call another with `this(...)` at the top.
- If you write no constructor, Java adds an empty one (`javap -p` shows it). Once you write any constructor, that empty one is gone.
- **Rejecting bad input:** a constructor can't return `false`. It either finishes, and the object exists, or it throws an exception, and no object is created: `throw new IllegalArgumentException("why");`. C++ constructors signal failure the same way. Exceptions in depth are Concept 6.

**Objects and memory**

- Objects are only created with `new`, and the variable holds a reference to the object (see `PrimitivesVsObjectsDocs.md`).
- There are no destructors and no `delete`. The garbage collector frees the memory.

**Printing and comparing**

- `operator<<` becomes `toString()`, which `println` calls automatically. It must be `public`, because it's `public` in `Object` and an overriding method can't be less visible.
- `@Override` above a method says "I'm replacing an inherited method", like C++'s `override`. A misspelled method name then becomes a compile error instead of a silent bug.
- `equals()` by default only checks whether two variables point to the same object, like `==`. To compare contents, you override it (Collections concept).

## Access modifiers

| Modifier | C++ | Java |
|---|---|---|
| `private` | this class only | same as C++ |
| `public` | everyone | same as C++ |
| `protected` | this class and its subclasses | this class, its subclasses, **and the same package** |
| none | `private` in a class, `public` in a struct | **package-private**: every class in the same package |

**LLD rule:** make fields `private` and give access through methods. This is called **encapsulation**.

**Why (first principles): invariants.** An invariant is a fact that must always be true for every object, whatever methods anyone calls, for example "a balance is never negative". If the fields were public, any code anywhere could break it. With private fields, the class's own methods are the only way in, so the class alone can guarantee its invariants.

**Each invariant needs an owner.** A rule about one object ("a balance is never negative") belongs in that object's class. A rule about many objects ("no two accounts share a number") can't be checked by one account, because an account doesn't know the others exist. It belongs to whatever holds all of them, like a `Bank` class, or it disappears if the class generates the numbers itself.

## Getters and setters

- Naming: `getScore()`, `setName(...)`, and `isActive()` for booleans.
- A setter that could break an invariant shouldn't exist. A bank account has no `setBalance`, because `deposit` and `withdraw` are the only changes that keep the balance valid.
