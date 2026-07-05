# defineCustomState

> The `defineCustomState` function is part of Conform's future export. These APIs are experimental and may change in minor versions. [Learn more](https://github.com/edmundhung/conform/discussions/954)

`defineCustomState` lets you keep derived state alongside Conform's built-in form state. Register custom state through [`configureForms`](./configureForms.md) or [`useForm`](./useForm.md), then read it from `form.customState`.

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

## Parameters

### `definition: CustomStateHandler`

An object that describes how to initialize and update the custom state.

### `definition.initialize({ reset, lastState })`

Creates the initial state value. This method is required.

`reset` is `true` when Conform is resetting the form state. `lastState` contains the previous value for this custom state key when one exists.

```ts
initialize({ reset, lastState }) {
  if (reset && lastState) {
    return lastState;
  }

  return 'idle';
}
```

### `definition.handleIntent(state, ctx)`

Updates state when Conform applies an intent. Use this for state derived from the intent itself, such as submit counts, timestamps, or the last attempted payload.

`ctx` contains:

- `intent`: The resolved intent.
- `submission`: The parsed submission.

### `definition.handleResult(state, ctx)`

Updates state when Conform applies a validation or submission result. Use this for state derived from success, failure, or errors.

`ctx` contains:

- `intent`: The resolved intent.
- `submission`: The parsed submission.
- `error`: The result error. `undefined` means the result is not known yet, `null` means the result has no error, and an object means validation failed.
- `phase`: Either `'client'` or `'server'`.

`phase: 'client'` is used for client validation results, including async validation. `phase: 'server'` is used for server or application results, including `lastResult` and `onSubmit().update(...)`.

## Returns

The same custom state handler object, with the state and custom intent types wired into TypeScript.

## Examples

### Submit count

Use `handleIntent` when the state should change because the user attempted an intent.

```ts
const submitCount = defineCustomState({
  initialize() {
    return 0;
  },
  handleIntent(count, { intent }) {
    if (intent.type === 'submit') {
      return count + 1;
    }

    return count;
  },
});
```

### Failed submit count

Use `handleResult` when the state depends on the result.

```ts
const failedSubmitCount = defineCustomState({
  initialize() {
    return 0;
  },
  handleResult(count, { intent, error }) {
    if (intent.type === 'submit' && error) {
      return count + 1;
    }

    return count;
  },
});
```

### Submission status

Use both methods when you want to record that an intent happened, then update based on the result.

```ts
const submissionStatus = defineCustomState<
  'idle' | 'submitted' | 'success' | 'error'
>({
  initialize() {
    return 'idle';
  },
  handleIntent(status, { intent }) {
    if (intent.type === 'submit') {
      return 'submitted';
    }

    return status;
  },
  handleResult(status, { intent, error, phase }) {
    if (intent.type !== 'submit') {
      return status;
    }

    if (error) {
      return 'error';
    }

    if (phase === 'server' && error === null) {
      return 'success';
    }

    return status;
  },
});
```

## Registering Custom State

Register custom state globally with [`configureForms`](./configureForms.md):

```ts
const forms = configureForms({
  customState: {
    submitCount,
  },
});
```

Or register it for one form with [`useForm`](./useForm.md):

```tsx
const { form } = useForm({
  customState: {
    submitCount,
  },
});

form.customState.submitCount;
```
