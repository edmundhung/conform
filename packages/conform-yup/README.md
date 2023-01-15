# @conform-to/yup

> [Conform](https://github.com/edmundhung/conform) helpers for integrating with [Yup](https://github.com/jquense/yup)

<!-- aside -->

## API Reference

- [formatError](#formatError)
- [getFieldsetConstraint](#getfieldsetconstraint)
- [validate](#validate)

<!-- /aside -->

### formatError

This formats Yup **ValidationError** to conform's error structure (i.e. A set of key/value pairs).

If an error is received instead of the Yup **ValidationError**, it will be treated as a form level error with message set to **error.messages**.

```tsx
import { useForm, parse } from '@conform-to/react';
import { formatError } from '@conform-to/yup';
import * as yup from 'yup';

const schema = yup.object({
  email: yup.string().required(),
  password: yup.string().required(),
});

function ExampleForm() {
  const [form] = useForm<yup.InferType<typeof schema>>({
    onValidate({ formData }) {
      const submission = parse(formData);

      try {
        // Only sync validation is allowed on the client side
        schema.validateSync(submission.value, {
          abortEarly: false,
        });
      } catch (error) {
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

    if (submission.type !== 'validate') {
      return await handleFormData(data);
    }
  } catch (error) {
    submission.error.push(...formatError(error));
  }

  return submission;
};

export default function ExampleRoute() {
  const state = useActionData();
  const [form] = useForm({
    mode: 'server-validation',
    state,
  });

  // ...
}
```

### getFieldsetConstraint

This tries to infer constraint of each field based on the yup schema. This is useful for:

1. Making it easy to style input using CSS, e.g. `:required`
2. Having some basic validation working before/without JS.

```tsx
import { useForm } from '@conform-to/react';
import { getFieldsetConstraint } from '@conform-to/yup';
import * as yup from 'yup';

const schema = yup.object({
  email: yup.string().required(),
  password: yup.string().required(),
});

function Example() {
  const [form, { email, password }] = useForm({
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
  const [form] = useForm({
    onValidate({ formData }) {
      return validate(formData, schema);
    },
  });

  // ...
}
```
