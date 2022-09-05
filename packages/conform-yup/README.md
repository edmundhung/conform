# @conform-to/yup

> [Yup](https://github.com/jquense/yup) schema resolver for [conform](https://github.com/edmundhung/conform)

<!-- aside -->

## API Reference

- [resolve](#resolve)
<!-- /aside -->

---

### resolve

It resolves yup schema to a conform schema:

```tsx
import { useForm, useFieldset } from '@conform-to/react';
import { resolve } from '@conform-to/yup';
import * as yup from 'yup';

// Define the schema with yup
const schema = resolve(
  yup.object({
    email: yup.string().required(),
    password: yup.string().required(),
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

      // Parse the data against the yup schema
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
import { resolve } from '@conform-to/yup';
import * as yup from 'yup';

const schema = resolve(
  yup.object({
    // Define the schema with yup
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
