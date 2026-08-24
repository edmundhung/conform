# FormBoundary

> The `FormBoundary` component is part of Conform's future export. These APIs are experimental and may change in minor versions. [Learn more](https://github.com/edmundhung/conform/discussions/954)

A React component that delegates input and blur events. This lets controls associated through the `form` attribute participate in validation even when they are rendered outside the `<form>` element.

```tsx
import { FormBoundary, useForm } from '@conform-to/react/future';

export default function Example() {
  return (
    <FormBoundary>
      <Form />
    </FormBoundary>
  );
}

function Form() {
  const { form, fields } = useForm({
    id: 'example',
    shouldValidate: 'onBlur',
  });

  return (
    <>
      <form {...form.props}>
        <button>Submit</button>
      </form>
      <input
        form={form.id}
        name={fields.title.name}
        defaultValue={fields.title.defaultValue}
      />
    </>
  );
}
```

## Props

### `children`

The forms and form-associated controls within the boundary.
