# Validation

Conform supports several validation modes. In this section, we will walk you through how to validate a signup form based on different requirements.

<!-- aside -->

## On this page

- [How it works](#how-it-works)
- [Server Validation](#server-validation)
  - [Validate with a schema](#validate-with-a-schema)
- [Client Validation](#client-validation)
- [Async Validation](#async-validation)
  - [Setup a passthrough](#setup-a-passthrough)
  - [Validate on-demand](#validate-on-demand)
- [Demo](#demo)

<!-- /aside -->

## How it works

Conform unifies validation and submission as one single flow by utilizing the form submitter with a [custom submission type and intent](/docs/commands.md#command-button):

#### Flow

1. Submission triggered
2. Validate on the client if configured
3. Stop the submission and report any errors found if any of the [conditions](#conditions) is met:
4. Request sent to the server
5. Validate on the server and process the data based on the submission type and intent
6. Report server error

#### Conditions

- Errors found and the `noValidate` / `formNoValidate` attribute is not set to `true`
- The submission type is `validate` and the validation mode is set to `client-validation`
- `event.preventDefault()` is called on the submit event handler, e.g. async-validation

## Server Validation

**Conform** enables you to validate a form **fully server side**.

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

  if (!submission.payload.email) {
    submission.error.email = 'Email is required';
  } else if (!submission.payload.email.includes('@')) {
    submission.error.email = 'Email is invalid';
  }

  if (!submission.payload.password) {
    submission.error.password = 'Password is required';
  }

  if (!submission.payload.confirmPassword) {
    submission.error.confirmPassword = 'Confirm password is required';
  } else if (
    submission.payload.confirmPassword !== submission.payload.password
  ) {
    submission.error.confirmPassword = 'Password does not match';
  }

  if (hasError(submission.error) || submission.intent !== 'submit') {
    return json(submission);
  }

  try {
    return await signup(submission.payload);
  } catch (error) {
    return json({
      ...submission,
      error: [
        /**
         * By specifying the key as '', the message will be
         * treated as a form-level error and populated
         * on the client side as `form.error`
         */
        ['', 'Oops! Something went wrong.'],
      ],
    });
  }
}

export default function Signup() {
  // Last submission returned by the server
  const state = useActionData<typeof action>();
  const [form] = useForm<SignupForm>({
    // Begin validating on blur
    initialReport: 'onBlur',

    // Sync the result of last submission
    state,
  });

  // ...
}
```

### Validate with a schema

Writing validation logic manually could be cumbersome. You can also use a schema validation library like [yup](https://github.com/jquense/yup) or [zod](https://github.com/colinhacks/zod):

```tsx
import { parse } from '@conform-to/zod';
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
  const submission = parse(formData, { schema });

  if (!submission.value || submission.intent !== 'submit') {
    return json(submission);
  }

  return await signup(data);
}
```

## Client Validation

Server validation works well generally. However, network latency would be a concern if there is a need to provide instant feedback while user is typing. In this case, you might want to validate on the client side as well.

```tsx
import { useForm } from '@conform-to/react';
import { parse } from '@conform-to/zod';

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
    state,

    // Setup client validation
    onValidate({ formData }) {
      /**
       * The `validate` helper will parse the formData
       * and return the submission state with the validation
       * error
       */
      return parse(formData, { schema });
    },
  });

  // ...
}
```

## Async valdiation

If you want to have some parts of the validation done on the server, while the rest of the validations are still handled on the client side. All you need is to setup a **passthrough**.

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
        submission.intent !== 'submit' &&
        (submission.intent !== 'validate/username' ||
          hasError(submission.error, 'username'))
      ) {
        event.preventDefault();
      }
    },
  });

  // ...
}
```

### Validate on-demand

Some validation rules could be expensive especially when they require querying from database or 3rd party services. This can be minimized with the `shouldValidate()` helper.

```tsx
import { parse } from '@conform-to/zod';

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const submission = parse(formData, {
    schema: ({ shouldValidate }) =>
      schema.refine(
        async ({ username }) => {
          // Continue checking only if necessary
          if (!shouldValidate('username')) {
            return true;
          }

          // Verifying if the username is already registed
          return await isUsernameUnique(username);
        },
        {
          message: 'Username is already used',
          path: ['username'],
        },
      ),
    async: true,
  });

  if (!submission.value || submission.intent !== 'submit') {
    return json(submission);
  }

  return await signup(submission.value);
}
```
