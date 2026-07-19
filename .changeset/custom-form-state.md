---
'@conform-to/react': minor
---

Add custom form state to the future React APIs.

Use `defineCustomState()` to derive state from form intents and submission results, register it through `configureForms()` or `useForm()`, and read the current value from `form.customState`:

```tsx
import { defineCustomState, useForm } from '@conform-to/react/future';

const submitCount = defineCustomState({
  initialize() {
    return 0;
  },
  handleIntent(count, { intent }) {
    return intent.type === 'submit' ? count + 1 : count;
  },
});

const { form } = useForm({
  customState: {
    submitCount,
  },
});

form.customState.submitCount;
```
