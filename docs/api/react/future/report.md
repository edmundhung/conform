# report

> The `report` function is part of Conform's future export. These APIs are experimental and may change in minor versions. [Learn more](https://github.com/edmundhung/conform/discussions/954)

A utility function that creates a `SubmissionResult` object from a submission to add validation results and target value with options to strip files and hide sensitive fields.

```ts
import { report } from '@conform-to/react/future';

const result = report(submission, options);
```

## Parameters

### `submission: Submission`

The form submission object created by [`parseSubmission(formData)`](./parseSubmission.md). Contains parsed form data with structured payload, field names, and submission intent.

### `options.error?: { issues?: StandardSchemaV1.Issue[]; formErrors?: ErrorShape[]; fieldErrors?: Record<string, ErrorShape[]> } | null`

Error information to include in the result. Can contain:

- `issues?: StandardSchemaV1.Issue[]` - Standard schema issues that will be automatically formatted. Zod and Valibot issues are also compatible.
- `formErrors?: ErrorShape[]` - Form-level error messages
- `fieldErrors?: Record<string, ErrorShape[]>` - Field-specific error messages mapped by field name

Set to `null` to indicate validation passed with no errors. When both `issues` and `formErrors` / `fieldErrors` are provided, they will be merged together, with `issues` being formatted first.

### `options.value?: Record<string, unknown> | null`

The form value to set. Use this to update the form or reset it to a specific value when combined with reset: true.

### `options.keepFiles?: boolean`

Controls whether file objects are preserved in the submission payload:

- `false` (default) - Files are stripped from the payload since they cannot be used to initialize file inputs
- `true` - Files are preserved

### `options.hideFields?: string[]`

Array of field names to hide from the result by setting them to `undefined` in both the submission payload and value. Primarily used for sensitive data like passwords that should not be sent back to the client.

```ts
report(submission, {
  hideFields: ['password', 'confirmPassword'],
});
```

### `options.reset?: boolean`

Indicates whether the form should be reset to its initial state.

## Returns

A `SubmissionResult` object containing:

### `submission: Submission`

The processed submission object. May have modified payload if some fields were hidden or files are stripped.

### `targetValue?: Record<string, unknown> | null`

The form value to apply, if different from the submission payload.

### `error?: FormError | null`

Validation result, if any was provided in the options.

### `reset?: boolean`

Indicates whether the form should be reset to its initial state.

## Example

### Basic error reporting

```tsx
// Report validation errors
const result = report(submission, {
  error: {
    fieldErrors: {
      email: ['Email is required'],
      password: ['Password must be at least 8 characters'],
    },
  },
});
```

### Resetting form after successful submission

```tsx
// Reset form after successful submission
const result = report(submission, {
  reset: true,
});
```

### Hiding sensitive fields

```tsx
// Hide password fields from being sent back to client
const result = report(submission, {
  hideFields: ['password', 'confirmPassword'],
  error: validationErrors,
});
```
