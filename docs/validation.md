# Validation

**Conform** validates your form by making a submission and treats the client validation as a middleware.

<!-- aside -->

## Table of Contents

- [Concept](#concept)
- [Server Validation](#server-validation)
  - [Schema Integration](#schema-integration)
  - [Validating on-demand](#validating-on-demand)
- [Client Validation](#client-validation)
  - [Sharing logics](#sharing-logics)
  - [Fallback](#fallback)
- [Demo](#demo)

<!-- /aside -->

## Concept

Conform tries to simplify the mental model by utilizing a server-first validation flow which submits your form for validation. This is achieved by creating a hidden [command button](./submission.md#built-in-commands) and clicking on it whenever validation is needed.

Client validation can then be used to reduce the feedback loop by using the validation result on the client side to decide if the submission should be blocked through `event.preventDefault()`.

## Server Validation

**Conform** tries to makes it easy to validate the form data on the server. For example, you can validate a login form **fully server side** with Remix as shown below:

```tsx
import { useForm, useFieldset, parse } from '@conform-to/react';

interface LoginForm {
  email: string;
  password: string;
}

export async function action({ request }) {
  const formData = await request.formData();
  const submission = parse<LoginForm>(formData);

  try {
    switch (submission.context) {
      // The context will be `submit` by default
      case 'submit':
      // The context will be `validate` for validation
      case 'validate':
        if (!submission.value.email) {
          submission.error.push(['email', 'Email is required']);
        } else if (!submission.value.email.includes('@')) {
          submission.error.push(['email', 'Email is invalid']);
        }

        if (!submission.value.password) {
          submission.error.push(['password', 'Password is required']);
        }

        /**
         * No login should happen when the context is `validate`
         * or if there is any error
         */
        if (submission.context === 'submit' && submission.error.length === 0) {
          return await login(submission.value);
        }
        break;
    }
  } catch (error) {
    /**
     * By specifying the key as '', the message will be
     * treated as a form-level error and populated
     * on the client side as `form.error`
     */
    submission.error.push(['', 'Login failed']);
  }

  // Always sends the submission state back to client until the user is logged-in
  return json({
    ...submission,
    value: {
      // Never send the password back to client
      email: submission.value.email,
    },
  });
}

export default function login() {
  const state = useActionData();
  const form = useForm({
    /**
     * This tells conform to validate with the server.
     * It defaults to `client-only` if not specified
     */
    mode: 'server-validation',

    /**
     * Conform will report the server error based on the last
     * submission state
     */
    state,
  });
  const { email, password } = useFieldset(form.ref, form.config);

  return (
    <Form method="post" {...form.props}>
      <div>{form.error}</div>
      <input type="text" name="email" />
      <div>{email.error}</div>
      <input type="password" name="password" />
      <div>{password.error}</div>
      <button type="submit">Login</button>
    </Form>
  );
}
```

### Schema Integration

Integrating with a schema validation library is also straight-forwad. For example, you can integrate it with `zod` like this:

```tsx
import { parse } from '@conform-to/react';
import { formatError } from '@conform-to/zod';
import { z } from 'zod';

export async function action({ request }) {
  const formData = await request.formData();
  const submission = parse(formData);
  const schema = z.object({
    email: z.string().min(1, 'Email is required').email('Email is invalid'),
    password: z.string().min(1, 'Password is required'),
  });

  try {
    const data = schema.parse(submission.value);

    if (submission.context === 'submit') {
      return await login(result.data);
    }
  } catch (error) {
    /**
     * The `formatError` helpers simply resolves the ZodError to
     * a set of key/value pairs which refers to the name and
     * error of each field.
     */
    submission.error = submission.error.concat(formatError(error));
  }

  return submission;
}
```

### Validating on-demand

Some validation rule could be expensive especially when it requires query result from database or even 3rd party services. This can be minimized by checking the submission context and intent, or using the `shouldValidate()` helper.

```tsx
import { parse, shouldValidate } from '@conform-to/react';

export async function action({ request }) {
  const formData = await request.formData();
  const submission = parse(formData);

  if (!submission.value.email) {
    submission.error.push(['email', 'Email is required']);
  } else if (!submission.value.email.includes('@')) {
    submission.error.push(['email', 'Email is invalid']);
  } else if (
    // Continue checking only if necessary
    shouldValidate(submission, 'email') &&
    // e.g. Verifying if the email exists on the database (Example only)
    (await isRegistered(submission.value.email))
  ) {
    submission.error.push(['email', 'Email is not registered']);
  }

  if (!submission.value.password) {
    submission.error.push(['password', 'Password is required']);
  }

  /* ... */
}
```

## Client Validation

Client validation can be added to reduce the feedback loop.

### Sharing logics

For example, you can share validation logics between the server and client.

```tsx
import type { Submission } from '@conform-to/react';
import { useForm, useFieldset, parse } from '@conform-to/react';

interface LoginForm {
  email: string;
  password: string;
}

/**
 * Move the validation logic out so it can be used
 * on both client and server side
 */
function validate(submission: Submission<LoginForm>): Array<[string, string]> {
  const error: Array<[string, string]> = [];

  if (!submission.value.email) {
    error.push(['email', 'Email is required']);
  } else if (!submission.value.email.includes('@')) {
    error.push(['email', 'Email is invalid']);
  }

  if (!submission.value.password) {
    error.push(['password', 'Password is required']);
  }

  return error;
}

export async function action({ request }) {
  const formData = await request.formData();
  const submission = parse<LoginForm>(formData);

  try {
    switch (submission.context) {
      case 'submit':
      case 'validate': {
        const error = validate(submission)

        if (error.length > 0) {
          submission.error =  submission.error.concat(error);
        }

        if (submission.context === 'submit' && submission.error.length === 0) {
          return await login(submission.value);
        }
        break;
      }
  } catch (error) {
    error.push(['', 'Login failed']);
  }

  return json({
    ...submission,
    value: {
      email: submission.value.email,
    },
  });
}

export default function login() {
  const state = useActionData();
  const form = useForm({
    mode: 'server-validation',
    state,
    onValidate({ submission }) {
      // Reuse the validation logic
      return validate(submission);
    },

    onSubmit(event, { submission }) {
      /**
       * This checks can be removed by specifying the `mode` as
       * 'client-only' instead of `server-validation`
       */
      if (submission.context === 'validate') {
        /**
         * As the client validation cover all the checks,
         * there is no need to be validated by the server.
         */
        event.preventDefault();
      }
    },
  });

  // ...
}
```

### Fallback

However, sometimes not every validation rules can be applied client side. Let's fallback to server validation.

```tsx
import type { Submission } from '@conform-to/react';
import { hasError } from '@conform-to/react';

export function action() {
  // ...
}

export default function login() {
  const state = useActionData();
  const form = useForm({
    mode: 'server-validation',
    state,
    onValidate({ form, submission }) {
      return validate(submission);
    },
    onSubmit(event, { submission }) {
      /**
       * Block the submission only when validating fields
       * other than email or if email has any error already
       */
      if (
        submission.context === 'validate' &&
        (submission.intent !== 'email' || hasError(error, 'email'))
      ) {
        event.preventDefault();
      }
    },
  });

  // ...
}
```

## Demo

<!-- sandbox src="/examples/remix-run?initialpath=/async-validation&module=/app/routes/async-validation.tsx" -->

Try it out on [Codesandbox](https://codesandbox.io/s/github/edmundhung/conform/tree/main/examples/remix-run?initialpath=/async-validation&file=/app/routes/async-validation.tsx).

<!-- /sandbox -->
