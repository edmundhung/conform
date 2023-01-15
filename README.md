# CONFORM [![latest release](https://img.shields.io/github/v/release/edmundhung/conform?display_name=tag&sort=semver&style=flat-square&labelColor=000&color=2a4233)](https://github.com/edmundhung/conform/releases) [![GitHub license](https://img.shields.io/github/license/edmundhung/conform?style=flat-square&labelColor=000&color=2a4233)](https://github.com/edmundhung/conform/blob/main/LICENSE)

A progressive enhancement first form validation library for [Remix](https://remix.run)

### Highlights

- Make your form progressively enhanced by default [[?]](https://codesandbox.io/s/github/edmundhung/conform/tree/main/examples/remix-run?initialpath=/todos&file=/app/routes/todos.tsx "Try it with JS disabled")
- Simplifed intergration through event delegation [[?]](https://conform.guide/integrations "Learn more")
- Server first validation [[?]](https://conform.guide/validation "Learn more")
- Field name inference with type checking [[?]](https://conform.guide/configuration "Learn more")
- Focus management [[?]](https://conform.guide/focus-management "Learn more")
- Accessibility support [[?]](https://conform.guide/accessibility "Learn more")
- About 4kb compressed [[?]](https://bundlephobia.com/package/@conform-to/react "Check the size on bundlephobia")

### Quickstart

Here is a real world example built with [Remix](https://remix.run) and validating using [Zod](https://zod.dev).

```tsx
import { useForm, parse } from '@conform-to/react';
import { validate, formatError } from '@conform-to/zod';
import { Form } from '@remix-run/react';
import { json, redirect } from '@remix-run/node';
import { useId } from 'react';
import { z } from 'zod';
import { login } from '~/auth';

const schema = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const submission = parse(formData);

  try {
    const data = schema.parse(submission.value);

    if (submission.type === 'submit') {
      const user = await login(data);

      if (!user) {
        throw new Error(
          'Sign-in failed. The email or password provided is not correct.',
        );
      }

      return redirect('/');
    }
  } catch (error) {
    submission.error.push(...formatError(error));
  }

  return json(submission);
}

export default function LoginForm() {
  const state = useActionData<typeof action>();
  const id = useId();
  const [form, { email, password }] = useForm<z.infer<typeof schema>>({
    id,
    state,
    onValidate({ formData }) {
      return validate(formData, schema);
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
        <label htmlFor={email.config.id}>Password</label>
        <input {...conform.input(password.config)} />
        <div id={email.config.errorId}>{password.error}</div>
      </div>
      <button type="submit">Login</button>
    </Form>
  );
}
```
