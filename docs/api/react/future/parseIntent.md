# parseIntent

> The `parseIntent` function is part of Conform's future export. These APIs are experimental and may change in minor versions. [Learn more](https://github.com/edmundhung/conform/discussions/954)

`parseIntent` converts a serialized intent string into a typed intent object. Use it when you need to inspect or resolve a submission intent outside React event handling, such as in server actions or custom request pipelines.

```ts
import { parseIntent } from '@conform-to/react/future';

const intent = parseIntent(intentValue, options);
```

## Parameters

### `intentValue: string | null`

The serialized intent value from [`parseSubmission`](./parseSubmission.md) or a submit button.

- `null` is treated as a regular submit intent
- invalid custom intent arguments return `undefined`

### `options.handlers?: Record<string, IntentHandler>`

Optional intent handlers used to parse custom payloads. Conform always includes the built-in intent handlers and merges these custom handlers on top.

## Returns

One of the following:

- a typed known intent when parsing succeeds
- `undefined` when the intent type is unknown or its arguments cannot be parsed safely

## Example

### Parse a configured custom intent

```ts
import {
  configureForms,
  defineIntent,
  parseSubmission,
} from '@conform-to/react/future';

const applyTemplate = defineIntent<
  (title: string, description: string) => void,
  { title: string; description: string }
>({
  parse(title, description) {
    return { title, description };
  },
});

const forms = configureForms({
  intents: {
    applyTemplate,
  },
});

const submission = parseSubmission(formData);
const intent = forms.parseIntent(submission.intent);

if (intent?.type === 'applyTemplate') {
  console.log(intent.payload.title);
}
```

## Tips

### Prefer the bound helper for configured intents

If you already created a customized forms factory with [`configureForms`](./configureForms.md), prefer `forms.parseIntent(...)`. It already includes the factory's global custom intent handlers.
