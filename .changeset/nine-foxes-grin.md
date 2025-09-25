---
'@conform-to/react': minor
---

Add `schemaValue` property to the `onValidate` callback argument containing the validated value from successful schema validation. This property is `undefined` when no schema is provided or when validation fails.

```ts
const form = useForm({
  schema: z.object({ email: z.string().email() }),
  onValidate({ schemaValue }) {
    if (schemaValue) {
      // Access the validated data: { email: string }
      console.log(schemaValue.email);
    }
  },
});
```
