# useForm

A React hook that returns the form and field metadata to enhance a HTML form.

```tsx
const [form, fields] = useForm(options);
```

## Options

All the options below are optional.

### `id`

The id attribute to be set on the form element. If not provided, a random id will be generated instead. It will be also used to generate the ids for each field.

### `lastResult`

The result of the last submission. This is usually sent from the server and will be used as the initial state of the form for progressive enhancement.

### `defaultValue`

The initial value of the form.

### `constraint`

The validation attributes to be set on each field.

### `shouldValidate`

Define when Conform should start validating each field with 3 options: **onSubmit**, **onBlur** and **onInput**. Default to **onSubmit**.

### `shouldRevalidate`

Define when Conform should re-validate each field after it is validated. Default to the value of **shouldValidate**.

### `shouldDirtyConsider`

Define if Conform should consider the field for dirty state. e.g. Excluding form fields that are not managed by Conform such as CSRF token.

### `onValidate`

A function to be called when the form should be (re)validated.

### `onSubmit`

A function to be called before the form is submitted. If **onValidate** is set, it will be called only if the client validation passes.

### `defaultNoValidate`

Enable constraint validation before the DOM is hydrated. Default to **true**.

## Return Value

### `form`

This is the form metadata. It provides information necessary for the state and operation of the form.

#### `id` (string)

The `id` attribute set for the form element.

#### `errorId` (string)

The `id` attribute indicating the form's error message.

#### `descriptionId` (string)

The `id` attribute indicating the form's description.

#### `name` (FieldName<Schema, FormSchema, FormError>)

The name of the form.

#### `initialValue` (FormValue<Schema>)

The initial value of the form set by `useForm`.

#### `value` (FormValue<Schema>)

The current value of the form.

#### `allErrors` (Record<string, FormError>)

Validation errors for each field in the form. The key is the field name, and the value is an array of error messages.

#### `valid` (boolean)

Indicates whether the form is valid. If `true`, the form has passed validation checks.

#### `dirty` (boolean)

Indicates whether any field in the form has been focused at least once.

#### `status` ('success' | 'error' | undefined)

Indicates the submission result of the form. `success` means success, `error` means failure, and `undefined` means not submitted.

#### `getFieldset` (function)

A function that returns metadata for each field in the form.

#### `onSubmit` (function)

A function for submitting the form.

#### `noValidate` (boolean)

Indicates whether the browser's default form validation is disabled. The default is `true`, meaning validation is handled via JavaScript.

#### `validate` (object)

Provides an intent for validation.

#### `reset` (object)

Provides an intent for resetting the form or fields.

#### `update` (object)

Provides an intent for modifying the form or fields.

#### `reorder` (object)

Provides an intent for changing the order of fields.

#### `remove` (object)

Provides an intent for removing fields from the form.

#### `insert` (object)

Provides an intent for inserting fields into the form.

## Tips

### Client validation is optional

Conform supports live validation (i.e. validate when the user leaves the input or types) without client validation. This is useful to avoid shipping the validation code in the client bundle. But please keep in mind network latency and how frequently your users might hit the server especially if you are revalidating every time they type.

### Automatic form reset when `id` is changed

You can pass a different `id` to the `useForm` hook to reset the form. This is useful when you are navigating to another page with the same form. (e.g. `/articles/foo` -> `/articles/bar`)

```tsx
interface Article {
  id: string;
  title: string;
  content: string;
}

function EditArticleForm({ defaultValue }: { defaultValue: Article }) {
  const [form, fields] = useForm({
    id: `article-${defaultValue.id}`,
    defaultValue,
  });

  // ...
}
```
