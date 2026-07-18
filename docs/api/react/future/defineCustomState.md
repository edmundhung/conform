# defineCustomState

> The `defineCustomState` function is part of Conform's future export. These APIs are experimental and may change in minor versions. [Learn more](https://github.com/edmundhung/conform/discussions/954)

`defineCustomState` lets you add application-specific state to a form. Register the handler with [`configureForms`](./configureForms.md) or [`useForm`](./useForm.md), then read its value from `form.customState`.

```ts
import { defineCustomState } from '@conform-to/react/future';

const submitCount = defineCustomState({
  initialize() {
    return 0;
  },
  handleIntent(count, { intent }) {
    return intent.type === 'submit' ? count + 1 : count;
  },
});
```

Custom state is updated as part of the same transition as Conform's built-in state. Use it for form-specific information that Conform does not model directly, such as submission counters, workflow state, or application-specific status.

## Parameters

### `definition: CustomStateHandler`

An object that defines the initial value and how it changes in response to form transitions.

### `definition.initialize()`

Returns the initial state value. This method is required, and its return value is used to infer the state type.

Conform calls `initialize()` when the state is first created. It also calls it again on reset unless `reset` is `false` or a callback.

### `definition.reset: boolean | ((state, ctx) => State)`

Controls what happens to the custom state when the form resets:

- When omitted or `true`, Conform calls `initialize()` again.
- When `false`, Conform preserves the current state.
- When a callback is provided, its return value becomes the next state.

The callback receives the current state and a context object with the following property:

- `result`: The `SubmissionResult` that requested the reset. It will be `undefined` when the form resets via the `key` option passed to `useForm`.

### `definition.handleIntent(state, ctx)`

Updates the state in response to an intent. Use this when the attempted action matters regardless of its validation result, such as counting submit attempts.

The context contains:

- `intent`: The resolved intent.
- `submission`: The parsed submission associated with the intent.

### `definition.handleResult(state, ctx)`

Updates the state when a form transition sets `result.error` to either an error object or `null`. Use this when the next state depends on whether validation or submission succeeded or failed.

The context contains:

- `intent`: The resolved intent.
- `result`: The `SubmissionResult`, including its parsed submission, target value, and error.
- `phase`: The source of the result, either `'client'` or `'server'`.

`result.error` is `null` when the result has no error and an object when validation failed.

The `'client'` phase covers synchronous and asynchronous client validation. The `'server'` phase covers results supplied through `lastResult` or `ctx.update(...)` inside `onSubmit`.

## Returns

Returns the definition unchanged. `defineCustomState` provides type checking and inference for the state value and handler arguments.

## Examples

### Submit count

Use `handleIntent` to count every submit attempt.

```ts
const submitCount = defineCustomState({
  initialize() {
    return 0;
  },
  handleIntent(count, { intent }) {
    return intent.type === 'submit' ? count + 1 : count;
  },
});
```

### Failed submit count

Use `handleResult` when the state depends on the validation result.

```ts
const failedSubmitCount = defineCustomState({
  initialize() {
    return 0;
  },
  handleResult(count, { intent, result }) {
    if (intent.type === 'submit' && result.error) {
      return count + 1;
    }

    return count;
  },
});
```

### Submission status

Track the status of the latest submission. The state starts as `undefined`, changes to `'error'` when validation fails, and changes to `'success'` only if the server result is successful. Use the `reset` callback to handle responses that also reset the form, such as a create form that clears its fields after adding an entry.

```ts
const submissionStatus = defineCustomState<'success' | 'error' | undefined>({
  initialize() {
    return undefined;
  },
  reset(_, { result }) {
    if (typeof result?.error === 'undefined') {
      return undefined;
    }

    return result.error ? 'error' : 'success';
  },
  handleResult(status, { intent, result, phase }) {
    if (intent.type !== 'submit') {
      return status;
    }

    if (result.error) {
      return 'error';
    }

    if (phase === 'server') {
      return 'success';
    }

    return status;
  },
});
```

## Tips

### Registering custom state

Register a handler with `configureForms` to make it available to every form created by that factory:

```tsx
const { useForm } = configureForms({
  customState: {
    submitCount,
  },
});

function Example() {
  const { form } = useForm();

  return <output>{form.customState.submitCount}</output>;
}
```

Alternatively, register a handler for a single form with `useForm`:

```tsx
function Example() {
  const { form } = useForm({
    customState: {
      submitCount,
    },
  });

  return <output>{form.customState.submitCount}</output>;
}
```
