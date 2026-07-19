# resolveSubmission

> The `resolveSubmission` function is part of Conform's future export. These APIs are experimental and may change in minor versions. [Learn more](https://github.com/edmundhung/conform/discussions/954)

`resolveSubmission` gives you the value to validate or save for a submission. Use it for progressive enhancement in server actions.

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
    return new Response('Unknown intent', { status: 400 });
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

- `intent`, the parsed intent, or `undefined` when the intent type is unknown or invalid
- `targetValue`, the value to validate or save

If Conform cannot resolve the intent, `targetValue` falls back to the original submission payload.
