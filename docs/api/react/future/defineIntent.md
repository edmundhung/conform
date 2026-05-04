# defineIntent

> The `defineIntent` function is part of Conform's future export. These APIs are experimental and may change in minor versions. [Learn more](https://github.com/edmundhung/conform/discussions/954)

`defineIntent` declares a custom intent handler with typed dispatcher arguments and payload. Use it with [`configureForms`](./configureForms.md) or [`useForm`](./useForm.md) to add new intent methods alongside the built-in `validate`, `reset`, `update`, `insert`, `remove`, and `reorder` actions.

```ts
import { defineIntent } from '@conform-to/react/future';

const duplicateTask = defineIntent<
  (name: string, index: number) => void,
  { name: string; index: number }
>({
  // ...
});
```

## Parameters

### `definition: IntentHandler`

An object that describes how the custom intent behaves.

### `definition.parse(...args)`

Converts the serialized intent arguments back into a typed payload.

### `definition.resolve({ value, payload })`

Returns the next form value for this intent. If omitted, the submission payload is used as-is.

### `definition.apply({ result, payload })`

Adjusts the `SubmissionResult` after validation. Use this when the final result depends on validation errors or needs to rewrite the returned error shape.

### `definition.touch({ name, payload })`

Controls which fields become touched after the intent runs.

### `definition.move({ name, status, targetValue, payload })`

Maps existing field names to their next names when the intent changes array positions or nested paths.

If you omit `move`, Conform falls back to invalidating list keys and touched state under the changed paths. That is safe, but it loses item identity and touched state preservation, so implement `move` when your intent reorders, inserts, removes, or otherwise renames fields.

## Returns

The same intent handler object, with the dispatcher arguments and payload wired into TypeScript.

## Example

### Add a custom intent

```tsx
import { configureForms, defineIntent } from '@conform-to/react/future';

const applyTemplate = defineIntent<
  (title: string, description: string) => void,
  { title: string; description: string }
>({
  parse(title, description) {
    if (typeof title !== 'string' || typeof description !== 'string') {
      throw new Error('Invalid applyTemplate arguments');
    }

    return { title, description };
  },
  resolve({ value, payload }) {
    return {
      ...value,
      title: payload.title,
      description: payload.description,
    };
  },
  touch({ name }) {
    return name === 'title' || name === 'description';
  },
});

const { useForm } = configureForms({
  intents: {
    applyTemplate,
  },
});

function Example() {
  const { intent } = useForm();

  return (
    <button
      type="button"
      onClick={() => intent.applyTemplate('Welcome', 'Thanks for signing up')}
    >
      Apply template
    </button>
  );
}
```
