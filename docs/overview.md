# Overview

Conform is a **type-safe** form validation library utilizing web fundamentals to progressively enhance HTML Forms with full support for server frameworks like [Remix route action](https://remix.run/docs/en/main/discussion/data-flow#route-action) and [Next.js server actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations).

## Features

- Progressive enhancement first APIs
- Type-safe field inference
- Fine-grained subscription
- Built-in accessibility helpers
- Automatic type coercion with Zod

## The Gist

Conform gives you control over the form submission lifecycle from client to the server and exposes the form state through the `useForm()` hook. It does not restrict your form's markup and works with any valid HTML form. The form value will be captured from the DOM using the [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData) Web API and is synced through event delegation.

```tsx
import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { z } from 'zod';
import { login } from './your-auth-library';
import { useYourActionResult, redirect } from './your-server-framework';

// Define a schema for your form
const schema = z.object({
  username: z.string(),
  password: z.string(),
});

// Optional: Server action handler
export async function action({ request }) {
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema });

  // Send the result back to the client if the submission is not successful
  if (submission.status !== 'success') {
    return submission.reply();
  }

  const session = await login(submission.value);

  if (!session) {
    return submission.reply({
      formErrors: ['Incorrect username or password'],
    });
  }

  return redirect('/dashboard');
}

// Client form component
export default function LoginForm() {
  // Grap the last submission result if you have defined a server action handler
  // This could be `useActionData()` or `useFormState()` depending on the framework
  const lastResult = useYourActionResult();
  const [form, { username, password }] = useForm({
    // Configure when each field should be validated
    shouldValidate: 'onBlur',
    // Optional: Needed only if you're validating on the server
    lastResult,
    // Optional: Client validation. Fallback to server validation if not provided
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
  });

  return (
    <form method="post" id={form.id} onSubmit={form.onSubmit}>
      <div>{form.errors}</div>
      <div>
        <label htmlFor={username.id}>Username</label>
        <input type="text" id={username.id} name={username.name} />
        <div>{username.errors}</div>
      </div>
      <div>
        <label htmlFor={password.id}>Password</label>
        <input type="password" id={password.id} name={password.name} />
        <div>{password.errors}</div>
      </div>
      <button>Login</button>
    </form>
  );
}
```
