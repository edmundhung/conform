# Headless UI Example

[Headless UI](https://headlessui.com) is a set of completely unstyled, fully accessible UI components for React, designed to integrate beautifully with Tailwind CSS.

This example demonstrates how to integrate Conform with Headless UI using custom metadata.

## Understanding the Integration

The main application ([`App.tsx`](./src/App.tsx)) uses explicit prop assignment for educational purposes, making it easy to see how field metadata maps to Headless UI component props:

```tsx
<ExampleListBox
  name={fields.colors.name}
  defaultValue={fields.colors.defaultOptions}
  options={colorOptions}
/>
```

While this is clear and straightforward for learning, it becomes repetitive in production applications.

## Custom Metadata

The example also showcases metadata customization for a more DRY approach. Custom metadata properties are defined once in [`main.tsx`](./src/main.tsx) and provide type-safe props that match Headless UI component types:

```tsx
// Define custom metadata once
function defineCustomMetadata(metadata) {
  return {
    get listBoxProps() {
      return {
        name: metadata.name,
        defaultValue: metadata.defaultOptions,
      } satisfies Partial<React.ComponentProps<typeof ExampleListBox>>;
    },
    // ... other component props
  };
}

// Use with full type safety
<ExampleListBox {...fields.colors.listBoxProps} options={colorOptions} />
```

## Compatibility

> Based on @headless-ui/react@1.7.4

**Integration required**

- ListBox
- Combobox
- Switch
- RadioGroup

## Demo

<!-- sandbox src="/examples/headless-ui" -->

Try it out on [Stackblitz](https://stackblitz.com/github/edmundhung/conform/tree/main/examples/headless-ui).

<!-- /sandbox -->
