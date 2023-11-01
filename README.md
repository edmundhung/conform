# CONFORM [![latest release](https://img.shields.io/github/v/release/edmundhung/conform?display_name=tag&sort=semver&style=flat-square&labelColor=333&color=000)](https://github.com/edmundhung/conform/releases) [![GitHub license](https://img.shields.io/github/license/edmundhung/conform?style=flat-square&labelColor=333&color=000)](https://github.com/edmundhung/conform/blob/main/LICENSE)

A progressive enhancement first form validation library for Remix and React Router

### Highlights

- Progressive enhancement first APIs
- Automatic type coercion with Zod
- Simplifed integration through event delegation
- Field name inference
- Focus management
- Accessibility support
- About 5kb compressed

### Quick Start

Here is an example built with Remix:

```tsx
import { useForm } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import { Form, useActionData } from '@remix-run/react';
import { json } from '@remix-run/node';
import { z } from 'zod';
import { authenticate } from '~/auth';

const schema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Email is invalid'),
  password: z.string({ required_error: 'Password is required' }),
});

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const submission = parse(formData, { schema });

  if (!submission.value || submission.intent !== 'submit') {
    return json(submission);
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
