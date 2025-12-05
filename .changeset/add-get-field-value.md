---
'@conform-to/dom': minor
---

Add `getFieldValue` helper to `@conform-to/dom/future` for type-safe field value retrieval from FormData with runtime type guards.

```ts
import { getFieldValue } from '@conform-to/react/future';

// Direct field access - no type guard
const email = getFieldValue(formData, { name: 'email' }); // returns unknown

// String type guard
const name = getFieldValue(formData, { name: 'name', type: 'string' }); // returns string

// File type guard
const avatar = getFieldValue(formData, { name: 'avatar', type: 'file' }); // returns File

// Object type guard - returns structured data
const address = getFieldValue<Address>(formData, {
  name: 'address',
  type: 'object',
}); // returns { city: unknown; zipcode: unknown }

// Array options (can be combined with type guards)
const tags = getFieldValue(formData, { name: 'tags', array: true }); // returns Array<unknown>
const items = getFieldValue<Item[]>(formData, {
  name: 'items',
  type: 'object',
  array: true,
}); // returns Array<{ name: unknown; count: unknown }>

// FieldName type inference
const user = getFieldValue(formData, {
  name: 'user' as FieldName<{ name: string; email: string }>,
  type: 'object',
}); // returns { name: unknown; email: unknown }
```
