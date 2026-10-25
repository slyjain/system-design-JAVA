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
- `const` becomes `final`: it can be assigned only once. A `final` field must be set by the end of every constructor.
- A `final` reference is like C++'s `T* const p`: it can't point to another object, but the object itself can still change.
- There are no `const` methods. To make an object unchangeable, use `private final` fields and no setters; that's how `String` works.

**Constructors and `this`**

- There's no initializer list: assign the fields in the constructor body.
- `this` is a reference, not a pointer: `this.name`, not `this->name`. You need it when a parameter has the same name as a field, because the parameter hides the field.
- One constructor can call another with `this(...)` at the top.
- If you write no constructor, Java adds an empty one (`javap -p` shows it). Once you write any constructor, that empty one is gone.

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

## Getters and setters

- Naming: `getScore()`, `setName(...)`, and `isActive()` for booleans.
- Only add the setters that make sense. A bank account shouldn't have `setBalance`: the only allowed ways to change the balance are `deposit` and `withdraw`.

## The BankAccount exercise: what serious mode would change

The practice version uses shortcuts that are fine for learning. In real code:

- **Money:** store whole paise or cents in a `long`, or use `BigDecimal`, because `double` has rounding errors (see the decimal-number trap in `InputOutputDocs.md`).
- **Bad input:** reject it with exceptions (Concept 6) instead of assuming it's valid.
- **Thread safety:** if two ATMs withdraw from the same account at the same moment, both can succeed and overdraw it (Concept 7).

Keeping printing out of `BankAccount` is covered in `EngineeringHabitsDocs.md`.
