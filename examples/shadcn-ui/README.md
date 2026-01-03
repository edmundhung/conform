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

The example showcases metadata customization for a more DRY approach. Check [`forms.ts`](./src/forms.ts) to see how custom metadata is configured using `configureForms`:

```tsx
import { configureForms } from '@conform-to/react/future';

const result = configureForms({
  extendFieldMetadata(metadata) {
    return {
      get inputProps() {
        return {
          id: metadata.id,
          name: metadata.name,
          defaultValue: metadata.defaultValue,
          'aria-describedby': metadata.ariaDescribedBy,
        } satisfies Partial<React.ComponentProps<'input'>>;
      },
      // ... other component props
    };
  },
});

export const useForm = result.useForm;
```

Then use the custom metadata with full type safety:

```tsx
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
