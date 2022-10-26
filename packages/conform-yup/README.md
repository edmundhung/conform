# @conform-to/yup

> [Yup](https://github.com/jquense/yup) schema resolver for [conform](https://github.com/edmundhung/conform)

<!-- aside -->

## API Reference

- [formatError](#formatError)

<!-- /aside -->

### formatError

This formats Yup `ValidationError` to the **conform** error structure (i.e. A set of key/value pairs).

If the error received is not provided by Yup, it will be treated as a form level error with message set to **error.messages** or **Oops! Something went wrong.** if no fallback message is provided.

```tsx
import { useForm } from '@conform-to/react';
import { formatError } from '@conform-to/yup';
import * as yup from 'yup';

// Define the schema with yup
const schema = yup.object({
  email: yup.string().required(),
  password: yup.string().required(),
});

function ExampleForm() {
  const formProps = useForm<yup.InferType<typeof schema>>({
    onValidate({ form, submission }) {
      try {
        // Only sync validation is allowed on the client side
        schema.validateSync(submission.value, {
          abortEarly: false,
        });
      } catch (error) {
        submission.error = submission.error.concat(
          // The 2nd argument is an optional fallback message
          formatError(
            error,
            'The application has encountered an unknown error.',
          ),
        );
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
import { formatError } from '@conform-to/yup';
import * as yup from 'yup';

const schema = yup.object({
  // Define the schema with yup
});

export let action = async ({ request }) => {
  const formData = await request.formData();
  const submission = parse(formData);

  try {
    // You can extends the schema with async validation as well
    const data = await schema.validate(submission.value, {
      abortEarly: false,
    });

    if (submission.context !== 'validate') {
      return await handleFormData(data);
    }
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      submission.error = submission.error.concat(formatError(error));
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
