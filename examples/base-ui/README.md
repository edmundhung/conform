# Base UI Example

> This guide focuses on behavior specific to Base UI. See [Integrating with UI Libraries](../../docs/integration/ui-libraries.md) for the general concept and the [`useControl`](../../docs/api/react/future/useControl.md) API.

[Base UI](https://base-ui.com/) provides unstyled, accessible React primitives. This example integrates Conform directly with `@base-ui/react`. Unlike [`examples/shadcn-base-ui`](../shadcn-base-ui), it does not use shadcn/ui components, generated registries, or copied shadcn code.

The example keeps a native `<form {...form.props}>` and uses Conform as the only source of validation and form state. It covers Input, textarea, Checkbox, CheckboxGroup, RadioGroup, Select, Combobox, NumberField, Slider, and Switch.

## Choose the Native Form Control

Use the control Base UI already renders when it has the required name, default, focus, reset, and `FormData` behavior. Add `useControl` only when the primitive's live value must be synchronized with Conform.

| Pattern | Components | Conform integration |
| --- | --- | --- |
| Native form integration | Input, textarea | Receive `name` and `defaultValue` directly |
| Hidden-input integration | Checkbox, CheckboxGroup, RadioGroup, Select, Combobox, NumberField, Switch | Base UI owns the named input and serialization |
| Requires `useControl` | Slider | Registers Base UI's range input and synchronizes its controlled numeric value |
| Requires `BaseControl` | None | No field in this example has a structured value that needs an additional base control |

CheckboxGroup is an array field, but it is not a structured multi-field value: each checked Base UI input contributes the same name to `FormData`. Adding a `BaseControl` would duplicate that native behavior.

## Preserve Base UI's Hidden Inputs

Base UI composites accept native form props on their root. For example, Select receives Conform's name and initial value directly:

```tsx
<Select.Root name={name} defaultValue={defaultValue} inputRef={inputRef}>
  <Select.Trigger aria-invalid={invalid || undefined}>
    {/* ... */}
  </Select.Trigger>
</Select.Root>
```

The Base UI hidden input remains the single named control. Validation attributes belong on the visible trigger, input, group, or thumb exposed to assistive technology.

## Synchronize Only the Controlled Slider

Slider is controlled to demonstrate `useControl` without adding a duplicate hidden input. Its existing range input is registered as the base control:

```tsx
const control = useControl({ defaultValue });

<Slider.Root
  name={name}
  value={Number(control.value)}
  onValueChange={(value) => control.change(String(value))}
>
  <Slider.Thumb
    inputRef={control.register}
    onBlur={() => control.blur()}
  />
</Slider.Root>;
```

This keeps the same input responsible for browser serialization, Conform focus, blur validation, and reset behavior.

## Match Focus, Blur, and Reset Boundaries

For composites whose visible element and hidden input are separate, blur from the visible control is forwarded to the named input so Conform's `shouldValidate: "onBlur"` receives the correct field name. Base UI continues to own the value.

The field collection is keyed by the current URL defaults and remounted after a reset. This restores the visual state of Base UI's uncontrolled composites for both a Conform reset intent and `HTMLFormElement.reset()`. After a successful submission, the submitted `FormData` becomes the URL and the next reset baseline.

## Custom Metadata

[`src/forms.ts`](./src/forms.ts) uses [`configureForms`](../../docs/api/react/future/configureForms.md#integrating-with-ui-libraries) to provide typed props for each component:

```tsx
const forms = configureForms({
  extendFieldMetadata(metadata) {
    return {
      get selectProps() {
        return {
          id: metadata.id,
          name: metadata.name,
          defaultValue: metadata.defaultValue,
          invalid: !metadata.valid,
          errors: metadata.errors,
        } satisfies Partial<React.ComponentProps<typeof SelectField>>;
      },
    };
  },
});
```

The application spreads those props with full type safety. Nearby `Equivalent to:` comments preserve the explicit metadata mapping for readers.

Compared with the Radix and Headless UI examples, Base UI's own form-compatible inputs remain canonical instead of being replaced. Compared with the shadcn/Base UI example, these adapters compose Base UI primitives directly and contain no generated component layer.

## Demo

<!-- sandbox src="/examples/base-ui" -->

Try it on [StackBlitz](https://stackblitz.com/github/edmundhung/conform/tree/main/examples/base-ui).

<!-- /sandbox -->
