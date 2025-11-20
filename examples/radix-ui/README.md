# Radix UI Example

[Radix UI](https://www.radix-ui.com/) is a headless UI library, offering flexible, unstyled primitives for creating customizable and accessible components, allowing developers to manage the visual layer independently.

This example demonstrates how to integrate Conform with Radix UI using custom metadata. We leverage [Vite](https://vitejs.dev/) and [Tailwind CSS](https://tailwindcss.com/) for styling.

## Understanding the Integration

The main application ([`App.tsx`](./src/App.tsx)) uses explicit prop assignment for educational purposes, making it easy to see how field metadata maps to Radix UI component props:

```tsx
<ExampleSelect
  name={fields.category.name}
  defaultValue={fields.category.defaultValue}
/>
```

While this is clear and straightforward for learning, it becomes repetitive in production applications.

## Custom Metadata

The example also showcases metadata customization for a more DRY approach. Custom metadata properties are defined once in [`main.tsx`](./src/main.tsx) and provide type-safe props that match Radix UI component types:

```tsx
// Define custom metadata once
function defineCustomMetadata(metadata) {
  return {
    get selectProps() {
      return {
        name: metadata.name,
        defaultValue: metadata.defaultValue,
      } satisfies Partial<React.ComponentProps<typeof ExampleSelect>>;
    },
    // ... other component props
  };
}

// Use with full type safety
<ExampleSelect {...fields.category.selectProps} />
```

## Required packages

- @radix-ui/react-checkbox
- @radix-ui/react-icons
- @radix-ui/react-radio-group
- @radix-ui/react-select
- @radix-ui/react-slider
- @radix-ui/react-switch
- @radix-ui/react-toggle-group

**Integration required**

- Checkbox
- Radio group
- Select
- Slider
- Switch
- Toggle group

## Demo

<!-- sandbox src="/examples/radix-ui" -->

Try it out on [Stackblitz](https://stackblitz.com/github/edmundhung/conform/tree/main/examples/radix-ui).

<!-- /sandbox -->
