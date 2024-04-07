# useField

A React hook that returns the field metadata by subscribing to the context set on the **closest** [FormProvider](./FormProvider.md).

```tsx
const [meta, form] = useField(name, options);
```

## Parameters

### `name`

The name of the field.

### `options`

**Optional** with only one option at the moment. If you have a nested form context and you would like to access a field that are not from the closest [FormProvider](./FormProvider.md), you can pass a `formId` to make sure the right field metadata is returned.

## Returns

### `meta`

The field metadata. This is equivalent to `fields.fieldName` with the [useForm](./useForm.md) hook.

### `form`

The form metadata. It is the same object as the one returned by the [useForm](./useForm.md) or [useFormMetadata](./useFormMetadata.md) hook.

## Tips

### Better type-safety with the `FieldName` type

You can use the `FieldName<FieldSchema, FormSchema, FormError>` type instead of `string` to improve the type inference of the field and form metadata returned.

```tsx
import { type FieldName, useField } from '@conform-to/react';

type ExampleComponentProps = {
  name: FieldName<FieldSchema, FormSchema, FormError>;
};

function ExampleComponent({ name }: ExampleComponentProps) {
  // Now it recognize the type of `meta.value`, `meta.errors`, `form.errors` etc
  const [meta, form] = useField(name);

  return <div>{/* ... */}</div>;
}
```

When rendering your component, you will use the name provided by Conform, such as `fields.fieldName.name` which is already typed as `FieldName<FieldSchema, FormSchema, FormError>`. This allows typescript to check if the type is compatible and warn you if it doesn't. You can still pass a `string`, but you will lose the ability for type checking.

```tsx
import { useForm } from '@conform-to/react';

function Example() {
  const [form, fields] = useForm();

  return <ExampleComponent name={fields.fieldName.name} />;
}
```

However, the more specific you made with the `FieldName` type, the harder it is to reuse the component. If your component have no use for some of the generics, you can always omit them.

```ts
type ExampleComponentProps = {
  // If you don't care about the type of value or errors etc
  name: string;
  // If you are accessing the field value
  name: FieldName<number>;
  // If you have a deeply nested form and wanted to access a specific fields at the top
  name: FieldName<number, { fieldName: string }>;
  // If you have a custom error type
  name: FieldName<number, any, CustomFormError>;
};
```
