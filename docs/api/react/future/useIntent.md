# useIntent

> The `useIntent` function is part of Conform's future export. These APIs are experimental and may change in minor versions. [Learn more](https://github.com/edmundhung/conform/discussions/954)

A React hook that returns an intent dispatcher for triggering form actions (validate, reset, update, insert, remove, reorder) without submitting the form. Use it for buttons or controls that need to modify form state.

```ts
import { useIntent } from '@conform-to/react/future';

const intent = useIntent(formRef);
```

## Parameters

### `formRef: FormRef`

A reference to the form element. Can be either:

- A React ref object pointing to a form element (e.g. `React.RefObject<HTMLFormElement>`, `React.RefObject<HTMLButtonElement>`, `React.RefObject<HTMLInputElement>`).
- A form ID string to target a specific form

## Returns

An `IntentDispatcher` object with the following methods:

### `validate(name?: string): void`

Triggers validation for the entire form or a specific field. If you provide a name that includes nested fields (e.g. `user.email`), it will validate all fields within that fieldset.

- **name** (optional): Field name to validate. If omitted, validates the entire form.

### `reset(options?): void`

Resets the form to a specific default value.

- **options.defaultValue** (optional): The value to reset the form to. If not provided, resets to the default value from `useForm`. Pass `null` to clear all fields, or pass a custom object to reset to a specific state.

### `update(options): void`

Updates a field or fieldset with new values.

- **options.name** (optional): Field name to update. If omitted, updates the entire form.
- **options.index** (optional): Array index when updating array fields.
- **options.value**: New value for the field or fieldset.

### `insert(options): void`

Inserts a new item into an array field.

- **options.name**: Name of the array field.
- **options.index** (optional): Position to insert at. If omitted, appends to the end.
- **options.defaultValue** (optional): Default value for the new item.

### `remove(options): void`

Removes an item from an array field.

- **options.name**: Name of the array field.
- **options.index**: Index of the item to remove.

### `reorder(options): void`

Reorders items within an array field.

- **options.name**: Name of the array field.
- **options.from**: Current index of the item.
- **options.to**: Target index to move the item to.

## Examples

### Reusable reset button

```tsx
import { useRef } from 'react';
import { useIntent, useForm } from '@conform-to/react/future';

function ResetButton() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const intent = useIntent(buttonRef);

  return (
    <button type="button" ref={buttonRef} onClick={() => intent.reset()}>
      Reset Form
    </button>
  );
}

function MyForm() {
  const { form } = useForm({
    // ...
  });

  return (
    <form {...form.props}>
      <input name="email" type="email" />
      <input name="password" type="password" />
      <button>Submit</button>
      <ResetButton />
    </form>
  );
}
```

### Enter key to add array item

```tsx
import { useRef } from 'react';
import { useIntent, useForm } from '@conform-to/react/future';

function TagInput({ name }: { name: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const intent = useIntent(inputRef);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      e.preventDefault();
      intent.insert({
        name,
        defaultValue: e.currentTarget.value.trim(),
      });
      e.currentTarget.value = '';
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder="Type and press Enter to add..."
      onKeyDown={handleKeyDown}
    />
  );
}

function MyForm() {
  const { form, fields } = useForm({
    defaultValue: {
      tags: ['react', 'forms'],
    },
  });
  const tagFields = fields.tags.getFieldList();

  return (
    <form {...form.props}>
      <div>
        <label>Tags</label>
        <div>
          {tagFields.map((tag, index) => (
            <span key={tag.key}>
              <input
                type="hidden"
                name={tag.name}
                defaultValue={tag.defaultValue}
              />
              {tag.defaultValue}
            </span>
          ))}
        </div>
        <TagInput name="tags" />
      </div>
      <button>Submit</button>
    </form>
  );
}
```

## Tips

### External buttons with form association

You can create intent buttons outside the form using the `form` attribute:

```tsx
import { useRef } from 'react';
import { useIntent, useForm } from '@conform-to/react/future';

function ResetButton({ form }: { form?: string }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const intent = useIntent(buttonRef);

  return (
    <button
      type="button"
      ref={buttonRef}
      form={form}
      onClick={() => intent.reset()}
    >
      Reset Form
    </button>
  );
}

function MyApp() {
  const { form, fields } = useForm({
    // ...
  });

  return (
    <>
      <form {...form.props}>
        <input name="title" />
        <input name="description" />
        <button type="submit">Submit</button>
      </form>

      {/* Button associated via form attribute */}
      <ResetButton form={form.id} />
    </>
  );
}
```
