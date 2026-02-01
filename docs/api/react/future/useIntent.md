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
- **options.from** (optional): Name of a field to read the value from. When specified, the value is read from this field, validated, and if valid, inserted into the array while the source field is cleared. If validation fails, the insert is cancelled and the error is shown on the source field. Requires the error to be available synchronously.
- **options.onInvalid** (optional): What to do when the insert causes a validation error on the array (e.g., exceeding max items). Currently only supports `'revert'` to cancel the insert. Requires the error to be available synchronously.

### `remove(options): void`

Removes an item from an array field.

- **options.name**: Name of the array field.
- **options.index**: Index of the item to remove.
- **options.onInvalid** (optional): What to do when the remove causes a validation error on the array (e.g., going below min items). Requires the error to be available synchronously.
  - `'revert'`: Cancel the removal, keep the item as-is.
  - `'insert'`: Remove the item but insert a new blank item at the end. Use with `defaultValue` to specify the value.
- **options.defaultValue** (optional): The default value for the new item when `onInvalid` is `'insert'`.

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

### Inserting from another field

Use the `from` option to populate the new array item from another field. The value is validated before inserting. If valid, the value is inserted and the source field is cleared. If invalid, the insert is cancelled and the error is shown on the source field.

```tsx
import { useForm } from '@conform-to/react/future';
import { coerceFormValue } from '@conform-to/zod';
import { z } from 'zod';

const schema = coerceFormValue(
  z.object({
    tags: z
      .array(z.string({ required_error: 'Tag is required' }))
      .max(5, 'Maximum 5 tags'),
    newTag: z.string().optional(),
  }),
);

function Example() {
  const { form, fields, intent } = useForm(schema, {
    // ...
  });
  const tagFields = fields.tags.getFieldList();

  return (
    <form {...form.props}>
      <div>
        {tagFields.map((tag, index) => (
          <div key={tag.key}>
            <input
              type="hidden"
              name={tag.name}
              defaultValue={tag.defaultValue}
            />
            <span>{tag.defaultValue}</span>
            <button
              type="button"
              onClick={() =>
                intent.remove({
                  name: fields.tags.name,
                  index,
                  onInvalid: 'revert',
                })
              }
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <input name={fields.newTag.name} placeholder="New tag..." />
      <div>{fields.newTag.errors}</div>

      <button
        type="button"
        onClick={() =>
          intent.insert({
            name: fields.tags.name,
            from: fields.newTag.name,
          })
        }
      >
        Add Tag
      </button>

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

### Dynamic insert and remove based on synchronous error

Array intents can change behavior based on validation errors when using `onInvalid` on `insert`/`remove` or `from` on `insert`. For example, reverting a remove intent that would go below the minimum item count. These decisions happen immediately, so the error must be available synchronously.

If you're using async validation, ensure array constraints are validated synchronously through a schema or by returning errors directly from `onValidate`:

```tsx
function Example() {
  const { form, fields, intent } = useForm(schema, {
    onValidate({ payload, error }) {
      const emailErrors = error.fieldErrors.email ?? [];

      if (emailErrors.length > 0) {
        return error;
      }

      // Only perform async check if there are no sync email errors
      const errorPromise = validateEmailUniqueness(payload.email).then(
        (message) => {
          if (!message) {
            return error;
          }

          // Merge the synchronous errors with the async email error
          return {
            formErrors: error.formErrors,
            fieldErrors: {
              ...error.fieldErrors,
              email: [message],
            },
          };
        },
      );

      return [
        // Synchronous validation result
        error,
        // Asynchronous validation result
        errorPromise,
      ];
    },
  });

  // ...
}
```
