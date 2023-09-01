# Validation

In this guide, we will walk you through each validation mode and the different strategies supported by Conform.

<!-- row -->

<!-- col -->

## Validation Mode

By default, the form data is validated upon form submission. To customize the validation mode, you can set the following options in the `useForm` hook.

<!-- attributes -->

#### `shouldValidate`

Determines when fields are first validated. Defaults to **onSubmit**.

#### `shouldRevalidate`

Determines when fields are revalidated after the first validation. Defaults to the same validation mode as **shouldValidate**.

<!-- /attributes -->

### Modes

Here is a list of supported validation modes:

<!-- attributes -->

#### `onSubmit`

Validates on form submission (default).

#### `onBlur`

Validates when user leaves the field.

#### `onInput`

Validates as user types.

<!-- /attributes -->

<!-- /col -->

<!-- col sticky=true -->

```tsx
import { useForm } from '@conform-to/react';

export default function Example() {
  const [form, fields] = useForm({
    // Validate on blur
    shouldValidate: 'onBlur',

    // Revalidate on input
    shouldRevalidate: 'onInput',
  });

  // ...
}
```

> You can initiate validation by triggering the [validate intent](/docs/intent-button.md#triggering-intent) as well

<!-- /col -->

<!-- /row -->

---

## Validation Strategy

Conform supports different validation strategies as well.

<!-- row -->

<!-- col -->

### Server Validation

Conform relies on the server to validate the form data **by default**. All you need to do is to parse the form data in the action and send the submission data back to client and pass it to the `useForm` hook if there is any error.

Server validation is the simplest strategy to setup as the server should always validate the form data regardless. It centralizes validation logic on the server with direct access to database and user session. It also reduces the client dependencies as you don't need to include the validation logic on the client.

<!-- /col -->

<!-- col sticky=true -->

```tsx
import { useForm } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import { z } from 'zod';

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const submission = parse(formData, {
    schema: z.object({
      // ...
    }),
  });

  if (submission.intent !== 'submit' || !submission.value) {
    return json(submission);
  }

  // ...
}

export default function Example() {
  // Last submission returned by the server
  const lastSubmission = useActionData<typeof action>();
  const [form, fields] = useForm({
    // Sync the result of last submission
    lastSubmission,
  });

  // ...
}
```

<!-- /col -->

<!-- /row -->

---

<!-- row -->

<!-- col -->

### Client Validation

Client validation is best suited for scenarios where immediate user feedback is important, to reduce server load, or when you need simple validations only.

You can reuse the validation logic on the client by setting the **onValidate** option in the `useForm` hook with the same schema used in the action.

<!-- /col -->

<!-- col sticky=true -->

```tsx
import { useForm } from '@conform-to/react';
import { parse } from '@conform-to/zod';

// Move the schema definition out of action
const schema = z.object({
  // ...
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

<!-- /col -->

<!-- /row -->

---

<!-- row -->

<!-- col -->

### Async Validation

It is not always possible to validate on the client. Sometime you need to check against the database or other external services. This is where you need async validation.

Conform supports async validation by switching the validation strategy from client to server validation whenever a pre-defined message is returned. This can be achieved by utilizing the `refine()` helper with a schema creator that implements the async validation logic based on the environment.

<!-- /col -->

<!-- col sticky=true -->

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

<!-- /col -->

<!-- /row -->

---

<!-- row -->

<!-- col -->

### On-Demand Validation

Conform validates all fields by default. This could be expensive especially with async validation.

To minimize the workloads, you can set the `when` option in the `refine()` helper to only validate the field when certain conditions are met. For example, you can check for email uniqueness only when the user is submitting the form, or when the user is updating the email field by checking the intent.

<!-- /col -->

<!-- col sticky=true -->

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
            when:
              intent === 'submit' || intent === 'validate/email',
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

<!-- /col -->

<!-- /row -->
