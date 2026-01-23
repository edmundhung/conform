# FormOptionsProvider

> **Deprecated**: `FormOptionsProvider` is deprecated and will be removed in the next minor version. Use [`configureForms`](./configureForms.md) instead.

A React component that sets default form options for all forms in your application. Use it to configure validation timing or define custom field metadata.

```tsx
import { FormOptionsProvider } from '@conform-to/react/future';

export default function App() {
  return (
    <FormOptionsProvider shouldValidate="onBlur" shouldRevalidate="onInput">
      {/* Your app components */}
    </FormOptionsProvider>
  );
}
```

## Props

All props are optional. When a prop is not provided, it inherits the default value or from a parent `FormOptionsProvider` if nested.

### `shouldValidate?: 'onSubmit' | 'onBlur' | 'onInput'`

Determines when validation should run for the first time on a field. Default is `onSubmit`.

This option sets the default validation timing for all forms in your application. Individual forms can override this by passing their own `shouldValidate` option to [useForm](./useForm.md).

```tsx
<FormOptionsProvider shouldValidate="onBlur">
  {/* All forms will validate on blur by default */}
</FormOptionsProvider>
```

### `shouldRevalidate?: 'onSubmit' | 'onBlur' | 'onInput'`

Determines when validation should run again after the field has been validated once. Default is the same as `shouldValidate`.

This is useful when you want an immediate update after the user has interacted with a field. For example, validate on blur initially, but revalidate on every input after the first validation.

```tsx
<FormOptionsProvider shouldValidate="onBlur" shouldRevalidate="onInput">
  {/* Validate on blur, but show live feedback after first validation */}
</FormOptionsProvider>
```

### `defineCustomMetadata?: <FieldShape, ErrorShape>(metadata: BaseMetadata<FieldShape, ErrorShape>) => CustomMetadata`

A function that defines custom metadata properties for your form fields. This is particularly useful when integrating with UI libraries or custom form components.

```tsx
import {
  FormOptionsProvider,
  type BaseMetadata,
} from '@conform-to/react/future';
import type { TextField } from './components/TextField';

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
        errors: metadata.errors,
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
<FormOptionsProvider defineCustomMetadata={defineCustomMetadata}>
  <App />
</FormOptionsProvider>;
```

Once defined, custom metadata properties are available on all field metadata objects:

```tsx
function LoginForm() {
  const { form, fields } = useForm({
    // form options
  });

  return (
    <form {...form.props}>
      {/* TypeScript knows about textFieldProps! */}
      <TextField {...fields.email.textFieldProps} />
      <TextField {...fields.password.textFieldProps} />
      <button>Login</button>
    </form>
  );
}
```

### `intentName?: string`

The name of the submit button field that indicates the submission intent. Default is `'__intent__'`.

This is an advanced option. You typically don't need to change this unless you have conflicts with existing field names.

### `serialize(value: unknown) => string | string[] | File | File[] | null | undefined`

A custom serialization function for converting form data.

This is an advanced option. You typically don't need to change this unless you have special serialization requirements.

## Tips

### Conditional metadata based on field shape

You can use TypeScript's conditional types to restrict custom metadata based on the field shape:

```tsx
function defineCustomMetadata<FieldShape, ErrorShape>(
  metadata: BaseMetadata<FieldShape, ErrorShape>,
) {
  return {
    get dateRangePickerProps() {
      // Only available for field with start and end properties
      const rangeFields = metadata.getFieldset<{
        start: string;
        end: string;
      }>();

      return {
        startName: rangeFields.start.name,
        endName: rangeFields.end.name,
        defaultValue: {
          start: rangeFields.start.defaultValue,
          end: rangeFields.end.defaultValue,
        },
        isInvalid: !metadata.valid,
        errors: metadata.errors?.map((error) => `${error}`),
      } satisfies Partial<React.ComponentProps<typeof DateRangePicker>>;
    },
  };
}

declare module '@conform-to/react/future' {
  interface CustomMetadata<FieldShape, ErrorShape> {
    // Make dateRangePickerProps only available if the field shape has start and end properties
    dateRangePickerProps: FieldShape extends { start: string; end: string }
      ? ReturnType<
          typeof defineCustomMetadata<FieldShape, ErrorShape>
        >['dateRangePickerProps']
      : unknown;
  }
}
```
