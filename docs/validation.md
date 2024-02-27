# Validation

Conform supports different validation modes. In this section, we will walk you through how to validate a form based on different requirements.

## Server Validation

You can validate a form **fully server side**. It is not limited to form submission but also works when user is typing or leaving a field. This allows you to exclude the validation logic from the client bundle. But network latency might be a concern if you want to validate while user is typing.

```tsx
import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { z } from 'zod';

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const submission = parseWithZod(formData, {
    schema: z.object({
      email: z.string().email(),
      message: z.string().max(100),
    }),
  });

  if (submission.status !== 'success') {
    return submission.reply();
  }

  return await signup(data);
}

export default function Signup() {
  // Last result returned by the server
  const lastResult = useActionData<typeof action>();
  const [form] = useForm({
    // Sync the result of last submission
    lastResult,

    // Configure when each field should be validated
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
  });

  // ...
}
```

## Client Validation

You can always reuse the validation logic on the client side for instant feedback.

```tsx
import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';

// Move the schema definition out of action
const schema = z.object({
  email: z.string().email(),
  message: z.string().max(100),
});

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema });

  // ...
}

export default function Signup() {
  const lastResult = useActionData<typeof action>();
  const [form] = useForm({
    lastResult,
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',

    // Setup client validation
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
  });

  // ...
}
```

## Async Validation

Conform supports async validation in a slightly different way. Instead of sending a request to another endpoint, we will simply fallback to server validation when needed.

Here is an example which validates if the email is unique.

```tsx
import { refine } from '@conform-to/zod';

// Instead of sharing a schema, prepare a schema creator
function createSchema(
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
          // Note: The callback cannot be async here
          // As we run zod validation synchronously on the client
          z.string().superRefine((email, ctx) => {
            // This makes Conform to fallback to server validation
            // by indicating that the validation is not defined
            if (typeof options?.isEmailUnique !== 'function') {
              ctx.addIssue({
                code: 'custom',
                message: conformZodMessage.VALIDATION_UNDEFINED,
                fatal: true,
              });
              return;
            }

            // If it reaches here, then it must be validating on the server
            // Return the result as a promise so Zod knows it's async instead
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
    }),
    // ...
}

export function action() {
	const formData = await request.formData();
	const submission = await parseWithZod(formData, {
		// create the zod schema with `isEmailUnique()` implemented
		schema: createSchema({
			async isEmailUnique(email) {
				// ...
			},
		}),

		// Enable async validation on the server
    // We won't set `async: true` on the client
    // as client validation must be synchronous
		async: true,
	});

	// ...
}

export default function Signup() {
	const lastResult = useActionData();
	const [form] = useForm({
		lastResult,
		onValidate({ formData }) {
			return parseWithZod(formData, {
				// Create the schema without implementing `isEmailUnique()`
				schema: createSchema(),
			});
		},
	});

	// ...
}
```

## Skipping Validation

As the schema validates all fields together. This could be expensive especially with async validation. One solution is to minimize the validation by checking the submission intent.

```tsx
import { parseWithZod, conformZodMessage } from '@conform-to/zod';

function createSchema(
  // The `intent` will be provieded by the `parseWithZod` helper
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
        .pipe(
          z.string().superRefine((email, ctx) => {
            const isValidatingEmail =
              intent === null ||
              (intent.type === 'validate' && intent.payload.name === 'email');

            // This make Conform to use the previous result instead
            // by indicating that the validation is skipped
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
    }),
    // ...
}

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = await parseWithZod(formData, {
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
	const lastResult = useActionData();
	const [form] = useForm({
		lastResult,
		onValidate({ formData }) {
			return parseWithZod(formData, {
				// Similar to the action above
				schema: (intent) => createSchema(intent),
			});
		},
	});

	// ...
}
```
