# Material UI Example

[Material UI](https://mui.com/material-ui) is a comprehensive library of components based on Google's Material Design system.

This example demonstrates how to integrate Conform with Material UI using custom metadata.

## Understanding the Integration

The main application ([`App.tsx`](./src/App.tsx)) uses explicit prop assignment for educational purposes, making it easy to see how field metadata maps to Material UI component props:

```tsx
<TextField
  name={fields.email.name}
  defaultValue={fields.email.defaultValue}
  error={!fields.email.valid}
  helperText={fields.email.errors}
/>
```

While this is clear and straightforward for learning, it becomes repetitive in production applications.

## Custom Metadata

The example also showcases metadata customization for a more DRY approach. Custom metadata properties are defined once in [`main.tsx`](./src/main.tsx) and provide type-safe props that match Material UI component types:

```tsx
// Define custom metadata once
function defineCustomMetadata(metadata) {
  return {
    get textFieldProps() {
      return {
        name: metadata.name,
        defaultValue: metadata.defaultValue,
        error: !metadata.valid,
        helperText: metadata.errors,
      } satisfies Partial<React.ComponentProps<typeof TextField>>;
    },
    // ... other component props
  };
}

// Use with full type safety
<TextField {...fields.email.textFieldProps} />
```

## Compatibility

> Based on @mui/material@5.10

**Native support**

- Text Field (default)
- Text Field (multiline)
- NativeSelect
- Checkbox
- Radio Group
- Switch

**Integration required**

- Autocomplete
- Select
- Rating
- Slider

## Demo

<!-- sandbox src="/examples/material-ui" -->

Try it out on [Stackblitz](https://stackblitz.com/github/edmundhung/conform/tree/main/examples/material-ui).

<!-- /sandbox -->
