# @conform-to/zod

> [Zod](https://github.com/colinhacks/zod) schema resolver for [conform](https://github.com/edmundhung/conform)

<!-- aside -->

## API Reference

- [getError](#geterror)

<!-- /aside -->

### getError

This formats the received error to a set of key/value pairs which refers to the name and error of each field. If the value provided is not an ZodError or Error, the fallback message will be used.

```tsx
import { useForm } from '@conform-to/react';
import { getError } from '@conform-to/zod';
import { z } from 'zod';

// Define the schema with zod
const schema = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

function ExampleForm() {
  const formProps = useForm<z.infer<typeof schema>>({
    onValidate({ form, submission }) {
      // Only sync validation is allowed on the client side
      const result = schema.safeParse(submission.value);

      if (!result.success) {
        submission.error = submission.error.concat(getError(result.error));
      }

      setFormError(form, submission);
    },
  });

  // ...
}
```

Or when validating the formData on server side (e.g. Remix):

```tsx
import { useForm, parse } from '@conform-to/react';
import { getError } from '@conform-to/zod';
import { z } from 'zod';

const schema = z.object({
  // Define the schema with zod
});

export let action = async ({ request }) => {
  const formData = await request.formData();
  const submission = parse(formData);

  try {
    const data = await schema.parseAsync(submission.value);

    if (typeof submission.type === 'undefined') {
      return await handleFormData(data);
    }
  } catch (error) {
    submission.error = submission.error.concat(
      // The 2nd argument is an optional fallback message
      getError(error, 'The application has encountered an unknown error.'),
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
