# resolveIntent

> The `resolveIntent` function is part of Conform's future export. These APIs are experimental and may change in minor versions. [Learn more](https://github.com/edmundhung/conform/discussions/954)

`resolveIntent` applies a parsed intent to a submission payload and returns the next form value. Use it when you need the same value transformation logic that `useForm` uses for client-side intents.

```ts
import { resolveIntent } from '@conform-to/react/future';

const value = resolveIntent(submission, { intent, handlers });
```

## Parameters

### `submission: Submission`

The submission object returned by [`parseSubmission`](./parseSubmission.md).

### `options.intent: UnknownIntent | undefined`

The parsed intent to apply. Pass the result of [`parseIntent`](./parseIntent.md).

### `options.handlers?: Record<string, IntentHandler>`

Optional intent handlers used to resolve custom intents. If omitted, Conform uses the built-in future intent handlers.

## Returns

The resolved form value.

- If the intent has a `resolve()` handler, its return value is used
- If there is no intent or no `resolve()` handler, the original submission payload is returned

## Example

### Reuse client intent resolution on the server

```ts
import {
  configureForms,
  defineIntent,
  parseSubmission,
  report,
} from '@conform-to/react/future';

const applyTemplate = defineIntent<
  (title: string, description: string) => void,
  { title: string; description: string }
>({
  parse(title, description) {
    return { title, description };
  },
  resolve({ value, payload }) {
    return {
      ...value,
      title: payload.title,
      description: payload.description,
    };
  },
});

const forms = configureForms({
  intents: {
    applyTemplate,
  },
});

export async function action({ request }) {
  const submission = parseSubmission(await request.formData());
  const intent = forms.parseIntent(submission.intent);
  const value = forms.resolveIntent(submission, { intent });

  return report(submission, {
    value,
  });
}
```

## Tips

### `resolveIntent` does not apply validation-specific result rewriting

`resolveIntent` only computes the next value. If your intent also needs to rewrite the final [`SubmissionResult`](./report.md), put that logic in the intent handler's `apply()` function.
