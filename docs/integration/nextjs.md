# Next.js

Here is a login form example integrating with [Next.js](https://nextjs.org). You can find the full example [here](../../examples/nextjs).

```tsx
// schema.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  remember: z.boolean().optional(),
});
```

```tsx
'use server'; // action.ts

import { redirect } from 'next/navigation';
import { parseWithZod } from '@conform-to/zod';
import { loginSchema } from '@/app/schema';

export async function login(prevState: unknown, formData: FormData) {
  const submission = parseWithZod(formData, {
    schema: loginSchema,
  });

  if (submission.status !== 'success') {
    return submission.reply();
  }

  redirect('/dashboard');
}
```

```tsx
'use client'; // form.tsx

import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { useFormState } from 'react-dom';
import { login } from '@/app/actions';
import { loginSchema } from '@/app/schema';

export function LoginForm() {
  const [lastResult, action] = useFormState(login, undefined);
  const [form, fields] = useForm({
    // Sync the result of last submission
    lastResult,

    // Reuse the validation logic on the client
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: loginSchema });
    },

    // Validate the form on blur event triggered
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
  });

  return (
    <form id={form.id} onSubmit={form.onSubmit} action={action} noValidate>
      <div>
        <label>Email</label>
        <input
          type="email"
          key={fields.email.key}
          name={fields.email.name}
          defaultValue={fields.email.initialValue}
        />
        <div>{fields.email.errors}</div>
      </div>
      <div>
        <label>Password</label>
        <input
          type="password"
          key={fields.password.key}
          name={fields.password.name}
          defaultValue={fields.password.initialValue}
        />
        <div>{fields.password.errors}</div>
      </div>
      <label>
        <div>
          <span>Remember me</span>
          <input
            type="checkbox"
            key={fields.remember.key}
            name={fields.remember.name}
            defaultChecked={fields.remember.initialValue === 'on'}
          />
        </div>
      </label>
      <button>Login</button>
    </form>
  );
}
```
