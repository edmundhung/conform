# defineIntent

> The `defineIntent` function is part of Conform's future export. These APIs are experimental and may change in minor versions. [Learn more](https://github.com/edmundhung/conform/discussions/954)

`defineIntent` lets you define a custom intent that you can register with [`configureForms`](./configureForms.md) or [`useForm`](./useForm.md).

```ts
import { defineIntent } from '@conform-to/react/future';

const duplicateTask = defineIntent<(name: string) => void>({
  // ...
});
```

## Parameters

### `definition: IntentHandler`

An object that describes how the custom intent behaves.

Most custom intents only need `parse(...)`. Add `resolve(...)` when the intent should change the value that gets validated or saved.

### `definition.parse(...args)`

Use this to read the arguments passed to the intent and turn them into the typed payload consumed by the other handler methods.

In most cases, this is the first method you should implement.

### `definition.resolve({ value, payload })`

Use this when the intent should update the form value, like `update` or `insert` intents.

```ts
resolve({ value, payload }) {
  return setPathValue(
    value,
    payload.to,
    getPathValue(value, payload.from)
  );
}
```

### `definition.apply({ result, payload })`

Use this to adjust the submission result. For example, the built-in `reset` intent uses this to return `{ reset: true }`, while `insert` uses it to adjust the result based on validation errors.

### `definition.touch({ name, payload })`

Use this when the intent should mark fields as touched. For example, the built-in `validate` intent marks the specified field as touched by checking whether `name === payload`, or marks all fields as touched by returning `true`.

### `definition.move({ name, status, targetValue, payload })`

Use this when the intent moves list items and you want to preserve their state.

If you omit `move`, Conform falls back to invalidating the affected state under the changed paths.

## Returns

The same intent handler object, with the dispatcher arguments and payload wired into TypeScript.

## Example

For example, this adds `intent.copyField(options)` that copies the value from one field to another.

```tsx
import { getPathValue, setPathValue } from '@conform-to/dom/future';
import type { FieldName } from '@conform-to/react/future';
import { configureForms, defineIntent } from '@conform-to/react/future';
import { AddressField } from './AddressField';

type CopyField = <FieldShape>(options: {
  from: FieldName<FieldShape>;
  to: FieldName<FieldShape>;
}) => void;

const copyField = defineIntent<CopyField>({
  parse(options) {
    if (
      typeof options !== 'object' ||
      options === null ||
      typeof options.from !== 'string' ||
      typeof options.to !== 'string'
    ) {
      throw new Error('Invalid copyField arguments');
    }

    return options;
  },
  resolve({ value, payload }) {
    const source = getPathValue(value, payload.from);
    const result = setPathValue(value, payload.to, source);

    return result;
  },
  touch({ name, payload }) {
    return name === payload.to;
  },
});

const forms = configureForms({
  intents: {
    copyField,
  },
});

function Example() {
  const { form, fields, intent } = forms.useForm({
    defaultValue: {
      billing: {
        street: '123 Main St',
        city: 'Paris',
      },
      shipping: {
        street: '',
        city: '',
      },
    },
  });

  return (
    <form {...form.props}>
      <AddressField name={fields.billing.name} />
      <AddressField name={fields.shipping.name} />
      <button
        type="button"
        onClick={() =>
          intent.copyField({
            from: fields.billing.name,
            to: fields.shipping.name,
          })
        }
      >
        Copy billing address to shipping
      </button>
    </form>
  );
}
```
