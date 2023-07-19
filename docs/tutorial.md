# Tutorial

In this tutoiral, we will show you how to enhance a login form with Conform.

<!-- aside -->

## On this page

- [Installation](#installation)
- [Initial setup](#initial-setup)
- [Introducing Conform](#introducing-conform)
- [Enhancing UX with client validation](#enhancing-ux-with-client-validation)

<!-- /aside -->

## Installation

Before start, please install conform on your project:

```sh
npm install @conform-to/react
```

## Initial setup

Let's create a basic login form with Remix.

```tsx
import { type ActionArgs, json } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { authenticate } from '~/auth';

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();

  // Parse the form data
  const { email, password } = Object.fromEntries(formData);

  // Do some basic validation
  const error = {};

  if (!email) {
    error.email = 'Email is required';
  } else if (!email.includes('@')) {
    error.email = 'Email is invalid';
  }

  if (!password) {
    error.password = 'Password is required';
  }

  // Send the submission data back to client if there is any error
  if (error.email || error.password) {
    return json({
      // Never send the password back to client
      value: { email },
      error,
    });
  }

  return await authenticate(email, password);
}

export default function LoginForm() {
  const result = useActionData<typeof action>();

  return (
    <Form method="post">
      <div>
        <label>Email</label>
        <input type="email" name="email" defaultValue={result?.value.email} />
        <div>{result.error.email}</div>
      </div>
      <div>
        <label>Password</label>
        <input type="password" name="password" />
        <div>{result.error.password}</div>
      </div>
      <button>Login</button>
    </Form>
  );
}
```

## Introducing Conform

Now, it's time to enhance the login form using Conform.

```tsx
import { parse, report, useForm } from '@conform-to/react';
import { type ActionArgs, json } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { authenticate } from '~/auth';

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();

  // Replace `Object.fromEntries()` with the parse function
  const submission = parse(formData, {
    // You can also pass a schema instead of a custom resolve function
    // if you are validating using yup or zod
    resolve({ email, password }) {
      const error: Record<String, string> = {};

      if (!email) {
        error.email = 'Email is required';
      } else if (!email.includes('@')) {
        error.email = 'Email is invalid';
      }

      if (!password) {
        error.password = 'Password is required';
      }

      if (error.email || error.password) {
        return { error };
      }

      // Resolve it with a value only if no error
      return {
        value: { email, password },
      };
    },
  });

  // Report the submission to client
  // 1) if the intent is not `submit`, or
  // 2) if there is any error
  if (submission.intent !== 'submit' || !submission.value) {
    return json(report(submission));
  }

  return await authenticate(submission.value.email, submission.value.password);
}

export default function LoginForm() {
  const lastSubmission = useActionData<typeof action>();

  // The `useForm` hook will return everything you need to setup a form
  // including the error and config of each field
  const [form, { email, password }] = useForm({
    // The last submission will be used to report the error and
    // served as the default value and initial error of the form
    // for progressive enhancement
    lastSubmission,

    // Validate the field once the `blur` event is dispatched from the input
    shouldValidate: 'onBlur',
  });

  return (
    <Form method="post" {...form.props}>
      <div>
        <label>Email</label>
        <input type="email" name="email" defaultValue={email.defaultValue} />
        <div>{email.error}</div>
      </div>
      <div>
        <label>Password</label>
        <input type="password" name="password" />
        <div>{password.error}</div>
      </div>
      <button>Login</button>
    </Form>
  );
}
```

Conform will trigger a [server validation](./validation.md#server-validation) to validate each field whenever user leave the input (i.e. `onBlur`). It also focuses on the first invalid field on submit.

## Enhancing UX with client validation

Server validation might some time be too slow to provide a good user experience. We can also reuse the validation logic on the client for a instant feedback.

```tsx
import { parse, report, useForm } from '@conform-to/react';
import { type ActionArgs, json } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { authenticate } from '~/auth';

// Wrapping the parse logic to be reused on both client and server
function parseLoginForm(formData: FormData) {
  return parse(formData, {
    resolve({ email, password }) {
      const error: Record<String, string> = {};

      if (!email) {
        error.email = 'Email is required';
      } else if (!email.includes('@')) {
        error.email = 'Email is invalid';
      }

      if (!password) {
        error.password = 'Password is required';
      }

      if (error.email || error.password) {
        return { error };
      }

      // Resolve it with a value only if no error
      return {
        value: { email, password },
      };
    },
  });
}

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const submission = parseLoginForm(formData);

  if (submission.intent !== 'submit' || !submission.value) {
    return json(report(submission));
  }

  return await authenticate(submission.value.email, submission.value.password);
}

export default function LoginForm() {
  const lastSubmission = useActionData<typeof action>();
  const [form, { email, password }] = useForm({
    lastSubmission,
    shouldValidate: 'onBlur',

    // Run the same validation logic on client
    onValidate({ formData }) {
      return parseFormData(formData);
    },
  });

  return (
    <Form method="post" {...form.props}>
      <div>
        <label>Email</label>
        <input type="email" name="email" defaultValue={email.defaultValue} />
        <div>{email.error}</div>
      </div>
      <div>
        <label>Password</label>
        <input type="password" name="password" />
        <div>{password.error}</div>
      </div>
      <button>Login</button>
    </Form>
  );
}
```
