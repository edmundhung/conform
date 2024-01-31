# Overview

Conform is a type-safe form validation library utilizing web fundamentals to progressively enhance HTML Forms with full support for server frameworks like [Remix](https://remix.run) and [Next.js](https://nextjs.org).

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
import { useActionResult, redirect } from './your-server-framework';

// Define a schema for your form
const schema = z.object({
  username: z.string(),
  password: z.string(),
});

// Optional: Server action handler
export async function action({ request }) {
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema });

  // Send the submission back to the client if the status is not successful
  if (submission.status !== 'success') {
    return submission.reply();
  }

  const session = await login(submission.value);

  // Send the submission with addional error message if login fails
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
  const lastResult = useActionResult();
  const [form, fields] = useForm({
    // Configure when each field should be validated
    shouldValidate: 'onBlur',
    // Optional: Required only if you're validating on the server
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
        <label>Username</label>
        <input type="text" name={fields.username.name} />
        <div>{fields.username.errors}</div>
      </div>
      <div>
        <label>Password</label>
        <input type="password" name={fields.password.name} />
        <div>{fields.password.errors}</div>
      </div>
      <button>Login</button>
    </form>
  );
}
```
