# @conform-to/zod

> [Zod](https://github.com/colinhacks/zod) schema resolver for [conform](https://github.com/edmundhung/conform)

<!-- aside -->

## API Reference

- [resolve](#resolve)
- [ifNonEmptyString](#ifNonEmptyString)
<!-- /aside -->

### resolve

This resolves zod schema to a conform schema:

```tsx
import { useForm, useFieldset } from '@conform-to/react';
import { resolve } from '@conform-to/zod';
import { z } from 'zod';

// Define the schema with zod
const schema = resolve(
  z.object({
    email: z.string(),
    password: z.string(),
  })
);

// When used with `@conform-to/react`:
function ExampleForm() {
  const formProps = useForm({
    // Validating the form with the schema
    validate: schema.validate
    onSubmit: event => {
      // Read the FormData from the from
      const payload = new FormData(e.target);

      // Parse the data against the zod schema
      const submission = schema.parse(payload);

      // It could be accepted / rejected / modified
      console.log(submission.state);

      // Parsed value (Only if accepted)
      console.log(submission.data);

      // Structured form value
      console.log(submission.form.value);

      // Structured form error (only if rejected)
      console.log(submission.form.error);
    };
  })
  const [setupFieldset, { email, password }] = useFieldset({
    // Optional: setup native constraint inferred from the schema
    constraint: schema.constraint
  });

  // ...
}
```

Or parse the request payload on server side (e.g. Remix):

```tsx
import { resolve } from '@conform-to/zod';
import { z } from 'zod';

const schema = resolve(
  z.object({
    // Define the schema with zod
  }),
);

export let action = async ({ request }) => {
  const formData = await request.formData();
  const submission = schema.parse(formData);

  // Return the current form state if not accepted
  if (submission.state !== 'accepted') {
    return json(submission.form);
  }

  // Do something else
};

export default function ExampleRoute() {
  const formState = useActionData();

  // You can then use formState.value / formState.error
  // to populate inital value of each fields with
  // the intital error
}
```

### ifNonEmptyString

As `zod` does not have specific logic for handling form data, there are some common cases need to be handled by the users. For example,

1. it does not treat empty string as invalid for a requried field
2. it has no type coercion support (e.g. '1' -> 1)

The zod schema resolver currently does an extra cleanup step to transform empty string to undefined internally. But users are still required to do convert the data to their desired type themselves.

```tsx
import { z } from 'zod';
import { resolve, ifNonEmptyString } from '@conform-to/zod';

const schema = resolve(
  z.object({
    // No preprocess is needed for string as empty string
    // is already converted to undefined by the resolver
    text: z.string({ required_error: 'This field is required' }),

    // Cast to number manually
    number: z.preprocess(
      ifNonEmptyString(Number),
      z.number({ required_error: 'This field is required' }),
    ),

    // This is how you will do it without the helper
    date: z.preprocess(
      (value) => (typeof value === 'string' ? new Date(value) : value),
      z.date({ required_error: 'This field is required' }),
    ),
  }),
);
```
