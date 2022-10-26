# Validation

**Conform** adopts a `server-first` paradigma. It submits your form for server validation and uses client validation as a middleware.

<!-- aside -->

## Table of Contents

- [Constraint Validation](#constraint-validation)
- [Server Validation](#server-validation)
  - [Schema Integration](#schema-integration)
  - [Validating on-demand](#validating-on-demand)
- [Client Validation](#client-validation)
  - [Sharing logics](#sharing-logics)
  - [Fallback](#fallback)
- [Demo](#demo)

<!-- /aside -->

## Server Validation

Your APIs should always validate the form data provided regardless if client validation is done well. There are also things that can only be validated server side, e.g. checking if an email is registered on the database. It could be considered the source of truth of your validation logic.

For example, you can validate a login form in Remix as follow:

```tsx
import { useForm, useFieldset, parse } from '@conform-to/react';

interface LoginForm {
  email: string;
  password: string;
}

export async function action({ request }) {
  const formData = await request.formData();
  const submission = parse<LoginForm>(formData);

  if (!submission.value.email) {
    submission.error.push(['email', 'Email is required']);
  } else if (!submission.value.email.includes('@')) {
    submission.error.push(['email', 'Email is invalid']);
  }

  if (!submission.value.password) {
    submission.error.push(['password', 'Password is required']);
  }

  /**
   * Try logging the user in only when the submission is intentional
   * with no error found
   */
  if (submission.context !== 'validate' && submission.error.length === 0) {
    try {
      return await login(submission.value);
    } catch (error) {
      /**
       * By specifying the key as '', the message will be
       * treated as a form-level error and populated
       * on the client side as `form.error`
       */
      submission.error.push(['', 'Login failed']);
    }
  }

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
    mode: 'server-validation',
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
    </Form>
  );
}
```

### Schema Integration

Integrating with a schema validation library is simple. For example, you can integrate it with `zod` like this:

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

With proper server validation in place, client validation serves two main purposes:

1. Shorten the feedback loop due to network latency
2. Reduce server load caused by validation

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
  const error = validate(submission);

  if (submission.context !== 'validate' && error.length === 0) {
    try {
      return await login(submission.value);
    } catch (error) {
      error.push(['', 'Login failed']);
    }
  }

  return json({
    ...submission,
    value: {
      email: submission.value.email,
    },
    error: submission.error.concat(error),
  });
}

export default function login() {
  const state = useActionData();
  const form = useForm({
    mode: 'server-validation',
    state,
    onValidate({ form, submission }) {
      // Reuse the validation logic
      return validate(submission);
    },

    onSubmit(event, { submission }) {
      /**
       * This can be removed by specifying the `mode` as
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
  const { email, password } = useFieldset(form.ref, form.config);

  return (
    <Form method="post" {...form.props}>
      <div>{form.error}</div>
      <input type="text" name="email" />
      <div>{email.error}</div>
      <input type="password" name="password" />
      <div>{password.error}</div>
    </Form>
  );
}
```

### Fallback

However, sometimes not every validation rules can be applied client side. Let's fallback to the server.

```tsx
import type { Submission } from '@conform-to/react';
import { hasError } from '@conform-to/react';

export function action() {
  // No change from the previous example
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
       *  Do not block the submission when validating email
       */
      if (
        submission.context === 'validate' &&
        (submission.intent !== 'email' || hasError(error, 'email'))
      ) {
        event.preventDefault();
      }
    },
  });
  const { email, password } = useFieldset(form.ref, form.config);

  return (
    <Form method="post" {...form.props}>
      <div>{form.error}</div>
      <input type="text" name="email" />
      <div>{email.error}</div>
      <input type="password" name="password" />
      <div>{password.error}</div>
    </Form>
  );
}
```

## Demo

<!-- sandbox src="/examples/remix-run?initialpath=/async-validation&module=/app/routes/async-validation.tsx" -->

Try it out on [Codesandbox](https://codesandbox.io/s/github/edmundhung/conform/tree/main/examples/remix-run?initialpath=/async-validation&file=/app/routes/async-validation.tsx).

<!-- /sandbox -->
