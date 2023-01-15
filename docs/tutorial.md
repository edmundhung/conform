# Get started

In this tutoiral, we will show you how to build a login form with [Remix](https://remix.run).

<!-- aside -->

## On this page

- [Installation](#installation)
- [Initial setup](#initial-setup)
- [Introducing Conform](#introducing-conform)
- [Sharing validation](#sharing-validation)
- [Removing boilerplates](#removing-boilerplates)

<!-- /aside -->

## Installation

Before start, please install conform's react adapter:

```sh
npm install @conform-to/react
```

## Initial setup

Now, let's put some markup and an action function for our login form:

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

  if (email) {
    error.email = 'Email is required';
  } else if (!email.includes('@')) {
    error.email = 'Email is invalid';
  }

  if (!password) {
    error.password = 'Password is required';
  }

  // Authenticate the user only if no error
  if (!error.email && !error.password) {
    await authenticate(email, password);

    // Simply redirect the user to another page after authentication
    return redirect('/');
  }

  // Send the last submission result back to client
  return json(
    {
      // Never send the password back to client
      value: { email },
      error,
    },
    {
      status: 400,
    },
  );
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
      <button type="submit">Login</button>
    </Form>
  );
}
```

By this point, we have a basic login form working already. It validates the fields on submit and shows errors if failed. Most importantly, it also works without JS!

## Introducing Conform

Then, it's time to introduce the [parse](../packages/conform-react/README.md#parse) helper function and the [useForm](../packages/conform-react/README.md#useform) hook:

```tsx
import { parse, useForm } from '@conform-to/react';
import { type ActionArgs, json } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { authenticate } from '~/auth';

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();

  // Replace `Object.fromEntries()` with parse()
  const submission = parse(formData);

  // The value will now be available as `submission.value`
  if (!submission.value.email) {
    // Define the error as key-value pair instead
    submission.error.push(['email', 'Email is required']);
  } else if (!email.includes('@')) {
    submission.error.push(['email', 'Email is invalid']);
  }

  if (!password) {
    submission.error.push(['password', 'Password is required']);
  }

  // Just check if any error exists
  if (submission.error.length === 0) {
    await authenticate(email, password);

    return redirect('/');
  }

  // Send the last submission back to client
  return json(
    {
      ...submission,
      value: {
        email: submission.value.email,
      },
    },
    {
      status: 400,
    },
  );
}

export default function LoginForm() {
  const result = useActionData<typeof action>();

  // The useForm hook will return everything you need to setup a form
  // including the error and config of each field
  const [form, { email, password }] = useForm({
    initialReport: 'onBlur',
    mode: 'server-validation',
    state: result,
  });

  return (
    <Form method="post" {...form.props}>
      <div>
        <label>Email</label>
        <input
          type="email"
          name="email"
          defaultValue={email.config.defaultValue}
        />
        <div>{email.error}</div>
      </div>
      <div>
        <label>Password</label>
        <input type="password" name="password" />
        <div>{password.error}</div>
      </div>
      <button type="submit">Login</button>
    </Form>
  );
}
```

The login form is getting even better! In addition to the features we mentioned before, it now...

- Validates the fields when you leave the input
- Revalidates it once the value is changed
- Auto focuses on the first invalid field

Note that all the validation are done on server side, which means:

- There is not need to introduce another package to the client bundle for validation (e.g. zod / yup)
- You can have one single place defining all the validation logic

## Sharing validation

Validating fully on the server is cool. However, network latency would be a concern if there is a need to provide instant feedback while user is typing. In this case, you can consider reusing the validation logic on the client as well.

```tsx
import { parse, useForm } from '@conform-to/react';
import { type ActionArgs, json } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { authenticate } from '~/auth';

// Refactor the validation logic to a standalone function
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

  // Parse and validate the formData
  const submission = validate(formData);

  if (submission.error.length === 0) {
    await authenticate(email, password);

    return redirect('/');
  }

  return json(
    {
      ...submission,
      value: {
        email: submission.value.email,
      },
    },
    {
      status: 400,
    },
  );
}

export default function LoginForm() {
  const result = useActionData<typeof action>();
  const [form, { email, password }] = useForm({
    initialReport: 'onBlur',
    state: result,
    onValidate({ formData }) {
      // Run the same validation logic on client side
      return validate(formData);
    },
  });

  return (
    <Form method="post" {...form.props}>
      {/* nothing changed on this part */}
    </Form>
  );
}
```

## Removing boilerplates

Configuring each input is tedious especially when dealing with a complex form. The [conform](../packages/conform-react/README.md#conform) helpers can be used to remove these boilerplates.

It also derives attributes for [accessibility](/docs/accessibility.md#configuration) concerns and helps [focus management](/docs/focus-management.md#focusing-before-javascript-is-loaded) before JS is loaded.

```tsx
import { parse, useForm, conform } from '@conform-to/react';
import { type ActionArgs, json } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { authenticate } from '~/auth';

interface Schema {
  email: string;
  password: string;
}

function validate(formData: FormData) {
  // as shown before
}

export async function action({ request }: ActionArgs) {
  // as shown before
}

export default function LoginForm() {
  const result = useActionData<typeof action>();

  // By providing the schema, it will type check all the fields name
  const [form, { email, password }] = useForm<Schema>({
    initialReport: 'onBlur',
    state: result,
    onValidate({ formData }) {
      // Run the same validation logic on client side
      return validate(formData);
    },
  });

  return (
    <Form method="post" {...form.props}>
      <div>
        <label>Email</label>
        <input {...conform.input(email.config, { type: 'email' })} />
        <div>{email.error}</div>
      </div>
      <div>
        <label>Password</label>
        <input {...conform.input(password.config, { type: 'password' })} />
        <div>{password.error}</div>
      </div>
      <button type="submit">Login</button>
    </Form>
  );
}
```
