# @conform-to/zod

> [Zod](https://github.com/colinhacks/zod) schema resolver for [conform](https://github.com/edmundhung/conform)

<!-- aside -->

## API Reference

- [formatError](#formatError)
- [getFieldsetConstraint](#getfieldsetconstraint)
- [validate](#validate)

<!-- /aside -->

### formatError

This formats `ZodError` to the **conform** error structure (i.e. A set of key/value pairs).

If the error received is not provided by Zod, it will be treated as a form level error with message set to **error.messages** or **Oops! Something went wrong.** if no fallback message is provided.

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
  const formProps = useForm<z.infer<typeof schema>>({
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

    if (submission.type === 'submit') {
      return await handleFormData(data);
    }
  } catch (error) {
    submission.error.push(
      // The 2nd argument is an optional fallback message
      ...formatError(
        error,
        'The application has encountered an unknown error.',
      ),
    );
  }

  return submission;
};

export default function ExampleRoute() {
  const state = useActionData();
  const form = useForm({
    mode: 'server-validation',
    state,
  });

  // ...
}
```

### getFieldsetConstraint

This tries to infer constraint of each field based on the zod schema. This is useful only for:

1. Make it easy to style input using CSS, e.g. `:required`
2. Have some basic validation working before/without JS. But the message is not customizable and it might be simpler and cleaner relying on server validation.

```tsx
import { getFieldsetConstraint } from '@conform-to/zod';

function LoginFieldset() {
  const { email, password } = useFieldset(ref, {
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
  const formProps = useForm({
    onValidate({ formData }) {
      return validate(formData, schema, {
        // Optional
        fallbackMessage: 'The application has encountered an unknown error.',
      });
    },
  });

  // ...
}
```
