# resolveSubmission

> The `resolveSubmission` function is part of Conform's future export. These APIs are experimental and may change in minor versions. [Learn more](https://github.com/edmundhung/conform/discussions/954)

`resolveSubmission` interprets the intent in a parsed submission and returns the form value produced by it. This lets a server action distinguish a submit intent from a form intent, such as inserting or removing a list item, and validate the updated form value before reporting it back. Use it to support form intent controls through native form submissions as part of progressive enhancement.

If you already created a customized forms factory with [`configureForms`](./configureForms.md), use `forms.resolveSubmission(...)` so the factory's custom intent handlers are included too.

```ts
import {
  parseSubmission,
  resolveSubmission,
  report,
} from '@conform-to/react/future';

const schema = z.object({
  // ...
});

export async function action({ request }) {
  const formData = await request.formData();
  const submission = parseSubmission(formData);
  const { intent, targetValue } = resolveSubmission(submission);
  const result = schema.safeParse(targetValue);

  if (!intent) {
    return new Response('Invalid form intent', { status: 400 });
  }

  if (intent.type !== 'submit' || !result.success) {
    return report(submission, {
      targetValue,
      error: result.success ? null : result.error,
    });
  }

  await save(result.data);

  return report(submission, {
    reset: true,
  });
}
```

## Parameters

### `submission: Submission`

The submission object returned by [`parseSubmission`](./parseSubmission.md).

### `options.handlers?: Record<string, IntentHandler>`

Optional intent handlers used to extend or override the configured intent handlers for this call.

## Returns

An object with the following properties:

- `intent`, the resolved submit intent or form intent, or `undefined` for an invalid form intent
- `targetValue`, the value to validate or save

### Intent resolution

`submission.intent` is the raw intent value. It resolves as follows:

- A missing intent value becomes `{ type: 'submit', payload: undefined }`.
- Values matching the complete `type(...)` pattern are treated as form intents. They resolve through their registered handlers, or to `undefined` when the type is unregistered, the arguments are malformed, or the handler rejects the arguments.
- Every other value becomes a submit intent carrying the original value. For example, `delete` becomes `{ type: 'submit', payload: 'delete' }`.

This allows submit intents to share a field name with form intents:

```ts
const submission = parseSubmission(formData, { intentName: 'intent' });
const { intent, targetValue } = resolveSubmission(submission);

if (intent?.type === 'submit') {
  switch (intent.payload) {
    case 'delete':
      // Delete the validated target value
      break;
    case 'save':
    case undefined:
      // Save the validated target value
      break;
  }
}
```
