---
id: web-accessibility
title: Web Accessibility
description: Core practices for building interfaces that work with keyboards and assistive technologies.
tags:
  - accessibility
  - frontend
published: true
---

# Web Accessibility

## q1

### Question

Which attribute connects a `<label>` to an `<input>` with `id="email"`?

### Options

- [ ] A. `for="email"`
- [ ] B. `name="email"`
- [ ] C. `target="email"`
- [ ] D. `aria-id="email"`

### Answer

A

### Explanation

In HTML, the label’s `for` attribute must match the input’s `id`. In JSX and React, the corresponding prop is named `htmlFor`.

## q2

### Question

When a button shows only an icon, what is the best way to provide an accessible name?

### Options

- [ ] A. Add `title` to every parent element
- [ ] B. Add an action-focused `aria-label` to the button
- [ ] C. Replace the button with a `<div>`
- [ ] D. Rely only on the icon’s shape

### Answer

B

### Explanation

`aria-label` provides an accessible name when no visible text is present. The label should describe the action, such as `aria-label="Close dialog"`.

## q3

### Question

Which CSS pseudo-class should show a focus ring primarily during keyboard navigation?

### Options

- [ ] A. `:focus-visible`
- [ ] B. `:hover-only`
- [ ] C. `:keyboard`
- [ ] D. `:active-visible`

### Answer

A

### Explanation

`:focus-visible` lets the browser decide when a focus indicator is needed, which is especially useful for keyboard interaction.

## q4

### Question

Why should correct and incorrect states not rely only on green and red colors?

### Options

- [ ] A. Color always makes websites slower
- [ ] B. CSS does not support both colors reliably
- [ ] C. Color-blind users may not distinguish the states
- [ ] D. Screen readers automatically remove colors

### Answer

C

### Explanation

Color should not be the only signal. Pair it with icons, text labels, or shapes so the state remains clear for color-blind users and assistive technologies.
