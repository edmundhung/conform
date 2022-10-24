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
  if (submission.type !== 'validate' && submission.error.length === 0) {
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
import { getError } from '@conform-to/zod';
import { z } from 'zod';

export async function action({ request }) {
  const formData = await request.formData();
  const submission = parse(formData);
  const result = z
    .object({
      email: z.string().min(1, 'Email is required').email('Email is invalid'),
      password: z.string().min(1, 'Password is required'),
    })
    .safeParse(submission.value);

  if (submission.type !== 'validate' && result.success) {
    try {
      return await login(result.data);
    } catch (error) {
      submission.error.push(['', 'Login failed']);
    }
  } else {
    /**
     * The `getError` helpers simply resolves the ZodError to
     * a set of key/value pairs which refers to the name and
     * error of each field.
     */
    submission.error = submission.error.concat(getError(result));
  }

  return submission;
}
```

### Validating on-demand

Some validation rule could be expensive especially when it requires query result from database or even 3rd party services. This can be minimized by checking the submission type and metadata, or using the `shouldValidate()` helper.

```tsx
import { parse, shouldValidate } from '@conform-to/react';
import { getError } from '@conform-to/zod';
import { z } from 'zod';

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

For example, you can validation logics between the server and client.

```tsx
import type { Submission } from '@conform-to/react';
import { useForm, useFieldset, parse, setFormError } from '@conform-to/react';

interface LoginForm {
  email: string;
  password: string;
}

/**
 * Move the validation logic out so it can be used
 * on both client and server side
 */
function validate(submission: Submission<LoginForm>): Array<[string, string]> {
  const error = [...submission.error];

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

  if (submission.type !== 'validate' && error.length === 0) {
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
    error,
  });
}

export default function login() {
  const state = useActionData();
  const form = useForm({
    mode: 'server-validation',
    state,
    onValidate({ form, submission }) {
      // Reuse the validation logic
      const error = validate(submission);

      /**
       * This updates the form error based on the submission
       * by using the Constraint Validation API
       */
      setFormError(form, {
        ...submission,
        error,
      });
    },

    onSubmit(event, { submission }) {
      /**
       * This can be removed by specifying the `mode` as
       * 'client-only' instead of `server-validation`
       */
      if (submission.type === 'validate') {
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
import { shouldValidate, hasError } from '@conform-to/react';

export function action() {
  // No change from the previous example
}

export default function login() {
  const state = useActionData();
  const form = useForm({
    mode: 'server-validation',
    state,
    onValidate({ form, submission }) {
      const error = validate(submission);

      if (
        /**
         * Fallback only when the field should be validated
         */
        shouldValidate(submission, 'email') &&
        /**
         * We don't need server validation if the field
         * has error. (e.g. Required / Invalid email)
         */
        !hasError(error, 'email')
      ) {
        /**
         * This let us skips reporting client error and
         * wait for response from the server
         */
        throw form;
      }

      /**
       * This updates the form error based on the submission
       * by using the Constraint Validation API
       */
      setFormError(form, {
        ...submission,
        error,
      });
    },

    onSubmit(event, { submission }) {
      /**
       *  Do not block the submission when validating email
       */
      if (submission.type === 'validate' && submission.metadata !== 'email') {
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

<!-- sandbox src="/docs/examples/validation" -->

Try it out on [Codesandbox](https://codesandbox.io/s/github/edmundhung/conform/tree/main/docs/examples/validation).

<!-- /sandbox -->
