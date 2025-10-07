# Shadcn UI Example

[Shadcn UI](https://ui.shadcn.com/) is a comprehensive component library built with React. It provides a wide range of pre-built components that can be easily integrated into your projects.

This example demonstrates how to integrate Conform with Shadcn UI using custom metadata. We leverage [Vite](https://vitejs.dev/) and [Tailwind CSS](https://tailwindcss.com/) for styling.

## Understanding the Integration

The main application ([`App.tsx`](./src/App.tsx)) uses explicit prop assignment for educational purposes, making it easy to see how field metadata maps to Shadcn UI component props:

```tsx
<Input
  id={fields.email.id}
  name={fields.email.name}
  defaultValue={fields.email.defaultValue}
  aria-invalid={!fields.email.valid || undefined}
  aria-describedby={!fields.email.valid ? fields.email.errorId : undefined}
/>
```

While this is clear and straightforward for learning, it becomes repetitive in production applications.

## Custom Metadata

The example showcases metadata customization for a more DRY approach. Custom metadata properties are defined once in [`main.tsx`](./src/main.tsx) and provide type-safe props that match Shadcn UI component types:

```tsx
// Define custom metadata once
function defineCustomMetadata(metadata) {
  return {
    get inputProps() {
      return {
        id: metadata.id,
        name: metadata.name,
        defaultValue: metadata.defaultValue,
        'aria-invalid': !metadata.valid || undefined,
        'aria-describedby': !metadata.valid ? metadata.errorId : undefined,
      } satisfies Partial<React.ComponentProps<typeof Input>>;
    },
    // ... other component props
  };
}

// Use with full type safety
<Input {...fields.email.inputProps} />
```

This example also includes form components in [`src/components/form.tsx`](./src/components/form.tsx) that extend the base Shadcn components, making it even easier to build complex forms with full validation and error handling.

## Installation

To install Shadcn UI components, you can copy and paste the component code into your project, or use the Shadcn UI CLI to automatically add components. By default, the CLI places components into the `src/components/ui` folder.

## Components

- Checkbox
- Checkbox group
- Combobox
- Date picker
- Radio group
- Select
- Slider
- Switch
- Textarea
- Toggle group

## Demo

<!-- sandbox src="/examples/shadcn-ui" -->

Try it out on [Stackblitz](https://stackblitz.com/github/edmundhung/conform/tree/main/examples/shadcn-ui).

<!-- /sandbox -->
