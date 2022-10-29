# @conform-to/yup

> [Yup](https://github.com/jquense/yup) schema resolver for [conform](https://github.com/edmundhung/conform)

<!-- aside -->

## API Reference

- [formatError](#formatError)
- [getFieldsetConstraint](#getfieldsetconstraint)
- [validate](#validate)

<!-- /aside -->

### formatError

This formats Yup `ValidationError` to the **conform** error structure (i.e. A set of key/value pairs).

If the error received is not provided by Yup, it will be treated as a form level error with message set to **error.messages** or **Oops! Something went wrong.** if no fallback message is provided.

```tsx
import { useForm, parse } from '@conform-to/react';
import { formatError } from '@conform-to/yup';
import * as yup from 'yup';

// Define the schema with yup
const schema = yup.object({
  email: yup.string().required(),
  password: yup.string().required(),
});

function ExampleForm() {
  const formProps = useForm<yup.InferType<typeof schema>>({
    onValidate({ formData }) {
      const submission = parse(formData);

      try {
        // Only sync validation is allowed on the client side
        schema.validateSync(submission.value, {
          abortEarly: false,
        });
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
    submission.error.push(...formatError(error));
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

This tries to infer constraint of each field based on the yup schema. This is useful only for:

1. Make it easy to style input using CSS, e.g. `:required`
2. Have some basic validation working before/without JS. But the message is not customizable and it might be simpler and cleaner relying on server validation.

```tsx
import { getFieldsetConstraint } from '@conform-to/yup';

function LoginFieldset() {
  const form = useForm();
  const { email, password } = useFieldset(ref, {
    ...form.config,
    constraint: getFieldsetConstraint(schema),
  });

  // ...
}
```

### validate

It parses the formData and returns a [submission](/docs/submission.md) object with the validation error, which removes the boilerplate code shown on the [formatError](#formaterror) example.

```tsx
import { useForm } from '@conform-to/react';
import { validate } from '@conform-to/yup';
import * as yup from 'yup';

const schema = yup.object({
  email: yup.string().required(),
  password: yup.string().required(),
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
