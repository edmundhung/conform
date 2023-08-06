# @conform-to/zod

> [Conform](https://github.com/edmundhung/conform) helpers for integrating with [Zod](https://github.com/colinhacks/zod)

<!-- aside -->

## API Reference

- [getFieldsetConstraint](#getfieldsetconstraint)
- [parse](#parse)

<!-- /aside -->

### getFieldsetConstraint

This tries to infer constraint of each field based on the zod schema. This is useful for:

1. Making it easy to style input using CSS, e.g. `:required`
2. Having some basic validation working before/without JS

```tsx
import { useForm } from '@conform-to/react';
import { getFieldsetConstraint } from '@conform-to/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string({ required_error: 'Email is required' }),
  password: z.string({ required_error: 'Password is required' }),
});

function Example() {
  const [form, { email, password }] = useForm({
    constraint: getFieldsetConstraint(schema),
  });

  // ...
}
```

### parse

It parses the formData and returns a submission result with the validation error. If no error is found, the parsed data will also be populated as `submission.value`.

```tsx
import { useForm } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string({ required_error: 'Email is required' }),
  password: z.string({ required_error: 'Password is required' }),
});

function ExampleForm() {
  const [form, { email, password }] = useForm({
    onValidate({ formData }) {
      return parse(formData, {
        schema,
      });
    },
  });

  // ...
}
```

Or when parsing the formData on server side (e.g. Remix):

```tsx
import { useForm } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import { z } from 'zod';

const schema = z.object({
  // Define the schema with zod
});

export async function action({ request }) {
  const formData = await request.formData();
  const submission = await parse(formData, {
    // If you need extra validation on server side
    schema: schema.refine(/* ... */),

    // If the schema definition includes async validation
    async: true,
  });

  if (!submission.value || submission.intent !== 'submit') {
    return submission;
  }

  // ...
}
```

### refine

A helper function to define a custom constraint on a superRefine check. This is mainly used to setup async validation.

```tsx
import { refine } from '@conform-to/zod';

function createSchema(
  intent: string,
  constraints: {
    // The validation will only be implemented on server side
    isEmailUnique?: (email) => Promise<boolean>;
  } = {},
) {
  return z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Email is invalid')
      // Pipe the schema so it runs only if the username is valid
      .pipe(
        z.string().superRefine((email, ctx) =>
          refine(ctx, {
            // It fallbacks to server validation when it returns an undefined value
            validate: () => constraints.isEmailUnique?.(email),
            // This makes it validate only when the user is submitting the form
            // or updating the email
            when: intent === 'submit' || intent === 'validate/email',
            message: 'Email is already used',
          }),
        ),
      ),

    // ...
  });
}
```
