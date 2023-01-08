# Validation

In this section, we will walk you through how to validate a signup form based on different requirements.

<!-- aside -->

## Table of Contents

- [Concept](#concept)
- [Server Validation](#server-validation)
  - [Validate with a schema](#validate-with-a-schema)
- [Client Validation](#client-validation)
- [Async Validation](#async-validation)
  - [Setup a passthrough](#setup-a-passthrough)
  - [Validate on-demand](#validate-on-demand)
- [Demo](#demo)

<!-- /aside -->

## Concept

Conform tries to simplify the mental model by utilizing a server-first validation flow which submits your form for validation. This is achieved by creating a hidden [command button](/docs/submission.md#command-button) and clicking on it whenever validation is needed.

Now, client validation can be treated as a way to shorten the feedback loop. You can also setup a [passthrough](#setup-a-passthrough) based on the client validation result to decide if the submission should be rejected with `event.preventDefault()`.

## Server Validation

**Conform** tries to makes it easy to validate the form data on the server. For example, you can validate a login form **fully server side** with Remix as shown below:

```tsx
import { parse, useForm } from '@conform-to/react';

interface SignupForm {
  email: string;
  password: string;
  confirmPassword: string;
}

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const submission = parse<SignupForm>(formData);

  try {
    switch (submission.type) {
      // The type will be `submit` by default
      case 'submit':
      // The type will be `validate` for validation
      case 'validate':
        if (!submission.value.email) {
          submission.error.push(['email', 'Email is required']);
        } else if (!submission.value.email.includes('@')) {
          submission.error.push(['email', 'Email is invalid']);
        }

        if (!submission.value.password) {
          submission.error.push(['password', 'Password is required']);
        }

        if (!submission.value.confirmPassword) {
          submission.error.push([
            'confirmPassword',
            'Confirm password is required',
          ]);
        } else if (
          submission.value.confirmPassword !== submission.value.password
        ) {
          submission.error.push(['confirmPassword', 'Password does not match']);
        }

        /**
         * Signup only when the user click on the submit button
         * and no error found
         */
        if (submission.type === 'submit' && !hasError(submission.error)) {
          return await signup(submission.value);
        }

        break;
    }
  } catch (error) {
    /**
     * By specifying the key as '', the message will be
     * treated as a form-level error and populated
     * on the client side as `form.error`
     */
    submission.error.push(['', 'Oops! Something went wrong.']);
  }

  // Always sends the submission state back to client until the user is signed up
  return json({
    ...submission,
    value: {
      // Never send the password back to client
      email: submission.value.email,
    },
  });
}

export default function Signup() {
  // Last submission returned by the server
  const state = useActionData<typeof action>();
  const [form] = useForm<SignupForm>({
    // Enable server validation mode
    mode: 'server-validation',

    // Begin validating on blur
    initialReport: 'onBlur',

    // Sync the result of last submission
    state,
  });

  // ...
}
```

Try it out on [Codesandbox](https://codesandbox.io/s/github/edmundhung/conform/tree/main/examples/remix-run?initialpath=/server-validation&file=/app/routes/server-validation.tsx).

### Validate with a schema

Writing validation logic manually could be cumbersome. You can also use a schema validation library like [yup](https://github.com/jquense/yup) or [zod](https://github.com/colinhacks/zod):

```tsx
import { formatError } from '@conform-to/zod';
import { z } from 'zod';

const schema = z
  .object({
    email: z.string().min(1, 'Email is required').email('Email is invalid'),
    password: z.string().min(1, 'Password is required'),
    confirmPassword: z.string().min(1, 'Confirm Password is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Password does not match',
    path: ['confirmPassword'],
  });

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const submission = parse(formData);

  try {
    switch (submission.type) {
      case 'validate':
      case 'submit': {
        const data = schema.parse(submission.value);

        if (submission.type === 'submit') {
          return await signup(data);
        }

        break;
      }
    }
  } catch (error) {
    submission.error.push(...formatError(error));
  }

  return json(submission);
}
```

Try it out on [Codesandbox](https://codesandbox.io/s/github/edmundhung/conform/tree/main/examples/remix-run?initialpath=/zod&file=/app/routes/zod.tsx).

## Client Validation

Validating fully on server side is great. But, if network latency is a concern, we can also validate on the client side to shorten the feedback loop.

```tsx
import { useForm } from '@conform-to/react';
import { validate } from '@conform-to/zod';

const schema = z
  .object({
    email: z.string().min(1, 'Email is required').email('Email is invalid'),
    password: z.string().min(1, 'Password is required'),
    confirmPassword: z.string().min(1, 'Confirm Password is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Password does not match',
    path: ['confirmPassword'],
  });

export async function action({ request }: ActionArgs) {
  // ...
}

export default function Signup() {
  const state = useActionData();
  const [form] = useForm({
    /**
     * Changing the mode to `client-only` as the client
     * validation does exactly the same checks as the
     * server now. There is no need to confirm with the
     * server again.
     *
     * This can be omitted directly as it is the default mode
     */
    mode: 'client-only',

    state,

    // Setup client validation
    onValidate({ formData }) {
      /**
       * The `validate` helper will parse the formData
       * and returns the submission state with the validation
       * error
       */
      return validate(formData, schema);
    },
  });

  // ...
}
```

## Async valdiation

Everything we did so far looks great, until one day, the requirment is changed. Now your user should also provide a _username_ which has to be **unique**. There are 2 situations here:

1. If you are validating fully on the server, just query the database and add an error message if it is used.
2. If you are validating also on the client, then you need to setup a **passthrough**.

### Setup a passthrough

A **passthrough** is a logic gate that allows a submission to "pass through" based on the submission state.

```tsx
import { hasError } from '@conform-to/react';

export function action() {
  // ...
}

export default function Signup() {
  const state = useActionData();
  const [form] = useForm({
    /**
     * Changing the mode back to `server-validation`
     * as you want to confirm with the server now.
     */
    mode: 'server-validation',
    state,
    onValidate({ formData }) {
      // ...
    },
    onSubmit(event, { submission }) {
      /**
       * Let the submission passthrough if it is validating
       * the username field and no error found on the client
       */
      if (
        submission.type === 'validate' &&
        (submission.intent !== 'username' || hasError(error, 'username'))
      ) {
        event.preventDefault();
      }
    },
  });

  // ...
}
```

### Validate on-demand

Some validation rules could be expensive especially when they require querying from database or 3rd party services. This can be minimized by checking the submission type and intent, or using the `shouldValidate()` helper.

```tsx
import { parse, shouldValidate } from '@conform-to/react';

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const submission = parse(formData);

  try {
    switch (submission.type) {
      case 'validate':
      case 'submit': {
        const data = await schema
          .refine(
            async ({ username }) => {
              // Continue checking only if necessary
              if (!shouldValidate(submission, 'username')) {
                return true;
              }

              // Verifying if the username is already registed
              return await isUsernameUnique(username);
            },
            {
              message: 'Username is already used',
              path: ['username'],
            },
          )
          .parseAsync(submission.value);

        if (submission.type === 'submit') {
          return await signup(data);
        }

        break;
      }
    }
  } catch (error) {
    submission.error.push(...formatError(error));
  }

  return json(submission);
}
```

## Demo

<!-- sandbox src="/examples/remix-run?initialpath=/async-validation&module=/app/routes/async-validation.tsx" -->

Try it out on [Codesandbox](https://codesandbox.io/s/github/edmundhung/conform/tree/main/examples/remix-run?initialpath=/async-validation&file=/app/routes/async-validation.tsx).

<!-- /sandbox -->
