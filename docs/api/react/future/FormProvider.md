# FormProvider

> The `FormProvider` component is part of Conform's future export. These APIs are experimental and may change in minor versions. [Learn more](https://github.com/edmundhung/conform/discussions/954)

A React component that provides form context to child components. Required for [useField](./useField.md) and [useFormMetadata](./useFormMetadata.md) hooks.

```tsx
import { FormProvider, useForm } from '@conform-to/react/future';

export default function SomeParent() {
  const { form } = useForm();

  return <FormProvider context={form.context}>{/* ... */}</FormProvider>;
}
```

## Props

### `context`

The form context. It is created with [useForm](./useForm.md) and can be accessed through `form.context`.

## Tips

### FormProvider can be nested

This is useful if you need to have one form inside another due to layout constraints.

```tsx
import { FormProvider, useForm, useField } from '@conform-to/react/future';

function Layout({ children }) {
  const { form, fields } = useForm({ id: 'search' });

  return (
    <FormProvider context={form.context}>
      <aside>
        <form {...form.props}>
          <Field name={fields.query.name} />
          <button>Search</button>
        </form>
      </aside>
      <main>{children}</main>
    </FormProvider>
  );
}

function LoginForm() {
  const { form, fields } = useForm({ id: 'login' });

  return (
    <Layout>
      <FormProvider context={form.context}>
        <form {...form.props}>
          <Field name={fields.username.name} />
          <Field name={fields.password.name} />
          <button>Login</button>
        </form>
      </FormProvider>
    </Layout>
  );
}

function Field({ name, formId }) {
  //  useField will look for the closest FormContext if no formId is provided
  const field = useField(name, { formId });

  return <input name={field.name} form={field.form} />;
}
```
