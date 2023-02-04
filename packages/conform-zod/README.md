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

### parse

It parses the formData and returns a submission result with the validation error. If no error is found, the parsed data will also be populated as `submission.data`.

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
      return parse(formData, { schema });
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

export let action = async ({ request }) => {
  const formData = await request.formData();
  const submission = await parse(formData, {
    // If you need extra validation on server side
    schema: schema.refine(/* ... */),

    // If the schema definition includes async validation
    async: true,
  });

  if (!submission.data || submission.intent !== 'submit') {
    return submission;
  }

  // ...
};
```
