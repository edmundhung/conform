---
'@conform-to/react': minor
---

Formalized staged validation for the future `useForm()` API.

Staged validation lets `onValidate` flush the known validation result immediately while a slower asynchronous check continues:

```tsx
const schema = z.object({
  email: z.string().email('Email is invalid'),
});

const { form } = useForm(schema, {
  onValidate({ schemaValue, error }) {
    if (error.fieldErrors.email) {
      return error;
    }

    return {
      result: error,
      pending: isEmailAvailable(schemaValue.email).then((available) =>
        available
          ? error
          : {
              formErrors: error.formErrors,
              fieldErrors: {
                ...error.fieldErrors,
                email: ['Email is already used'],
              },
            },
      ),
    };
  },
});
```

The `pending` promise replaces rather than merges with `result`, so it should resolve to a full validation result that includes any errors already present in `result`.

This also fixed schema-backed validation where returning `null` from `onValidate` could leave a previous client error displayed.
