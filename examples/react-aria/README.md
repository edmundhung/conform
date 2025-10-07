# React Aria Example

[React Aria](https://react-spectrum.adobe.com/react-aria/index.html) is a library of unstyled React components and hooks that helps you build accessible, high quality UI components for your application or design system.

This example demonstrates how to integrate Conform with React Aria using custom metadata.

## Understanding the Integration

The main application ([`App.tsx`](./src/App.tsx)) uses explicit prop assignment for educational purposes, making it easy to see how field metadata maps to React Aria component props:

```tsx
<TextField
  label="Email"
  type="email"
  name={fields.email.name}
  defaultValue={fields.email.defaultValue}
  isInvalid={!fields.email.valid}
  errors={fields.email.errors}
/>
```

While this is clear and straightforward for learning, it becomes repetitive in production applications.

## Custom Metadata

The example also showcases metadata customization for a more DRY approach. Custom metadata properties are defined once in [./src/main.tsx](./src/main.tsx) and provide type-safe props that match React Aria component types:

```tsx
// Define custom metadata once
function defineCustomMetadata(metadata) {
  return {
    get textFieldProps() {
      return {
        name: metadata.name,
        defaultValue: metadata.defaultValue,
        isInvalid: !metadata.valid,
        errors: metadata.errors,
      } satisfies Partial<React.ComponentProps<typeof TextField>>;
    },
    // ... other component props
  };
}

// Use with full type safety
<TextField {...fields.email.textFieldProps} />
```

## Demo

Try it out on [Stackblitz](https://stackblitz.com/github/edmundhung/conform/tree/main/examples/react-aria).
