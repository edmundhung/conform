---
'@conform-to/dom': minor
'@conform-to/react': minor
---

feat: custom intents

You can now define a custom intent with `defineIntent()` and register it through `configureForms()` or `useForm()`:

```ts
import { getPathValue, setPathValue } from '@conform-to/dom/future';
import { defineIntent } from '@conform-to/react/future';

const copyField = defineIntent<(options: { from: string; to: string }) => void>(
  {
    parse(options) {
      if (
        typeof options !== 'object' ||
        options === null ||
        typeof options.from !== 'string' ||
        typeof options.to !== 'string'
      ) {
        throw new Error('Invalid copyField arguments');
      }
      return options;
    },
    resolve({ value, payload }) {
      const source = getPathValue(value, payload.from);
      const result = setPathValue(value, payload.to, source);

      return result;
    },
  },
);

const forms = configureForms({
  intents: {
    copyField,
  },
});
```

Once registered, the intent is available from `useForm()` / `useIntent()` just like the built-in intents:

```tsx
const { intent } = forms.useForm();

intent.copyField({
  from: fields.billing.name,
  to: fields.shipping.name,
});
```
