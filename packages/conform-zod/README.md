# @conform-to/zod

> [Conform](https://github.com/edmundhung/conform) helpers for integrating with [Zod](https://github.com/colinhacks/zod)

<!-- aside -->

## API Reference

- [formatError](#formatError)
- [getFieldsetConstraint](#getfieldsetconstraint)
- [validate](#validate)

<!-- /aside -->

### formatError

This formats **ZodError** to conform's error structure (i.e. A set of key/value pairs).

If an error is received instead of the ZodError, it will be treated as a form level error with message set to **error.messages**.

```tsx
import { useForm, parse } from '@conform-to/react';
import { formatError } from '@conform-to/zod';
import { z } from 'zod';

// Define the schema with zod
const schema = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

function ExampleForm() {
  const [form] = useForm<z.infer<typeof schema>>({
    onValidate({ formData }) {
      // Only sync validation is allowed on the client side
      const submission = parse(formData);

      try {
        schema.parse(submission.value);
      } catch (error) {
        /**
         * The `formatError` helper simply resolves the ZodError to
         * a set of key/value pairs which refers to the name and
         * error of each field.
         */
        submission.error.push(...formatError(error));
      }

      return submission;
    },
  });

  // ...
}
```

Or when validating the formData on server side (e.g. Remix):

```tsx
import { useForm, parse } from '@conform-to/react';
import { formatError } from '@conform-to/zod';
import { z } from 'zod';

const schema = z.object({
  // Define the schema with zod
});

export let action = async ({ request }) => {
  const formData = await request.formData();
  const submission = parse(formData);

  try {
    const data = await schema.parseAsync(submission.value);

    if (submission.intent === 'submit') {
      return await handleFormData(data);
    }
  } catch (error) {
    submission.error.push(...formatError(error));
  }

  return submission;
};
```

### getFieldsetConstraint

This tries to infer constraint of each field based on the zod schema. This is useful for:

1. Making it easy to style input using CSS, e.g. `:required`
2. Having some basic validation working before/without JS

```tsx
import { useForm } from '@conform-to/react';
import { getFieldsetConstraint } from '@conform-to/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

function Example() {
  const [form, { email, password }] = useForm({
    constraint: getFieldsetConstraint(schema),
  });

  // ...
}
```

### validate

It parses the formData and returns a [submission](/docs/submission.md) object with the validation error, which removes the boilerplate code shown on the [formatError](#formaterror) example.

```tsx
import { useForm } from '@conform-to/react';
import { validate } from '@conform-to/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

function ExampleForm() {
  const [form, { email, password }] = useForm({
    onValidate({ formData }) {
      return validate(formData, schema);
    },
  });

  // ...
}
```
