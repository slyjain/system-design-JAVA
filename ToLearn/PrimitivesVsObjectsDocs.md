# Primitives vs Objects in Java: why copying and comparing work the way they do

## The one idea behind all of it

**A variable is a small box in memory.**

- For a **primitive** (`int`, `double`, `boolean`, ...), the box holds the value itself.
- For an **object** (an array, a String, an Integer and so on), the object lives in a separate area of memory called the heap. The box only holds the object's **address**, like a house address written on a slip of paper.

Memory of `practice24Oct/copyingVariable.java` just before it ends:

```
 STACK: main's variables              HEAP: the objects
 y    [ 0 ]
 arr  [ address A ] ─────────────▶  A: [0, 0, 1, 3, 2, 5]
 brr  [ address B ] ─────────────▶  B: [101010, 0, 1, 3, 2, 5]
 s    [ address C ] ─────────────▶  C: "Samyak"
 t    [ address D ] ─────────────▶  D: "Samyak"
```

## Two rules that explain everything

1. **Java always copies what's in the box.** This happens when you assign with `=` and when you pass something to a method. For a primitive, what gets copied is the value. For an object, it's the address. The object itself is never copied unless you ask, with `Arrays.copyOf` or `clone()`.
2. **`==` compares what's in the boxes.** For primitives, that means comparing the values. For objects, it means comparing the addresses, which asks "is this the same house?" **`.equals()` goes into both houses and compares what's inside.**

## Examples from `practice24Oct/copyingVariable.java`

| What happened | Why |
|---|---|
| `y` stayed `0` after `x = 5` | `y = x` copied the value 0. `x` and `y` are separate boxes. |
| `arr` didn't change when `brr` changed | `copyOf` built a new house (array B) and copied the contents into it. `brr` holds a different address. |
| `y` was still `0` after `getLength(y)` | The method got its own box holding a copy of the value. It changed its copy, and that box was thrown away when the method returned. |
| `brr[0]` became `101010` | The method got a copy of the address, so it went to the same house (array B) and changed it. |
| `s == t` was `false` | Each word read from input becomes a new String object: two houses at two different addresses. |
| `s.equals(t)` was `true` | Both houses contain the same text. |
| `int` 127 == 127 and 128 == 128 were both `true` | For primitives, `==` compares the values. |
| `Integer` 127 == 127 was `true` | Java creates one Integer object for each value from -128 to 127 and reuses it. Both boxes got the address of the same object. |
| `Integer` 128 == 128 was `false` | 128 isn't in that range, so Java made two separate objects at two different addresses. |

## Why Java is designed this way

- **Copying an address is cheap.** An address is only a few bytes, however big the object is. Copying a million-element array on every `=` or method call would be slow, so Java copies an object only when you explicitly ask it to.
- **Method boxes are temporary, but objects can last longer.** Each method call gets fresh boxes on the stack, and they're wiped when the method returns. That's why a method's change to its `int` parameter disappears. Objects live on the heap, so they last as long as some box holds their address. Once nothing points to an object, the garbage collector removes it.
- **Reusing small Integers saves memory.** Small numbers are used all the time, so Java shares one object per value instead of creating new ones. Sharing objects like this is a design pattern called **Flyweight** (it comes up in LLD).
  - String literals written in your code are shared the same way, so `==` on two `"Samyak"` literals is `true`.
  - Don't rely on that, though. Always use `.equals()` for strings.

## Wrapper types: `Integer`, `Long`, `Boolean`

- Every primitive has an object version: `int` and `Integer`, `long` and `Long`, `boolean` and `Boolean`, and so on. Java converts between them automatically.
- **Use the primitive by default.** Use the wrapper only where Java requires an object, like `List<Integer>`, because collections can't hold primitives.
- **A wrapper is an object, so it can be `null`, and a wrapper field starts as `null`, not 0.** Doing math with a `null` wrapper crashes with a `NullPointerException`, for example `private static Integer count;` followed by `count++`.
- `==` on wrappers compares addresses: that's the `Integer` 127 vs 128 result in the table above.

## In C++ terms

- **Object variables:** a Java object variable is like a C++ pointer that Java follows automatically when you use `.`.
- **`==` and `.equals()`:** `s == t` is like comparing two pointers, `p == q`. `s.equals(t)` is like comparing what they point to, `*p == *q`.
- **Passing an array:** this works like `void f(int* z)`. The method can change `z[0]`, but it can't change the caller's pointer.

## Short version to remember

> Primitives hold values, and objects hold addresses.
> Java copies the box, never the house.
> `==` compares boxes, and `.equals()` compares houses.
