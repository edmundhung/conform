---
'@conform-to/react': patch
---

Fix unbound-method TypeScript ESLint error by using arrow function syntax for `change`, `focus`, and `blur` methods in the `Control` type and `useInputEvent` return type. This makes the type definitions consistent with the existing `register` property and matches the actual implementation which uses arrow functions.
