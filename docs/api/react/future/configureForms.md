# configureForms

> The `configureForms` function is part of Conform's future export. These APIs are experimental and may change in minor versions. [Learn more](https://github.com/edmundhung/conform/discussions/954)

A factory function that creates customized form hooks based on the provided configurations. Use this to integrate Conform with any schema libraries, and to extend form and fields metadata for UI component libraries.

```ts
import { configureForms } from '@conform-to/react/future';

const { FormProvider, useForm, useFormMetadata, useField, useIntent } =
  configureForms({
    // configs...
  });
```

## Options

### `intentName?: string`

The name of the submit button field that indicates the submission intent. Default is `'__intent__'`.

This is an advanced option. You typically don't need to change this unless you have conflicts with existing field names.

### `serialize?: Serialize`

A custom serialization function for converting form data.

This is an advanced option. You typically don't need to change this unless you have special serialization requirements.

### `shouldValidate?: 'onSubmit' | 'onBlur' | 'onInput'`

Determines when validation should run for the first time on a field. Default is `onSubmit`.

This option sets the default validation timing for all forms in your application. Individual forms can override this by passing their own `shouldValidate` option to [useForm](./useForm.md).

### `shouldRevalidate?: 'onSubmit' | 'onBlur' | 'onInput'`

Determines when validation should run again after the field has been validated once. Default is the same as `shouldValidate`.

This is useful when you want an immediate update after the user has interacted with a field. For example, validate on blur initially, but revalidate on every input after the first validation.

### `isError?: (error: unknown) => error is BaseErrorShape`

Type guard that defines your custom error shape for TypeScript inference. Use the `shape<T>()` helper to create a type-only marker:

```ts
import { configureForms, shape } from '@conform-to/react/future';

const { useForm } = configureForms({
  isError: shape<string>(),
});
```

The `shape<T>()` helper always returns `true` at runtime. It exists purely to capture the type parameter for compile-time checking.

### `isSchema?: (schema: unknown) => schema is BaseSchema`

Type guard that determines what schemas are accepted by `useForm(schema, options)`.

### `validateSchema?: (schema, payload, options?) => { error, value? }`

Validates form data against a schema. Returns validation errors and optionally the parsed value.

### `getConstraints?: (schema) => Record<string, ValidationAttributes> | undefined`

Extracts HTML validation attributes (required, minLength, pattern, etc.) from a schema.

### `extendFormMetadata?: (metadata) => CustomFormMetadata`

Extends form metadata with custom properties. The returned object is merged into the form metadata.

### `extendFieldMetadata?: (metadata, ctx) => CustomFieldMetadata`

A function that extends field metadata with custom properties. This is particularly useful when integrating with UI libraries or custom form components.

Use `ctx.when` for properties that depend on the field's shape.

## Returns

An object containing customized versions of the form hooks:

### `FormProvider`

React component that provides form context. See [FormProvider](./FormProvider.md).

### `useForm`

Main form hook with schema-first signature support. See [useForm](./useForm.md).

### `useFormMetadata`

Hook to access form metadata from context. See [useFormMetadata](./useFormMetadata.md).

### `useField`

Hook to access field metadata from context. See [useField](./useField.md).

### `useIntent`

Hook to get an intent dispatcher. See [useIntent](./useIntent.md).

### `config`

The resolved configuration object. Spread this into another `configureForms` call to reuse and extend the configuration:

```ts
const base = configureForms({
  getConstraints,
  shouldValidate: 'onBlur',
});

// Extend base config with custom field metadata
const { useForm } = configureForms({
  ...base.config,
  extendFieldMetadata(metadata) {
    return {
      /* ... */
    };
  },
});
```

## Tips

### Extracting HTML constraints from schema

Use `getConstraints` to derive HTML validation attributes (`required`, `minLength`, `pattern`, etc.) from your schema:

```ts
// For Zod v3
import { getConstraints } from '@conform-to/zod/v3/future';

// For Zod v4
import { getConstraints } from '@conform-to/zod/v4/future';

// For Valibot
import { getConstraints } from '@conform-to/valibot/future';
```

```ts
import { configureForms } from '@conform-to/react/future';
import { getConstraints } from '@conform-to/zod/v3/future';

export const { useForm } = configureForms({
  getConstraints,
});
```

### Customizing schema validation

By default, Conform supports [Standard Schema](https://github.com/standard-schema/standard-schema) which works with Zod and Valibot out of the box.

If you need custom validation behavior (e.g., custom error formatting) or to support other schema libraries, provide your own `isSchema` and `validateSchema` functions. You can also augment the `CustomSchemaTypes` interface for full type inference:

```ts
import { configureForms } from '@conform-to/react/future';
import { formatResult } from '@conform-to/zod/v3/future';
import type { ZodTypeAny, input, output } from 'zod';
import { z } from 'zod';

declare module '@conform-to/react/future' {
  interface CustomSchemaTypes<Schema> {
    input: Schema extends ZodTypeAny ? input<Schema> : never;
    output: Schema extends ZodTypeAny ? output<Schema> : never;
    options: Schema extends ZodTypeAny ? { errorMap?: z.ZodErrorMap } : never;
  }
}

export const { useForm } = configureForms({
  isSchema(schema): schema is z.ZodTypeAny {
    return schema instanceof z.ZodType;
  },
  validateSchema(schema, payload, options) {
    try {
      const result = schema.safeParse(payload, options);
      return formatResult(result);
    } catch {
      return schema.safeParseAsync(payload, options).then(formatResult);
    }
  },
});
```

### Integrating with UI libraries

Use `extendFormMetadata` and `extendFieldMetadata` to generate props objects that match your UI library's API:

```ts
import { configureForms, shape } from '@conform-to/react/future';

configureForms({
  extendFormMetadata(metadata) {
    return {
      get props() {
        return {
          ...metadata.props,
          isInvalid: !metadata.valid,
          errors: metadata.errors,
        } satisfies Partial<React.ComponentProps<typeof Form>>;
      },
    };
  },
  extendFieldMetadata(metadata, { when }) {
    return {
      // Available on all fields
      get textFieldProps() {
        return {
          name: metadata.name,
          defaultValue: metadata.defaultValue,
          required: metadata.required,
          isInvalid: !metadata.valid,
          errors: metadata.errors,
        } satisfies Partial<React.ComponentProps<typeof TextField>>;
      },
      // Only available for fields with a specific shape
      get dateRangePickerProps() {
        return when(
          metadata,
          shape<{ start: string; end: string }>(),
          ({ valid, errors, getFieldset }) => {
            const rangeFields = getFieldset();

            return {
              startName: rangeFields.start.name,
              endName: rangeFields.end.name,
              defaultValue: {
                start: rangeFields.start.defaultValue,
                end: rangeFields.end.defaultValue,
              },
              isInvalid: !valid,
              errors,
            } satisfies Partial<React.ComponentProps<typeof DateRangePicker>>;
          },
        );
      },
    };
  },
});
```

### Exporting types for custom metadata

Use `InferFormMetadata` and `InferFieldMetadata` to export types that include your custom metadata:

```ts
import {
  configureForms,
  type InferFormMetadata,
  type InferFieldMetadata,
} from '@conform-to/react/future';

const result = configureForms({
  extendFieldMetadata(metadata) {
    return {
      get inputProps() {
        return { name: metadata.name, defaultValue: metadata.defaultValue };
      },
    };
  },
});

export const { useForm, FormProvider } = result;
export type FormMetadata = InferFormMetadata<typeof result.config>;
export type FieldMetadata<T> = InferFieldMetadata<typeof result.config, T>;
```
