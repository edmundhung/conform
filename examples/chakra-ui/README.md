# Chakra UI Example

[Chakra UI](https://chakra-ui.com/) is a simple, modular and accessible component library that gives you the building blocks you need to build your React applications.

This example demonstrates how to integrate Conform with Chakra UI using custom metadata.

## Understanding the Integration

The main application ([`App.tsx`](./src/App.tsx)) uses explicit prop assignment for educational purposes, making it easy to see how field metadata maps to Chakra UI component props:

```tsx
<Input
  name={fields.text.name}
  defaultValue={fields.text.defaultValue}
  isInvalid={!fields.text.valid}
/>
```

While this is clear and straightforward for learning, it becomes repetitive in production applications.

## Custom Metadata

The example also showcases metadata customization for a more DRY approach. Custom metadata properties are defined once in [`main.tsx`](./src/main.tsx) and provide type-safe props that match Chakra UI component types:

```tsx
// Define custom metadata once
function defineCustomMetadata(metadata) {
  return {
    get inputProps() {
      return {
        name: metadata.name,
        defaultValue: metadata.defaultValue,
        isInvalid: !metadata.valid,
      } satisfies Partial<React.ComponentProps<typeof Input>>;
    },
    // ... other component props
  };
}

// Use with full type safety
<Input {...fields.text.inputProps} />
```

## Compatibility

> Based on @chakra-ui/react@2.4.2

**Native support**

- Input
- Select
- Textarea
- Checkbox
- Switch
- Radio
- Editable

**Integration required**

- NumberInput
- PinInput
- Slider

## Demo

<!-- sandbox src="/examples/chakra-ui" -->

Try it out on [Stackblitz](https://stackblitz.com/github/edmundhung/conform/tree/main/examples/chakra-ui).

<!-- /sandbox -->
