# Radix UI Example

[Radix UI](https://www.radix-ui.com/) is a headless UI library, offering flexible, unstyled primitives for creating customizable and accessible components, allowing developers to manage the visual layer independently.

This example demonstrates how to integrate Conform with Radix UI 1.6 using custom metadata. We leverage [Vite](https://vitejs.dev/) and [Tailwind CSS](https://tailwindcss.com/) for styling.

## Understanding the Integration

Each component in [`form.tsx`](./src/form.tsx) uses `useControl` to synchronize a Radix UI primitive with a named hidden input. The components can be connected to Conform by passing field metadata explicitly:

```tsx
<ExampleSelect
  items={countries}
  id={fields.userCountry.id}
  name={fields.userCountry.name}
  defaultValue={fields.userCountry.defaultValue}
  aria-invalid={fields.userCountry.ariaInvalid}
  aria-describedby={fields.userCountry.ariaDescribedBy}
/>
```

## Custom Metadata

To avoid repeating that mapping at every call site, [`forms.ts`](./src/forms.ts) uses `configureForms` to provide custom metadata for each component:

```tsx
import { configureForms } from '@conform-to/react/future';

const result = configureForms({
  extendFieldMetadata(metadata) {
    return {
      get selectProps() {
        return {
          id: metadata.id,
          name: metadata.name,
          defaultValue: metadata.defaultValue,
          'aria-invalid': metadata.ariaInvalid,
          'aria-describedby': metadata.ariaDescribedBy,
        } satisfies Partial<React.ComponentProps<typeof ExampleSelect>>;
      },
      // ... other component props
    };
  },
});

export const useForm = result.useForm;
```

The main application can then spread those props with full type safety. Its nearby comments preserve the explicit mapping shown above:

```tsx
<ExampleSelect {...fields.userCountry.selectProps} />
```

## Demo

<!-- sandbox src="/examples/radix-ui" -->

Try it out on [Stackblitz](https://stackblitz.com/github/edmundhung/conform/tree/main/examples/radix-ui).

<!-- /sandbox -->
