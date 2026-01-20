---
'@conform-to/react': minor
'@conform-to/zod': minor
'@conform-to/valibot': minor
---

feat: introduce `configureForms` API

A factory function that creates form hooks with custom configuration and full type inference. It replaces `FormOptionsProvider` (now deprecated).

```ts
import { configureForms } from '@conform-to/react/future';
import { getConstraints } from '@conform-to/zod/v3/future';

const { useForm, useField, FormProvider } = configureForms({
  getConstraints,
  shouldValidate: 'onBlur',
  extendFieldMetadata(metadata) {
    return {
      get textFieldProps() {
        return {
          name: metadata.name,
          defaultValue: metadata.defaultValue,
          'aria-invalid': !metadata.valid,
        };
      },
    };
  },
});
```

Features:

- **Schema integration**: Extract HTML constraints via `getConstraints` (zod/valibot)
- **Custom validation**: Provide `isSchema` and `validateSchema` for custom schema libraries
- **UI library integration**: Extend form/field metadata with `extendFormMetadata` and `extendFieldMetadata`
- **Conditional props**: Use `when` helper for shape-specific field properties (e.g., date range pickers)
- **Config reuse**: Spread the returned `config` into another `configureForms` call for customization
