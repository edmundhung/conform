# @conform-to/yup

> [Conform](https://github.com/edmundhung/conform) helpers for integrating with [Yup](https://github.com/jquense/yup)

<!-- aside -->

## API Reference

- [getFieldsetConstraint](#getfieldsetconstraint)
- [parse](#parse)

<!-- /aside -->

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

### parse

It parses the formData and returns a submission result with the validation error. If no error is found, the parsed data will also be populated as `submission.value`.

```tsx
import { useForm } from '@conform-to/react';
import { parse } from '@conform-to/yup';
import * as yup from 'yup';

const schema = yup.object({
  email: yup.string().required(),
  password: yup.string().required(),
});

function ExampleForm() {
  const [form] = useForm({
    onValidate({ formData }) {
      return parse(formData, { schema });
    },
  });

  // ...
}
```

Or when parsing the formData on server side (e.g. Remix):

```tsx
import { useForm, report } from '@conform-to/react';
import { parse } from '@conform-to/yup';
import * as yup from 'yup';

const schema = yup.object({
  // Define the schema with yup
});

export async function action({ request }) {
  const formData = await request.formData();
  const submission = parse(formData, {
    // If you need extra validation on server side
    schema: schema.test(/* ... */),

    // If the schema definition includes async validation
    async: true,
  });

  if (!submission.value || submission.intent !== 'submit') {
    return report(submission);
  }

  // ...
}
```
