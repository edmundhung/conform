# Validation

Conform supports several validation modes. In this section, we will walk you through how to validate a form based on different requirements.

<!-- aside -->

## On this page

- [Server Validation](#server-validation)
- [Client Validation](#client-validation)
- [Async Validation](#async-validation)
  - [Skipping validation](#skipping-validation)

<!-- /aside -->

## Server Validation

**Conform** enables you to validate a form **fully server side**.

```tsx
import { useForm } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import { z } from 'zod';

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const submission = parse(formData, {
    schema: z.object({
      email: z
        .string({ required_error: 'Email is required' })
        .email('Email is invalid'),
      message: z
        .string({ required_error: 'Message is required' })
        .max(100, 'Message is too long'),
    }),
  });

  if (submission.intent !== 'submit' || !submission.value) {
    return json(submission);
  }

  return await signup(data);
}

export default function Signup() {
  // Last submission returned by the server
  const lastSubmission = useActionData<typeof action>();
  const [form] = useForm({
    // Sync the result of last submission
    lastSubmission,
  });

  // ...
}
```

## Client Validation

Server validation works well generally. However, network latency would be a concern if there is a need to provide instant feedback while user is typing. In this case, you might want to validate on the client side as well.

```tsx
import { useForm } from '@conform-to/react';
import { parse } from '@conform-to/zod';

// Move the schema definition out of action
const schema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Email is invalid'),
  message: z
    .string({ required_error: 'Message is required' })
    .max(100, 'Message is too long'),
});

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const submission = parse(formData, { schema });

  // ...
}

export default function Signup() {
  const lastSubmission = useActionData<typeof action>();
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

Here is an example how you can do async validation with zod:

```tsx
import { refine } from '@conform-to/react';

// Instead of reusing a schema, let's prepare a schema creator
function createSchema(options?: {
  isEmailUnique?: (email) => Promise<boolean>;
}) {
  return z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Email is invalid')
      // Pipe another schema so it runs only if the email is valid
      .pipe(
        z.string().superRefine((email, ctx) =>
          // Using the `refine` helper from Conform
          refine(ctx, {
            validate: () => constarint.isEmailUnique?.(email),
            message: 'Username is already used',
          }),
        ),
      ),
    // ...
  });
}

export function action() {
  const formData = await request.formData();
  const submission = await parse(formData, {
    // create the zod schema with `isEmailUnique()` implemented
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
        // Create the schema without implementing `isEmailUnique()`
        schema: createSchema(),
      });
    },
  });

  // ...
}
```

## Skipping Validation

Conform validates all fields by default. This could be expensive especially with async validation. One solution is to minimize the validation by checking the submission intent.

```tsx
import { parse } from '@conform-to/zod';

function createSchema(
  // Accept an intent on the schema creator
  intent: string,
  options?: {
    isEmailUnique?: (email) => Promise<boolean>;
  },
) {
  return z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Email is invalid')
      .pipe(
        z.string().superRefine((email, ctx) =>
          refine(ctx, {
            validate: () => constarint.isEmailUnique?.(email),
            // Check only when it is validating the email field or submitting
            when: intent === 'submit' || intent === 'validate/email',
            message: 'Username is already used',
          }),
        ),
      ),
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
