# parseSubmission

> The `parseSubmission` function is part of Conform's future export. These APIs are experimental and may change in minor versions. [Learn more](https://github.com/edmundhung/conform/discussions/954)

A utility function that parses `FormData` or `URLSearchParams` into a structured submission object that includes a nested payload with intent and field names extracted. Field names are parsed using these conventions:

- `name` → `{ name: "value" }`
- `object.property` → `{ object: { property: "value" } }`
- `array[0]` → `{ array: ["value"] }`
- `items[]` → `{ items: ["value1", "value2"] }`

```ts
import { parseSubmission } from '@conform-to/react/future';

const submission = parseSubmission(formData, options);
```

## Parameters

### `formData: FormData | URLSearchParams`

The form data to parse, typically from:

- Request: `await request.formData()` or `new URLSearchParams(request.url)`
- Form element: `new FormData(form)`
- URL: `new URLSearchParams(searchString)`

### `options.intentName?: string`

The name of the submit button field that indicates the submission intent. Defaults to `__INTENT__`.

### `options.skipEntry?: (name: string) => boolean`

A function to exclude specific form fields from being parsed. Return `true` to skip the entry.

## Returns

A `Submission` object containing:

### `payload: Record<string, unknown>`

The parsed form values structured as nested objects and arrays based on field naming conventions.

### `fields: string[]`

List of field names that were present in the form data.

### `intent: string | null`

The submission intent (button value) if an intent button was found, otherwise `null`.

## Example

### React Router Action function

```tsx
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const submission = parseSubmission(formData);

  // validate and process submission...
}

// You can also do this with clientAction
export async function clientAction({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const submission = parseSubmission(formData);

  // validate and process submission...
}
```

### Next.js Server Action function

```tsx
export async function createUser(prevState: unknown, formData: FormData) {
  'use server';

  const submission = parseSubmission(formData);

  // validate and save user...
}
```

### Client-side live value subscription

```tsx
function MyForm() {
  const formRef = useRef<HTMLFormElement>(null);

  // Subscribe to live form data changes
  const payload = useFormData(formRef, (formData) =>
    formData ? parseSubmission(formData).payload : null,
  );

  return (
    <form ref={formRef}>
      <input name="user.name" />
      <input name="user.email" />

      {/* Show live parsed data */}
      <pre>{JSON.stringify(payload, null, 2)}</pre>
    </form>
  );
}
```
