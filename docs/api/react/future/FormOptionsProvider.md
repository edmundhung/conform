# FormOptionsProvider

> The `FormOptionsProvider` component is part of Conform's future export. These APIs are experimental and may change in minor versions. [Learn more](https://github.com/edmundhung/conform/discussions/954)

A React component that provides global form options to all forms in your application.

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

### `intentName?: string`

The name of the submit button field that indicates the submission intent. Default is `'__intent__'`. You typically don't need to change this unless you have conflicts with existing field names.

### `serialize(value: unknown) => string | string[] | File | File[] | null | undefined`

A custom serialization function for converting form data.

### `getConstraint?: (schema) => Record<string, Constraint> | null`

A function that derives HTML validation attributes from your schema. This is useful when you want to automatically derive HTML attributes like `required`, `minLength`, `maxLength`, `min`, `max`, `pattern`, etc. from your schema.

```tsx
import { FormOptionsProvider } from '@conform-to/react/future';
import { getZodConstraint } from '@conform-to/zod/v3/future';
// For Zod 4: import { getZodConstraint } from '@conform-to/zod/v4/future';
// For valibot: import { getValibotConstraint } from '@conform-to/valibot/future';

<FormOptionsProvider getConstraint={getZodConstraint}>
  <App />
</FormOptionsProvider>;
```

Individual forms can override the derived constraints by providing their own `constraint` option:

```tsx
const { form, fields } = useForm(schema, {
  constraint: {
    username: { required: true, pattern: '[a-z]+' }, // Override default constraints derived from schema
  },
  onSubmit(event, { value }) {
    // handle submission
  },
});
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

### `validateSchema?: (schema, context) => { error, value? } | Promise<{ error, value? }>`

A function that customizes how schemas are validated globally across your application. The default implementation uses Standard Schema V1's `validate` method.

This is useful if you want to use Zod with custom error maps or other schema libraries that don't implement Standard Schema:

```tsx
import { FormOptionsProvider } from '@conform-to/react/future';
import { formatResult } from '@conform-to/zod/v3/future';
import type { z } from 'zod';

declare module '@conform-to/react/future' {
  interface CustomSchema<Schema> {
    baseType: z.ZodTypeAny;
    input: Schema extends z.ZodTypeAny ? z.input<Schema> : unknown;
    output: Schema extends z.ZodTypeAny ? z.output<Schema> : unknown;
    options: Partial<z.ParseParams>;
  }
}

<FormOptionsProvider
  validateSchema={(schema, { payload, schemaOptions }) => {
    // Implementation based on https://github.com/colinhacks/zod/blob/5e6c0fd7471636feffe5763c9b7637879da459fe/packages/zod/src/v4/core/schemas.ts#L304-L316
    try {
      const result = schema.safeParse(payload, schemaOptions);
      return formatResult(result);
    } catch {
      return schema.safeParseAsync(payload, schemaOptions).then(formatResult);
    }
  }}
>
  <App />
</FormOptionsProvider>;
```

Individual forms can now provide `schemaOptions` to customize validation:

```tsx
const { form, fields } = useForm(schema, {
  schemaOptions: { errorMap: customErrorMap },
  onSubmit(event, { value }) {
    // handle submission
  },
});
```

## Tips

### Schema Type Inference with Valibot

If you're using Valibot instead of Zod, you can declare the `CustomSchema` interface for type inference like so:

```tsx
import type {
  GenericSchema,
  GenericSchemaAsync,
  InferInput,
  InferOutput,
  InferIssue,
  Config,
} from 'valibot';

declare module '@conform-to/react/future' {
  interface CustomSchema<Schema> {
    baseType: GenericSchema | GenericSchemaAsync;
    input: Schema extends GenericSchema | GenericSchemaAsync
      ? InferInput<Schema>
      : unknown;
    output: Schema extends GenericSchema | GenericSchemaAsync
      ? InferOutput<Schema>
      : unknown;
    options: Config<InferIssue<Schema>>;
  }
}
```

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
