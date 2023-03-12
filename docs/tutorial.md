# Tutorial

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
  if (error.email || error.password) {
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
      <button type="submit">Login</button>
    </Form>
  );
}
```

By this point, we have a basic login form working already. It validates the fields on submit and shows errors if failed. Most importantly, it also works without JS!

## Introducing Conform

Then, it's time to introduce the [parse](/packages/conform-react/README.md#parse) helper function and the [useForm](/packages/conform-react/README.md#useform) hook:

```tsx
import { parse, useForm } from '@conform-to/react';
import { type ActionArgs, json } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { authenticate } from '~/auth';

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  // Replace `Object.fromEntries()` with parse()
  const submission = parse(formData, {
    resolve({ email, password }) {
      const error: Record<String, string> = {};

      if (!email) {
        // Define the error as key-value pair instead
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

  // Send the last submission result back to client if there is any error
  // or if the intent is not `submit`.
  if (!submission.value || submission.intent !== 'submit') {
    return json(
      {
        ...submission,
        // The payload will be used as the default value if the document is reloaded on submit
        payload: {
          email: submission.payload.email,
        },
      },
      {
        status: 400,
      },
    );
  }

  return await authenticate(submission.value.email, submission.value.password);
}

export default function LoginForm() {
  const lastSubmission = useActionData<typeof action>();

  // The useForm hook will return everything you need to setup a form
  // including the error and config of each field
  const [form, { email, password }] = useForm({
    lastSubmission,

    // Now Conform will start validating once user leave the field and
    // revalidate for any changes triggered later
    initialReport: 'onBlur',
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
      <button type="submit">Login</button>
    </Form>
  );
}
```

The login form is getting even better! In addition to the features we mentioned before, it now...

- Validates the fields when you leave the input
- Revalidates it once the value is changed
- Auto focuses on the first invalid field

Note that all the validation are currently done on server side, which means:

- It is not a must to bring in another package to the client bundle for validation (e.g. zod / yup)
- You will have one single place defining all the validation logic

## Sharing validation

Validating fully on the server is cool. However, network latency would be a concern if there is a need to provide instant feedback while user is typing. In this case, you can consider reusing the validation logic on the client as well.

```tsx
import { parse, useForm } from '@conform-to/react';
import { type ActionArgs, json } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { authenticate } from '~/auth';

// Refactor the validation logic to a standalone function
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

      return {
        value: { email, password },
      };
    },
  });
}

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  // Parse and validate the formData
  const submission = parseLoginForm(formData);

  if (!submission.value || submission.intent !== 'submit') {
    return json(
      {
        ...submission,
        payload: {
          email: submission.payload.email,
        },
      },
      {
        status: 400,
      },
    );
  }

  return await authenticate(submission.value.email, submission.value.password);
}

export default function LoginForm() {
  const lastSubmission = useActionData<typeof action>();
  const [form, { email, password }] = useForm({
    lastSubmission,
    initialReport: 'onBlur',
    onValidate({ formData }) {
      // Run the same validation logic on client side
      return parseFormData(formData);
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

Configuring each input is tedious especially when dealing with a complex form. The [conform](/packages/conform-react/README.md#conform) helpers can be used to remove these boilerplates.

It will set the name of the input and also derive attributes for [accessibility](/docs/accessibility.md#configuration) concerns with helps on [focus management](/docs/focus-management.md#focusing-before-javascript-is-loaded) before JS is loaded.

```tsx
import { parse, useForm, conform } from '@conform-to/react';
import { type ActionArgs, json } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { authenticate } from '~/auth';

interface Schema {
  email: string;
  password: string;
}

function parseForm(formData: FormData) {
  // as shown before
}

export async function action({ request }: ActionArgs) {
  // as shown before
}

export default function LoginForm() {
  const lastSubmission = useActionData<typeof action>();

  // By providing the schema, it will type check all the fields name
  const [form, { email, password }] = useForm<Schema>({
    // By providing a form ID, you will enable Conform to generate all necessary ids for aria-attributes
    id: 'login',
    initialReport: 'onBlur',
    lastSubmission,
    onValidate({ formData }) {
      return parseForm(formData);
    },
  });

  return (
    <Form method="post" {...form.props}>
      <div>
        <label>Email</label>
        <input {...conform.input(email, { type: 'email' })} />
        <div>{email.error}</div>
      </div>
      <div>
        <label>Password</label>
        <input {...conform.input(password, { type: 'password' })} />
        <div>{password.error}</div>
      </div>
      <button type="submit">Login</button>
    </Form>
  );
}
```
