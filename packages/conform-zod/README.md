# @conform-to/zod

> [Zod](https://github.com/colinhacks/zod) schema resolver for [conform](https://github.com/edmundhung/conform)

## API Reference

- [resolve](#resolve)

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
    // Inferring the constraint with the schema
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
