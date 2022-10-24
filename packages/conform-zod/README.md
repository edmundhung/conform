# @conform-to/zod

> [Zod](https://github.com/colinhacks/zod) schema resolver for [conform](https://github.com/edmundhung/conform)

<!-- aside -->

## API Reference

- [getError](#geterror)

<!-- /aside -->

### getError

This resolves the ZodError/SafeParseReturnType to a set of key/value pairs which refers to the name and error of each field.

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
        /**
         *  The result is of type `SafeParseReturnType`.
         *  So either `getError(result)` or `getError(result.error)` would work
         */
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
    // You can extends the schema with async validation as well
    const data = await schema.parseAsync(submission.value);

    if (submission.type !== 'validate') {
      return await handleFormData(data);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      submission.error = submission.error.concat(getError(error));
    } else {
      submission.error = submission.error.concat([
        ['', 'Sorry, something went wrong.'],
      ]);
    }
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
