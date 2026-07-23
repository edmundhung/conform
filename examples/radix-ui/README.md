# Radix UI Example

> This guide focuses on behavior specific to Radix UI. See [Integrating with UI Libraries](../../docs/integration/ui-libraries.md) for the general concept and the [`useControl`](../../docs/api/react/future/useControl.md) API.

[Radix UI](https://www.radix-ui.com/) is a headless UI library, offering flexible, unstyled primitives for creating customizable and accessible components, allowing developers to manage the visual layer independently.

This example demonstrates how to integrate Conform with Radix UI 1.6 using custom metadata. It covers Checkbox, RadioGroup, Select, Slider, Switch, and ToggleGroup through the `radix-ui` package.

## Use a Single Named Control

Several Radix primitives support form submission through an internal input when they receive a `name`. This example instead renders a hidden native input registered with `useControl` and leaves the Radix primitive unnamed:

```tsx
const control = useControl({
  defaultValue,
  onFocus() {
    selectRef.current?.focus();
  },
});

return (
  <>
    <input ref={control.register} name={name} hidden />
    <RadixSelect.Root
      value={control.value ?? ''}
      onValueChange={(value) => control.change(value)}
    >
      <RadixSelect.Trigger ref={selectRef}>{/* ... */}</RadixSelect.Trigger>
    </RadixSelect.Root>
  </>
);
```

The registered input is the only named control for the field. This avoids duplicate form values and provides the same integration model for primitives such as ToggleGroup that do not expose equivalent form props.

## Handle Radix Value Shapes

Most Radix values can be passed directly to `control.change()`. Three primitives need additional consideration in this example.

Radix Checkbox can report `indeterminate` in addition to a boolean. The field in this example has a boolean schema, so it normalizes `indeterminate` to `false`:

```tsx
<RadixCheckbox.Root
  checked={control.checked}
  onCheckedChange={(checked) =>
    control.change(checked === 'indeterminate' ? false : checked)
  }
/>
```

This is an application choice, not a requirement of the Radix integration. If `indeterminate` is meaningful to the form, it can instead be stored as a distinct string in a hidden native input.

Radix Slider always reports an array because it can support multiple thumbs. This example has one thumb, so it stores the first number as a string:

```tsx
<RadixSlider.Root
  value={[control.value ? parseFloat(control.value) : 0]}
  onValueChange={(value) => control.change(value[0].toString())}
/>
```

A single-value ToggleGroup reports an empty string when its active item is deselected. This example passes that value directly to `control.change()`.

## Forward Focus to the Interactive Element

When Conform focuses the hidden native input after an invalid submission, each adapter forwards focus to the corresponding Radix element:

| Primitive | Focus target |
| --- | --- |
| Checkbox | `Checkbox.Root` |
| Switch | `Switch.Root` |
| Select | `Select.Trigger` |
| Slider | `Slider.Thumb` |
| RadioGroup | Checked item or first radio |
| ToggleGroup | Active item or first button |

RadioGroup and ToggleGroup roots are not the items users focus, so their adapters locate an item instead:

```tsx
const control = useControl({
  defaultValue,
  onFocus() {
    const item =
      radioGroupRef.current?.querySelector<HTMLElement>(
        '[data-state="checked"]',
      ) ??
      radioGroupRef.current?.querySelector<HTMLElement>('[role="radio"]');

    item?.focus();
  },
});
```

ToggleGroup uses the same pattern with its active `data-state="on"` item.

## Match Radix Interaction Boundaries

Blur events bubble through RadioGroup and ToggleGroup when focus moves between their items. Notify Conform only when focus leaves the whole group:

```tsx
<RadixRadioGroup.Root
  onBlur={(event) => {
    // Ignore blur events when focus moves between items in the group.
    if (!event.currentTarget.contains(event.relatedTarget)) {
      control.blur();
    }
  }}
/>
```

Select manages focus across portalled content. This example treats closing the popup as the end of the field interaction:

```tsx
<RadixSelect.Root
  onOpenChange={(open) => {
    if (!open) {
      control.blur();
    }
  }}
/>
```

Checkbox, Slider, and Switch can forward their blur events directly.

## Apply ARIA Attributes to the Accessible Control

The hidden native input owns the field name and value. The `aria-invalid`, `aria-describedby`, and `aria-labelledby` attributes belong on the Radix element exposed to assistive technology as the control:

| Primitive | ARIA attribute target |
| --- | --- |
| Checkbox | `Checkbox.Root` |
| Switch | `Switch.Root` |
| Select | `Select.Trigger` |
| Slider | `Slider.Thumb` |
| RadioGroup | `RadioGroup.Root` |
| ToggleGroup | `ToggleGroup.Root` |

Checkbox, Switch, and Select use the Radix element's ID for their label association:

```tsx
<RadixSelect.Trigger
  id={id}
  aria-invalid={ariaInvalid}
  aria-describedby={ariaDescribedBy}
/>

<label htmlFor={id}>Country</label>
```

RadioGroup, ToggleGroup, and Slider use `aria-labelledby`:

```tsx
<span id={`${field.id}-label`}>Car type</span>

<ExampleRadioGroup
  aria-labelledby={`${field.id}-label`}
  aria-invalid={field.ariaInvalid}
  aria-describedby={field.ariaDescribedBy}
/>
```

The `aria-describedby` value references the error element through Conform's error ID:

```tsx
<span id={field.errorId}>{field.errors}</span>
```

## Custom Metadata

The adapters can receive field metadata explicitly:

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

To avoid repeating that mapping at every call site, [`forms.ts`](./src/forms.ts) uses [`configureForms`](../../docs/api/react/future/configureForms.md#integrating-with-ui-libraries) to provide typed props for each adapter:

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

See [`form.tsx`](./src/form.tsx) for the complete adapters and [`forms.ts`](./src/forms.ts) for all metadata mappings.

## Demo

<!-- sandbox src="/examples/radix-ui" -->

Try it out on [Stackblitz](https://stackblitz.com/github/edmundhung/conform/tree/main/examples/radix-ui).

<!-- /sandbox -->
