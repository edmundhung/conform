# Tutorial

In this tutoiral, we will show you how to enhance a login form with Conform.

<!-- aside -->

## On this page

- [Installation](#installation)
- [Initial setup](#initial-setup)
- [Introducing Conform](#introducing-conform)
- [Setting client validation](#setting-client-validation)
- [Enhancing user experience](#enhancing-user-experience)

<!-- /aside -->

## Installation

Before start, please install conform on your project:

```sh
npm install @conform-to/react @conform-to/zod --save
```

## Initial setup

Let's create a basic login form with Remix.

```tsx
import { type ActionArgs, json } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
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

  // Parse the form data
  const payload = Object.fromEntries(formData);
  const result = schema.safeParse(payload);

  if (!result.success) {
    return json({
      payload,
      error: result.error.flatten().fieldErrors,
    });
  }

  return await authenticate(result.data);
}

export default function LoginForm() {
  const result = useActionData<typeof action>();

  return (
    <Form method="post">
      <div>
        <label>Email</label>
        <input type="email" name="email" defaultValue={result?.payload.email} />
        <div>{result?.error.email}</div>
      </div>
      <div>
        <label>Password</label>
        <input
          type="password"
          name="password"
          defaultValue={result?.payload.password}
        />
        <div>{result?.error.password}</div>
      </div>
      <button>Login</button>
    </Form>
  );
}
```

## Introducing Conform

Now, it's time to enhance the login form using Conform.

```tsx
import { report, useForm } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import { type ActionArgs, json } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
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

  // Replace `Object.fromEntries()` with the parse function
  const submission = parse(formData, { schema });

  // Report the submission to client
  // 1) if the intent is not `submit`, or
  // 2) if there is any error
  if (submission.intent !== 'submit' || !submission.value) {
    return json(report(submission));
  }

  return await authenticate(submission.value);
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

## Setting client validation

Server validation might some time be too slow for a good user experience. We can also reuse the validation logic on the client for a instant feedback.

```tsx
import { parse, report, useForm } from '@conform-to/react';
import { type ActionArgs, json } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
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

  if (submission.intent !== 'submit' || !submission.value) {
    return json(report(submission));
  }

  return await authenticate(submission.value);
}

export default function LoginForm() {
  const lastSubmission = useActionData<typeof action>();
  const [form, { email, password }] = useForm({
    lastSubmission,

    // Run the same validation logic on client
    onValidate({ formData }) {
      return parse(formData, { schema });
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

## Enhancing user experience

There is more we can do to enhance the user experience. For example:

- Utilize Conform to manage aria attributes for you by setting a form id
- Customize when to trigger the validation with the `shouldValidate` and `shouldRevalidate` options
- Simplify setup using the `conform` helpers which derives all necessary attributes

```tsx
import { parse, report, useForm } from '@conform-to/react';
import { type ActionArgs, json } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
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

  if (submission.intent !== 'submit' || !submission.value) {
    return json(report(submission));
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

    // Assign an id to the form so Conform can utilize it for aria attributes
    id: 'login',

    // Validate the field once the `blur` event is dispatched from the input
    shouldValidate: 'onBlur',

    // Then, revalidate the field as user types
    shouldRevalidate: 'onInput',
  });

  return (
    <Form method="post" {...form.props}>
      <div>
        <label>Email</label>
        {/* This derives attributes required by the input, such as type, name and default value */}
        <input {...conform.input(email, { type: 'email' })} />
        <div>{email.error}</div>
      </div>
      <div>
        <label>Password</label>
        {/* It also manages id, aria attributes, autoFocus and validation attributes for you! */}
        <input {...conform.input(password, { type: 'password' })} />
        <div>{password.error}</div>
      </div>
      <button>Login</button>
    </Form>
  );
}
```
