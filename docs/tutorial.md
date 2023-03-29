# Tutorial

In this tutoiral, we will show you how to build a login form.

<!-- aside -->

## On this page

- [Installation](#installation)
- [Initial setup](#initial-setup)
- [Introducing Conform](#introducing-conform)
- [Further enhancement](#further-enhancement)

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

  if (!email) {
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
      <button>Login</button>
    </Form>
  );
}
```

By this point, we have a basic login form working already. It validates the fields on submit and shows errors if failed. It also works without JS thanks to progressive enhancement!

## Introducing Conform

Now, it's time to introduce the [parse](/packages/conform-react/README.md#parse) helper function and the [useForm](/packages/conform-react/README.md#useform) hook:

```tsx
import { parse, useForm } from '@conform-to/react';
import { type ActionArgs, json } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { authenticate } from '~/auth';

// Prepare a custom parse function based on your form requirements
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
  // Replace `Object.fromEntries()` with your custom parse function
  const submission = parseLoginForm(formData);

  // Send the last submission result back to client if there is any error
  // or if the intent is not `submit`.
  if (!submission.value || submission.intent !== 'submit') {
    return json(
      {
        ...submission,
        // The payload will be used as the default value
        // if the document is reloaded on form submit
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

The login form is now enhanced with Conform. In addition to the features we mentioned before, it now...

- Runs the same validation on both client and server
- Validates the fields when you leave the input
- Revalidates it if the value is changed again
- Auto focuses on the first invalid field on form submit

## Further enhancement

Our login form example is already working quite well. But there are still things that could be improved, such as accessiblity and focus management before JS is loaded.

```tsx
import { parse, useForm } from '@conform-to/react';
import { Form, useActionData } from '@remix-run/react';

interface Schema {
  email: string;
  password: string;
}

export default function LoginForm() {
  const lastSubmission = useActionData<typeof action>();

  // Conform will type check all the fields name based on the schema
  const [form, { email, password }] = useForm<Schema>({
    // By providing a form ID, you will enable Conform to generate all necessary ids for aria-attributes
    id: 'login',

    // The rest of the config should remains unchanged
    // ...
  });

  return (
    <Form method="post" {...form.props}>
      <div>
        <label htmlFor={emai.id}>Email</label>
        {/* The `autoFocus` attribute instruct browser to focus on the first invalid input before js is loaded */}
        <input
          type="email"
          name={email.name}
          defaultValue={email.defaultValue}
          autoFocus={Boolean(email.initialError)}
          aria-invalid={email.error ? true : undefined}
          aria-describedby={email.errorId}
        />
        <div id={email.errorId}>{email.error}</div>
      </div>
      <div>
        <label htmlFor={password.id}>Password</label>
        <input
          type="password"
          id={password.id}
          name={password.name}
          autoFocus={Boolean(password.initialError)}
          aria-invalid={password.error ? true : undefined}
          aria-describedby={password.errorId}
        />
        <div id={password.errorId}>{password.error}</div>
      </div>
      <button>Login</button>
    </Form>
  );
}
```

You can also remove these boilerplates using the [conform](/packages/conform-react/README.md#conform) helper:

```tsx
import { conform, parse, useForm } from '@conform-to/react';
import { Form, useActionData } from '@remix-run/react';

export default function LoginForm() {
  // ...

  return (
    <Form method="post" {...form.props}>
      <div>
        <label htmlFor={email.id}>Email</label>
        <input {...conform.input(email, { type: 'email' })} />
        <div id={email.errorId}>{email.error}</div>
      </div>
      <div>
        <label htmlFor={password.id}>Password</label>
        <input {...conform.input(password, { type: 'password' })} />
        <div id={password.errorId}>{password.error}</div>
      </div>
      <button>Login</button>
    </Form>
  );
}
```
