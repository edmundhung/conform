# conformZodMessage

A set of custom messages to control the validation behavior. This is useful if you need async validation for one of the fields.

## Options

### `conformZodMessage.VALIDATION_SKIPPED`

This message is used to indicate that the validation is skipped and Conform should use the previous result instead.

### `conformZodMessage.VALIDATION_UNDEFINED`

This message is used to indicate that the validation is not defined and Conform should fallback to server validation.

## Example

Here is a signup form example which validates if the email is unique.

```tsx
import type { Intent } from '@conform-to/react';
import { useForm } from '@conform-to/react';
import { parseWithZod, conformZodMessage } from '@conform-to/zod';
import { z } from 'zod';

// Instead of sharing a schema, prepare a schema creator
function createSchema(
  // The `intent` will be provided by the `parseWithZod` helper
  intent: Intent | null,
  options?: {
    isEmailUnique: (email: string) => Promise<boolean>;
  },
) {
  return z
    .object({
      email: z
        .string()
        .email()
        // Pipe the schema so it runs only if the email is valid
        .pipe(
          z.string().superRefine((email, ctx) => {
            const isValidatingEmail =
              intent === null ||
              (intent.type === 'validate' && intent.payload.name === 'email');

            if (!isValidatingEmail) {
              ctx.addIssue({
                code: 'custom',
                message: conformZodMessage.VALIDATION_SKIPPED,
              });
              return;
            }

            if (typeof options?.isEmailUnique !== 'function') {
              ctx.addIssue({
                code: 'custom',
                message: conformZodMessage.VALIDATION_UNDEFINED,
                fatal: true,
              });
              return;
            }

            return options.isEmailUnique(email).then((isUnique) => {
              if (!isUnique) {
                ctx.addIssue({
                  code: 'custom',
                  message: 'Email is already used',
                });
              }
            });
          }),
        ),
    })
    .and(
      z
        .object({
          password: z.string({ required_error: 'Password is required' }),
          confirmPassword: z.string({
            required_error: 'Confirm password is required',
          }),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: 'Password does not match',
          path: ['confirmPassword'],
        }),
    );
}

export async function action({ request }) {
  const formData = await request.formData();
  const submission = await parseWithZod(formData, {
    schema: (intent) =>
      // create the zod schema based on the intent
      createSchema(intent, {
        isEmailUnique(email) {
          // query from your database
        },
      }),
    async: true,
  });

  if (submission.status !== 'success') {
    return submission.reply();
  }

  // ...
}

export default function Signup() {
  const lastResult = useActionData();
  const [form, fields] = useForm({
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, {
        // Create the schema without `isEmailUnique` defined
        schema: (intent) => createSchema(intent),
      });
    },
  });

  // ...
}
```
