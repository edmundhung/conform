# FormStateInput

A React component that renders a hidden input to persist the form state in case document reload.

```tsx
import { FormProvider, FormStateInput, useForm } from '@remix-run/react';

export default function SomeParent() {
  const [form, fields] = useForm();

  return (
    <FormProvider context={form.context}>
      <FormStateInput />
    </FormProvider>
  );
}
```

## Props

This component does not accept any props.

## Tips

### You need this only if you are looking for full progressive enhancement

Some of the form state will be lost if the document is reloaded. For example, Conform will only shows the error of the validated fields. But this information will be lost if you are submitting the form with a non-submit intent, such as inserting a new field to the list. By rendering the FormStateInput, Conform will be able to restore the form state and make sure the errors from all validated fields are still displaying.
