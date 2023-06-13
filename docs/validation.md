# Validation

Conform supports several validation modes. In this section, we will walk you through how to validate a signup form based on different requirements.

<!-- aside -->

## On this page

- [Server Validation](#server-validation)
  - [Schema Validation](#schema-validation)
- [Client Validation](#client-validation)
- [Async Validation](#async-validation)
  - [Skipping validation](#skipping-validation)

<!-- /aside -->

## Server Validation

**Conform** enables you to validate a form **fully server side** even .

```tsx
import { useForm, parse } from '@conform-to/react';

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const submission = parse(formData, {
    resolve({ email, password }) {
      const error: Record<string, string> = {};

      if (typeof email !== 'string') {
        error.email = 'Email is required';
      } else if (!/^[^@]+@[^@]+$/.test(email)) {
        error.email = 'Email is invalid';
      }

      if (typeof password !== 'string') {
        error.password = 'Password is required';
      }

      if (typeof confirmPassword !== 'string') {
        error.confirmPassword = 'Confirm Password is required';
      } else if (confirmPassword !== password) {
        error.confirmPassword = 'Password does not match';
      }

      if (error.email || error.password || error.confirmPassword) {
        return { error };
      }

      return {
        value: { email, password },
      };
    },
  });

  if (!submission.value || submission.intent !== 'submit') {
    return json(submission);
  }

  const user = await signup(submission.payload);

  if (!user) {
    return json({
      ...submission,
      /**
       * By specifying the error path as '' (root), the message will be
       * treated as a form-level error and populated
       * on the client side as `form.error`
       */
      error: {
        '': 'Oops! Something went wrong.',
      },
    });
  }

  return redirect('/');
}

export default function Signup() {
  // Last submission returned by the server
  const lastSubmission = useActionData<typeof action>();
  const [form] = useForm<SignupForm>({
    // Sync the result of last submission
    lastSubmission,
  });

  // ...
}
```

### Schema Validation

Writing validation logic manually could be cumbersome. You can also use a schema validation library like [yup](https://github.com/jquense/yup) or [zod](https://github.com/colinhacks/zod):

```tsx
import { parse } from '@conform-to/zod';
import { z } from 'zod';

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const submission = parse(formData, {
    schema: z
      .object({
        email: z.string().min(1, 'Email is required').email('Email is invalid'),
        password: z.string().min(1, 'Password is required'),
        confirmPassword: z.string().min(1, 'Confirm password is required'),
      })
      .refine((value) => value.password === value.confirmPassword, {
        message: 'Password does not match',
        path: ['confirmPassword'],
      }),
  });

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

// Move the schema definition out of action
const schema = z
  .object({
    email: z.string().min(1, 'Email is required').email('Email is invalid'),
    password: z.string().min(1, 'Password is required'),
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Password does not match',
    path: ['confirmPassword'],
  });

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const submission = parse(formData, { schema });

  // ...
}

export default function Signup() {
  const lastSubmission = useActionData();
  const [form] = useForm({
    lastSubmission,

    // Setup client validation
    onValidate({ formData }) {
      return parse(formData, { schema });
    },
  });

  // ...
}
```

## Async Validation

The usage of [server validation](#server-validation) might feel limited, but it set the foundation of async validation on Conform. Conform does validation as a submission, with client validation act as a middleware, if the client result says it has all the information it needs, Conform will block the submission. But if it needs something else, Conform will let it continue its journey to the server.

Here is an example how you can do async validation with Zod:

```tsx
import { hasError } from '@conform-to/react';

// Instead of reusing a schema, we prepare a schema creator
function createSchema(
  // The constraints parameter is optional
  // as it is only implemented on the server
  constraints: {
    isEmailUnique: (email) => Promise<boolean>;
  } = {},
) {
  return z.object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Email is invalid')
      .superRefine((email, ctx) => {
        if (typeof constraints.isEmailUnique === 'undefined') {
          // Validate only if the constraint is defined
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: conform.VALIDATION_UNDEFINED,
          });
        } else {
          // Tell zod this is an async validation by returning the promise
          return constraints.isEmailUnique(value).then((isUnique) => {
            if (isUnique) {
              return;
            }

            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Email is already used',
            });
          });
        }
      }),
    // ...
  });
}

export function action() {
  const formData = await request.formData();
  const submission = await parse(formData, {
    // create the zod schema with the constraint
    schema: createSchema({
      async isEmailUnique(email) {
        // ...
      },
    }),

    // Enable async validation
    async: true,
  });

  // ...
}

export default function Signup() {
  const lastSubmission = useActionData();
  const [form] = useForm({
    lastSubmission,
    onValidate({ formData }) {
      return parse(formData, {
        // Create the schema without any constraint defined
        schema: createSchema(),
      });
    },
  });

  // ...
}
```

## Skipping Validation

Some validation could be expensive, especially when they require querying from a 3rd party service. This can be minimized by checking the submission intent.

```tsx
import { parse } from '@conform-to/zod';

function createSchema(
  // Accept an intent on the schema creator
  intent: string,
  constraints: {
    isEmailUnique: (email) => Promise<boolean>;
  } = {},
) {
  return z.object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Email is invalid')
      .superRefine((email, ctx) => {
        if (intent !== 'validate/email' && intent !== 'submit') {
          // Validate only when the email field is changed or when submitting
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: conform.VALIDATION_SKIPPED,
          });
        } else if (typeof constraints.isEmailUnique === 'undefined') {
          // The same as the previous example
        } else {
          // The same as the previous example
        }
      }),
    // ...
  });
}

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const submission = await parse(formData, {
    // Retrieve the intent by providing a function instead
    schema: (intent) =>
      createSchema(intent, {
        async isEmailUnique(email) {
          // ...
        },
      }),

    // Enable async validation
    async: true,
  });

  // ...
}

export default function Signup() {
  const lastSubmission = useActionData();
  const [form] = useForm({
    lastSubmission,
    onValidate({ formData }) {
      return parse(formData, {
        // Similar to the action above
        schema: (intent) => createSchema(intent),
      });
    },
  });

  // ...
}
```
