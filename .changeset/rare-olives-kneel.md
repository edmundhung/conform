---
'@conform-to/react': minor
---

Add metadata customization support to future `useForm` hook

This update introduces a `<FormOptionsProvider />` component that allows users to define global form options, including custom metadata properties that match your form component types when integrating with UI libraries or any custom components:

```tsx
import {
  FormOptionsProvider,
  type BaseMetadata,
} from '@conform-to/react/future';
import { TextField } from './components/TextField';

// Define custom metadata properties that matches the type of our custom form components
function defineCustomMetadata<FieldShape, ErrorShape>(
  metadata: BaseMetadata<FieldShape, ErrorShape>,
) {
  return {
    get textFieldProps() {
      return {
        name: metadata.name,
        defaultValue: metadata.defaultValue,
        isInvalid: !metadata.valid,
      } satisfies Partial<React.ComponentProps<typeof TextField>>;
    },
  };
}

// Extend the CustomMetadata interface with our implementation
// This makes the custom metadata types available on all field metadata objects
declare module '@conform-to/react/future' {
  interface CustomMetadata<FieldShape, ErrorShape>
    extends ReturnType<typeof defineCustomMetadata<FieldShape, ErrorShape>> {}
}

// Wrap your app with FormOptionsProvider
<FormOptionsProvider
  shouldValidate="onBlur"
  defineCustomMetadata={defineCustomMetadata}
>
  <App />
</FormOptionsProvider>;

// Use custom metadata properties in your components
function Example() {
  const { form, fields } = useForm({
    // shouldValidate now defaults to "onBlur"
  });

  return (
    <form {...form.props}>
      <TextField {...fields.email.textFieldProps} />
    </form>
  );
}
```

Additionally, you can now customize the base error shape globally using the `CustomTypes` interface:

```tsx
declare module '@conform-to/react/future' {
  interface CustomTypes {
    errorShape: { message: string; code: string };
  }
}
```

This restricts the error shape expected from forms and improves type inference when using `useField` and `useFormMetadata`.
