# conformValibotMessage

A set of custom messages to control the validation behavior. This is useful if you need async validation for one of the fields.

## Options

### `conformValibotMessage.VALIDATION_SKIPPED`

This message is used to indicate that the validation is skipped and Conform should use the previous result instead.

### `conformValibotMessage.VALIDATION_UNDEFINED`

This message is used to indicate that the validation is not defined and Conform should fallback to server validation.

## Example

You can skip an validation to use the previous result. On client validation, you can indicate the validation is not defined to fallback to server validation.

```tsx
import type { Intent } from '@conform-to/react';
import { useForm } from '@conform-to/react';
import { parseWithValibot, conformValibotMessage } from 'conform-to-valibot';
import {
  check,
  forward,
  forwardAsync,
  object,
  partialCheck,
  partialCheckAsync,
  pipe,
  pipeAsync,
  string,
} from 'valibot';

function createBaseSchema(intent: Intent | null) {
  return object({
    email: pipe(
      string('Email is required'),
      // When not validating email, leave the email error as it is.
      check(
        () =>
          intent === null ||
          (intent.type === 'validate' && intent.payload.name === 'email'),
        conformValibotMessage.VALIDATION_SKIPPED,
      ),
    ),
    password: string('Password is required'),
  });
}

function createServerSchema(
  intent: Intent | null,
  options: { isEmailUnique: (email: string) => Promise<boolean> },
) {
  return pipeAsync(
    createBaseSchema(intent),
    forwardAsync(
      partialCheckAsync(
        [['email']],
        async ({ email }) => options.isEmailUnique(email),
        'Email is already used',
      ),
      ['email'],
    ),
  );
}

function createClientSchema(intent: Intent | null) {
  return pipe(
    createBaseSchema(intent),
    forward(
      // If email is specified, fallback to server validation to check its uniqueness.
      partialCheck(
        [['email']],
        () => false,
        conformValibotMessage.VALIDATION_UNDEFINED,
      ),
      ['email'],
    ),
  );
}

export async function action({ request }) {
  const formData = await request.formData();
  const submission = await parseWithValibot(formData, {
    schema: (intent) =>
      createServerSchema(intent, {
        isEmailUnique: async (email) => {
          // Query your database to check if the email is unique
        },
      }),
  });

  // Send the submission back to the client if the status is not successful
  if (submission.status !== 'success') {
    return submission.reply();
  }

  // ...
}

function ExampleForm() {
  const [form, { email, password }] = useForm({
    onValidate({ formData }) {
      return parseWithValibot(formData, {
        schema: (intent) => createClientSchema(intent),
      });
    },
  });

  // ...
}
```
