# useFormMetadata

A React hook that returns the form metadata by subscribing to the context set on the [FormProvider](./FormProvider.md).

```tsx
const form = useFormMetadata(formId);
```

## Parameters

### `formId`

The id attribute that is set on the form element.

## Returns

### `form`

The form metadata. It is the same object as the one returned by the [useForm](./useForm.md) hook.

## Tips

### Better type inference with the `FormId` type

You can use the `FormId<Schema, FormError>` type instead of `string` to improve the type inference of the form metadata.

```tsx
import { type FormId, useFormMetadata } from '@conform-to/react';

type ExampleComponentProps = {
  formId: FormId<Schema, FormError>;
};

function ExampleComponent({ formId }: ExampleComponentProps) {
  // Now it recognize the type of `form.errors` and the result of `form.getFieldset()`
  const form = useFormMetadata(formId);

  return <div>{/* ... */}</div>;
}
```

When rendering your component, you will use the form id provided by Conform, such as `form.id` or `fields.fieldName.formId` which are already typed as `FormId<Schema, FormError>`. This allows typescript to check if the type is compatible and warn you if it doesn't. You can still pass a `string`, but you will lose the ability for type checking.

```tsx
import { useForm } from '@conform-to/react';

function Example() {
  const [form, fields] = useForm();

  return (
    <>
      <ExampleComponent formId={form.id} />
      <ExampleComponent formId={fields.fieldName.formId} />
    </>
  );
}
```

However, the more specific you made with the `FormId` type, the harder it is to reuse the component. If your component have no use of the `Schema` or `FormError` generics, you can keep it simple and type it as `string` as well.

```ts
type ExampleComponentProps = {
  // If you don't care about the type of Schema or FormError
  formId: string;
  // If you are accessing a specific field from the form metadata
  formId: FormId<{ fieldName: string }>;
  // If you have a custom error type
  formId: FormId<Record<string, any>, CustomFormError>;
};
```
