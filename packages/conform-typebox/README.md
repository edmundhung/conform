# @conform-to/typebox

> [Conform](https://github.com/edmundhung/conform) helpers for integrating with [typebox](https://github.com/sinclairzx81/typebox)

<!-- aside -->

## API Reference

- [getFieldsetConstraint](#getfieldsetconstraint)
- [parse](#parse)

<!-- /aside -->

### getFieldsetConstraint

This tries to infer constraint of each field based on the typebox schema. This is useful for:

1. Making it easy to style input using CSS, e.g. `:required`
2. Having some basic validation working before/without JS.

```tsx
import { useForm } from '@conform-to/react';
import { getFieldsetConstraint } from '@conform-to/typebox';
import { Type } from '@sinclairzx81/typebox';

const schema = Type.Object({
  email: Type.String(),
  password: Type.String(),
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
import { parse } from '@conform-to/typebox';
import { Type } from '@sinclairzx81/typebox';

const schema = Type.Object({
  email: Type.String(),
  password: Type.String(),
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
import { useForm } from '@conform-to/react';
import { parse } from '@conform-to/typebox';
import { Type } from '@sinclairzx81/typebox';

const schema = Type.Object({
  // Define the schema with typebox
});

export async function action({ request }) {
  const formData = await request.formData();
  const submission = parse(formData, {
    schema,
  });

  if (submission.intent !== 'submit' || !submission.value) {
    return submission;
  }

  // ...
}
```
