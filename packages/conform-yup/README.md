# @conform-to/yup

> [Yup](https://github.com/jquense/yup) schema resolver for [conform](https://github.com/edmundhung/conform)

<!-- aside -->

## API Reference

- [getError](#geterror)

<!-- /aside -->

### resolve

This resolves the Yup ValidationError to a set of key/value pairs which refers to the name and error of each field.

```tsx
import { useForm } from '@conform-to/react';
import { getError } from '@conform-to/yup';
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
        if (error instanceof yup.ValidationError) {
          submission.error = submission.error.concat(getError(error));
        } else {
          submission.error = submission.error.concat([
            ['', 'Validation failed'],
          ]);
        }
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
import { getError } from '@conform-to/yup';
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

    if (submission.type !== 'validate') {
      return await handleFormData(data);
    }
  } catch (error) {
    if (error instanceof yup.ValidationError) {
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
