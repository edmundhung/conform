# CONFORM [![latest release](https://img.shields.io/github/v/release/edmundhung/conform?display_name=tag&sort=semver&style=flat-square&labelColor=000&color=2a4233)](https://github.com/edmundhung/conform/releases) [![GitHub license](https://img.shields.io/github/license/edmundhung/conform?style=flat-square&labelColor=000&color=2a4233)](https://github.com/edmundhung/conform/blob/main/LICENSE)

A progressive enhancement first form validation library for [Remix](https://remix.run)

### Highlights

- Progressively enhanced by default
- Simplifed intergration through event delegation
- Server first validation with Zod / Yup schema support
- Field name inference with type checking
- Focus management
- Accessibility support
- About 4kb compressed

### Quick Start

Here is a real world example built with [Remix](https://remix.run).

```tsx
import { useForm, parse } from '@conform-to/react';
import { Form } from '@remix-run/react';
import { json, redirect } from '@remix-run/node';
import { useId } from 'react';
import { authenticate } from '~/auth';

function validate(formData: FormData) {
  const submission = parse(formData);

  if (!submission.value.email) {
    submission.error.push(['email', 'Email is required']);
  } else if (!email.includes('@')) {
    submission.error.push(['email', 'Email is invalid']);
  }

  if (!password) {
    submission.error.push(['password', 'Password is required']);
  }

  return submission;
}

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const submission = validate(formData);

  try {
    if (submission.error.length === 0 && submission.type === 'submit') {
      const user = await authenticate(submission.value);

      if (!user) {
        throw new Error(
          'Sign-in failed. The email or password provided is not correct.',
        );
      }

      return redirect('/');
    }
  } catch (error) {
    submission.error.push(['', error.message]);
  }

  return json(submission);
}

export default function LoginForm() {
  const id = useId();
  const state = useActionData<typeof action>();
  const [form, { email, password }] = useForm({
    id,
    state,
    onValidate({ formData }) {
      return validate(formData);
    },
  });

  return (
    <Form method="post" {...form.props}>
      <div>{form.error}</div>
      <div>
        <label htmlFor={email.config.id}>Email</label>
        <input {...conform.input(email.config)} />
        <div id={email.config.errorId}>{email.error}</div>
      </div>
      <div>
        <label htmlFor={password.config.id}>Password</label>
        <input {...conform.input(password.config)} />
        <div id={password.config.errorId}>{password.error}</div>
      </div>
      <button>Login</button>
    </Form>
  );
}
```
