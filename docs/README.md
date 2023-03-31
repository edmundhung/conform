# Overview

<!-- lead -->

Conform is a progressive enhancement first form validation library for Remix and React Router.

<!-- /lead -->

<!-- highlights -->

## Its abilities

- Focused on progressive enhancment by default
- Simplifed intergration through event delegation
- Server first validation with Zod / Yup schema support
- Field name inference with type checking
- Focus management
- Accessibility support
- About 5kb compressed
<!-- /highlights -->

[Tutorial &rarr;](/docs/tutorial.md)

[Explore integrations](/docs/integrations.md)

<!-- row -->
<!-- col -->

## Getting started

The code snippet here shows a simple login form supported by Conform in Remix. To get started, copy the code and give it a try. Are you prepared? Let's create your own form with basic techniques which can be gone through in [tutorial](/docs/tutorial.md). Conform is not limited to Remix, more possibilities can be found [here](/docs/integrations.md).

<!-- /col -->

<!-- col sticky=True -->

```tsx
import { useForm } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import { Form } from '@remix-run/react';
import { json } from '@remix-run/node';
import { z } from 'zod';
import { authenticate } from '~/auth';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Email is invalid'),
  password: z.string().min(1, 'Password is required'),
});

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const submission = parse(formData, { schema });

  if (!submission.value || submission.intent !== 'submit') {
    return json(submission, { status: 400 });
  }

  return await authenticate(submission.value);
}

export default function LoginForm() {
  const lastSubmission = useActionData<typeof action>();
  const [form, { email, password }] = useForm({
    lastSubmission,
    onValidate({ formData }) {
      return parse(formData, { schema });
    },
  });

  return (
    <Form method="post" {...form.props}>
      <div>
        <label>Email</label>
        <input type="email" name={email.name} />
        <div>{email.error}</div>
      </div>
      <div>
        <label>Password</label>
        <input type="password" name={password.name} />
        <div>{password.error}</div>
      </div>
      <button>Login</button>
    </Form>
  );
}
```

<!-- /col -->
<!-- /row -->

## Guides

---

<!-- grid -->

### Validation

bla bla bla... if case you want a loop for other cells... then I have to think...

[Read more &raquo;](/docs/validation.md)

### Integrations???

bla bla bla... if case you want a loop for other cells... then I have to think...

[Read more &raquo;](/docs/integrations.md)

### Nested object and Array

bla bla bla... if case you want a loop for other cells... then I have to think...

[Read more &raquo;](/docs/configuration.md)

### Nested object and Array

bla bla bla... if case you want a loop for other cells... then I have to think...

[Read more &raquo;](/docs/configuration.md)

### Intent button

bla bla bla... if case you want a loop for other cells... then I have to think...

[Read more &raquo;](/docs/intent-button.md)

### File upload

bla bla bla... if case you want a loop for other cells... then I have to think...

[Read more &raquo;](/docs/file-upload.md)

### Focus management

bla bla bla... if case you want a loop for other cells... then I have to think...

[Read more &raquo;](/docs/focus-management.md)

### Accessibility

bla bla bla... if case you want a loop for other cells... then I have to think...

[Read more &raquo;](/docs/accessibility.md)

<!-- /grid -->

## Integration

---

<!-- grid type="sdk"-->

### Remix

Do re mi fa so :3 so fa me ra do do do

[Read more &raquo;](/examples/remix)

### React Router

Do re mi fa so :3 so fa me ra do do do

[Read more &raquo;](/examples/react-router)

<!-- /grid -->

## API references

---

<!-- resources -->

### [@conform-to/react](/api/react)

bla bla bla... if case you want a loop for other cells... then I have to think...

### [@conform-to/yup](/api/yup)

bla bla bla... if case you want a loop for other cells... then I have to think...

### [@conform-to/zod](/api/zod)

bla bla bla... if case you want a loop for other cells... then I have to think...

<!-- /resources -->

## UI components

---

<!-- resources -->

### [Chakra UI](/examples/chakra-ui)

......description......

### [Headless UI](/examples/headless-ui)

......description......

[Read more &raquo;

### [Material UI](/examples/material-ui)

......description......

<!-- /resources -->
