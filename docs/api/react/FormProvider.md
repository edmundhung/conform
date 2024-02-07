# FormProvider

A React component that renders a [Context Provider](https://react.dev/reference/react/createContext#provider) for the form context. It is required if you want to use [useField](./useField.md) or [useFormMetadata](./useFormMetadata.md) hook.

```tsx
import { FormProvider, useForm } from '@remix-run/react';

export default function SomeParent() {
  const [form, fields] = useForm();

  return <FormProvider context={form.context}>{/* ... */}</FormProvider>;
}
```

## Props

### `context`

The form context. It is created with [useForm](./useForm.md) and can be accessed through `form.context`.

## Tips

### FormProvider does not need to be a direct parent of the form

You are free to put your inputs anywhere outside of the form as long as they are associated through the [form attribute](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement#instance_properties_related_to_the_parent_form).

```tsx
function Example() {
  const [form, fields] = useForm();
  return (
    <FormProvider context={form.context}>
      <div>
        <form id={form.id} />
      </div>
      <div>
        <input name={fields.title.name} form={form.id} />
      </div>
    </FormProvider>
  );
}
```

### FormProvider can be nested

This is useful if you need to have one form inside another due to layout constraint.

```tsx
import { FormProvider, useForm } from '@remix-run/react';

function Field({ name, formId }) {
  //  useField will looks for the closest FormContext if no formId is provided
  const [meta] = useField(name, { formId });

  return <input name={meta.name} form={meta.form} />;
}

function Parent() {
  const [form, fields] = useForm({ id: 'parent' });
  return (
    <FormProvider context={form.context}>
      <form id={form.id} />

      <Field name={fields.category.name} />
      <Child />
    </FormProvider>
  );
}

function Child() {
  const [form, fields] = useForm({ id: 'child' });

  return (
    <FormProvider context={form.context}>
      <form id={form.id} />
      <Field name={fields.title.name} />

      {/* This will looks for the form context with the id 'parent' instead */}
      <Field name={fields.bar.name} formId="parent" />
    </FormProvider>
  );
}
```
