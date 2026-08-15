# shadcn/ui with Radix

> This guide focuses on behavior specific to shadcn/ui's Radix base. See [Integrating with UI Libraries](../../docs/integration/ui-libraries.md) for the general concept and the [`useControl`](../../docs/api/react/future/useControl.md) API.

This Vite example uses the current shadcn/ui Radix registry with React 19, Tailwind CSS 4, and Zod 4. It keeps the generated shadcn components in [`src/components/ui`](./src/components/ui) and the Conform-specific adapters in [`src/components/form-controls.tsx`](./src/components/form-controls.tsx).

It covers Input, Textarea, DatePicker, Combobox, RadioGroup, Checkbox, Select, Slider, Switch, single and multiple toggle groups, InputOTP, and TeamMemberSelect. It also uses the current shadcn Field, FieldSet, InputGroup, and NativeSelect composition.

## Use Native Controls Where Possible

`InputGroupInput` (composed from Input) and `Textarea` receive Conform's `id`, `name`, default value, and ARIA metadata directly without `useControl`. NativeSelect is native too; this form uses it for TeamMemberSelect's local role filter because the schema fields are reserved for the controls being compared.

The other controls expose a custom value or interaction model and use a small adapter built with `useControl`.

## Use a Single Named Control

Several Radix primitives create an internal input when they receive a `name`. The adapters leave the Radix primitive unnamed and register an explicit Conform `BaseControl` instead:

```tsx
const control = useControl({
  defaultValue,
  onFocus() {
    selectRef.current?.focus();
  },
});

return (
  <>
    <BaseControl
      ref={control.register}
      name={name}
      defaultValue={control.defaultValue ?? ''}
    />
    <ShadcnSelect
      value={control.value ?? ''}
      onValueChange={(value) => control.change(value)}
    >
      {/* ... */}
    </ShadcnSelect>
  </>
);
```

The base control is the only named control for the field. This avoids duplicate `FormData` entries and gives primitives with and without built-in form support the same Conform behavior.

## Match Each Value Shape

Checkbox and Switch use a checkbox `BaseControl` and read `control.checked`. RadioGroup, Select, DatePicker, Combobox, and InputOTP use a single string value. Slider converts Radix's number array to one string value.

The multiple toggle group registers a multiple select, so arrays remain repeated `FormData` entries:

```tsx
<BaseControl
  type="select"
  multiple
  ref={control.register}
  name={name}
  defaultValue={control.defaultValue ?? []}
/>
```

TeamMemberSelect demonstrates a structured payload. A fieldset `BaseControl` renders the member fields, while Zod 4 `coerceStructure` parses them back into the component's member array:

```tsx
const control = useControl({
  defaultValue,
  parse(payload) {
    return coerceStructure(membersSchema).parse(payload);
  },
});

<BaseControl
  type="fieldset"
  name={name}
  ref={control.register}
  defaultValue={control.defaultValue}
/>
```

`useControl` keeps standard, array, and structured base controls synchronized through changes, Conform resets, and native `form.reset()` calls.

## Forward Focus to the Interactive Element

When Conform focuses a hidden base control after an invalid submission, each adapter forwards focus to the element users interact with:

| Control | Focus target |
| --- | --- |
| DatePicker and Combobox | Trigger button |
| RadioGroup | Checked item or first radio |
| Checkbox and Switch | Radix root |
| Select | Select trigger |
| Slider | Slider thumb |
| Toggle groups | Active item or first button |
| InputOTP | OTP input |
| TeamMemberSelect | InputGroup trigger |

RadioGroup and toggle groups locate their focusable item rather than focusing the composite root.

## Match Interaction Boundaries

Blur events bubble while focus moves between RadioGroup or toggle-group items. Their adapters notify Conform only when focus leaves the whole group:

```tsx
onBlur={(event) => {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    control.blur();
  }
}}
```

DatePicker, Combobox, Select, and TeamMemberSelect treat closing their popup as the end of the field interaction. The remaining controls forward blur directly.

## Apply ARIA Metadata to the Accessible Control

The hidden base control owns the field name and value. `aria-invalid`, `aria-describedby`, and `aria-labelledby` belong on the visible accessible element: the trigger, group root, slider thumb, or input as appropriate.

RadioGroup, Slider, and toggle groups use an explicit label ID:

```tsx
<FieldLegend id={`${fields.gender.id}-label`}>Gender</FieldLegend>
<RadioGroup {...fields.gender.radioGroupProps} />
```

The metadata mapping supplies that relationship together with Conform's error description:

```tsx
get radioGroupProps() {
  return {
    id: metadata.id,
    name: metadata.name,
    defaultValue: metadata.defaultValue,
    'aria-invalid': metadata.ariaInvalid,
    'aria-describedby': metadata.ariaDescribedBy,
    'aria-labelledby': `${metadata.id}-label`,
  } satisfies Partial<React.ComponentProps<typeof RadioGroup>>;
}
```

## Custom Metadata

[`src/forms.ts`](./src/forms.ts) uses [`configureForms`](../../docs/api/react/future/configureForms.md#integrating-with-ui-libraries) to expose typed props for every adapter. [`src/App.tsx`](./src/App.tsx) spreads those props while keeping the equivalent explicit mapping in nearby comments.

This matches the pattern used by the Radix UI and Headless UI examples: generic form behavior stays in Conform, library-specific value conversion, focus, blur, and ARIA behavior stays in the adapter, and custom metadata only removes repetitive prop mapping.

## Demo

<!-- sandbox src="/examples/shadcn-ui" -->

Try it on [Stackblitz](https://stackblitz.com/github/edmundhung/conform/tree/main/examples/shadcn-ui).

<!-- /sandbox -->
