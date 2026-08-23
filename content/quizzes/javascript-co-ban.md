---
id: javascript-co-ban
title: JavaScript Fundamentals
description: Test your understanding of JavaScript data types, arrays, functions, and asynchronous behavior.
tags:
  - javascript
  - beginner
published: true
---

# JavaScript Fundamentals

## q1

### Question

What does the JavaScript expression `typeof null` return?

### Options

- [ ] A. `"null"`
- [ ] B. `"object"`
- [ ] C. `"undefined"`
- [ ] D. `"number"`

### Answer

B

### Explanation

`null` is a primitive value, but `typeof null` returns `"object"`. This historical behavior remains for backward compatibility.

## q2

### Question

Which method adds one or more items to the **end** of an array and returns the new array length?

### Options

- [ ] A. `shift()`
- [ ] B. `unshift()`
- [ ] C. `push()`
- [ ] D. `pop()`

### Answer

C

### Explanation

`push()` adds items to the end of an array. `pop()` removes the last item, `shift()` removes the first item, and `unshift()` adds items to the beginning.

## q3

### Question

Given this code:

```js
const values = [1, 2, 3];
const doubled = values.map((value) => value * 2);
```

What is the value of `doubled`?

### Options

- [ ] A. `[1, 2, 3]`
- [ ] B. `[2, 3, 4]`
- [ ] C. `[2, 4, 6]`
- [ ] D. `6`

### Answer

C

### Explanation

`map()` creates a new array by applying its callback to every item. Each value is doubled, producing `[2, 4, 6]`.

## q4

### Question

Which keyword declares a block-scoped binding that **cannot be reassigned**?

### Options

- [ ] A. `var`
- [ ] B. `let`
- [ ] C. `const`
- [ ] D. `static`

### Answer

C

### Explanation

`const` creates a block-scoped binding that cannot be reassigned. Objects and arrays stored in that binding can still be mutated unless they are frozen separately.

## q5

### Question

What type of value does a function declared with `async` always return?

### Options

- [ ] A. `Promise`
- [ ] B. `Array`
- [ ] C. `Generator`
- [ ] D. `Callback`

### Answer

A

### Explanation

An `async` function always returns a `Promise`. A regular return value is automatically wrapped in a fulfilled Promise.

## q6

### Question

Which comparison operator checks both **value** and **type** without coercion?

### Options

- [ ] A. `==`
- [ ] B. `=`
- [ ] C. `!=`
- [ ] D. `===`

### Answer

D

### Explanation

`===` performs strict equality. Two operands are equal only when they have the same type and value, so `1 === "1"` is `false`.
