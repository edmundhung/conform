# Headless UI Example

> This guide focuses on behavior specific to Headless UI. See [Integrating with UI Libraries](../../docs/integration/ui-libraries.md) for the general concept and the [`useControl`](../../docs/api/react/future/useControl.md) API.

[Headless UI](https://headlessui.com/) provides completely unstyled, accessible UI components designed to integrate with Tailwind CSS.

This example demonstrates how to integrate Conform with Headless UI 2.2 using custom metadata. It covers Field, Fieldset, Legend, Label, Description, Input, Textarea, Select, Checkbox, Listbox, Combobox, Switch, and RadioGroup.

## Use a Single Named Control

In this example, Listbox, Combobox, Switch, RadioGroup, and Checkbox render a hidden base control registered with `useControl`:

```tsx
const control = useControl({
  defaultValue,
  onFocus() {
    buttonRef.current?.focus();
  },
});

return (
  <Listbox
    value={control.options ?? []}
    onChange={(value) => control.change(value)}
    multiple
  >
    <select
      ref={control.register}
      name={name}
      defaultValue={defaultValue}
      hidden
      multiple
    >
      {options.map((option) => (
        <option key={option.value} value={option.value} />
      ))}
    </select>
    <ListboxButton ref={buttonRef}>{/* ... */}</ListboxButton>
  </Listbox>
);
```

The Headless UI component remains unnamed, so the base control is the only named control for the field.

## Handle Headless UI Value Shapes

Listbox supports multiple values, so it reads `control.options` and registers a multiple select. Rendering an option for every possible value preserves multiple default values, reset behavior, and repeated `FormData` entries.

Combobox uses `control.value` for the submitted value. Its local `query` state only filters the displayed options and is cleared when the popup closes:

```tsx
<Combobox
  value={control.value || null}
  onChange={(value: string | null) => control.change(value ?? '')}
  onClose={() => setQuery('')}
>
  {/* ... */}
</Combobox>
```

Switch and Checkbox map their boolean state to `control.checked`. RadioGroup and Combobox pass their string values directly to `control.change()`.

## Forward Focus to the Interactive Element

When Conform focuses a registered control after an invalid submission, each component forwards focus to the corresponding Headless UI element:

| Component | Focus target |
| --- | --- |
| Listbox | `ListboxButton` |
| Combobox | `ComboboxInput` |
| Switch | `Switch` |
| Checkbox | `Checkbox` |
| RadioGroup | Checked radio or first radio |

RadioGroup's root is not the element users focus, so `onFocus` locates a radio instead:

```tsx
const control = useControl({
  defaultValue,
  onFocus() {
    const item =
      groupRef.current?.querySelector<HTMLElement>('[data-checked]') ??
      groupRef.current?.querySelector<HTMLElement>('[role="radio"]');

    item?.focus();
  },
});
```

## Match Headless UI Interaction Boundaries

Blur events bubble through Listbox and RadioGroup when focus moves between their internal elements. Notify Conform only when focus leaves the whole component:

```tsx
<RadioGroup
  onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      control.blur();
    }
  }}
>
  {/* ... */}
</RadioGroup>
```

Combobox forwards blur from its input, while Switch and Checkbox can forward their blur events directly.

## Apply ARIA Attributes to the Accessible Control

The hidden native control owns the field name and value. Validation attributes belong on the Headless UI element exposed to assistive technology:

| Component | ARIA attribute target |
| --- | --- |
| Listbox | `ListboxButton` |
| Combobox | `ComboboxInput` |
| Switch | `Switch` |
| Checkbox | `Checkbox` |
| RadioGroup | `RadioGroup` root |

`Field`, `Label`, and `Description` associate labels and errors with Listbox, Combobox, Switch, and Checkbox. RadioGroup manages its own label and description context, so this example labels its root explicitly and associates its external error through `aria-errormessage`:

```tsx
<ExampleRadioGroup
  aria-label="Color (RadioGroup)"
  aria-invalid={fields.color.ariaInvalid}
  aria-errormessage={fields.color.ariaDescribedBy}
/>

<p id={fields.color.errorId}>{fields.color.errors}</p>
```

## Custom Metadata

The Headless UI components can receive field metadata explicitly:

```tsx
<ExampleListBox
  options={options}
  id={fields.owner.id}
  name={fields.owner.name}
  defaultValue={fields.owner.defaultOptions}
  aria-invalid={fields.owner.ariaInvalid}
  aria-describedby={fields.owner.ariaDescribedBy}
/>
```

To avoid repeating that mapping at every call site, [`forms.ts`](./src/forms.ts) uses [`configureForms`](../../docs/api/react/future/configureForms.md#integrating-with-ui-libraries) to provide typed props for every form control:

```tsx
import { configureForms } from '@conform-to/react/future';

const forms = configureForms({
  extendFieldMetadata(metadata) {
    return {
      get listBoxProps() {
        return {
          id: metadata.id,
          name: metadata.name,
          defaultValue: metadata.defaultOptions,
          'aria-invalid': metadata.ariaInvalid,
          'aria-describedby': metadata.ariaDescribedBy,
        } satisfies Partial<React.ComponentProps<typeof ExampleListBox>>;
      },
      // ... other component props
    };
  },
});

export const useForm = forms.useForm;
```

The main application can then spread those props with full type safety. Its nearby comments preserve the explicit mapping shown above:

```tsx
<ExampleListBox options={options} {...fields.owner.listBoxProps} />
```

See [`components.tsx`](./src/components.tsx) for the Headless UI components and [`forms.ts`](./src/forms.ts) for all metadata mappings.

## Demo

<!-- sandbox src="/examples/headless-ui" -->

Try it out on [Stackblitz](https://stackblitz.com/github/edmundhung/conform/tree/main/examples/headless-ui).

<!-- /sandbox -->
