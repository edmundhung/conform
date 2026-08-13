# Material UI Example

> This guide focuses on behavior specific to Material UI. See [Integrating with UI Libraries](../../docs/integration/ui-libraries.md) for the general concept and the [`useControl`](../../docs/api/react/future/useControl.md) API.

[Material UI](https://mui.com/material-ui) is a comprehensive component library based on Google's Material Design system.

This example demonstrates how to integrate Conform with Material UI 9.2 using custom metadata. It covers TextField, multiline TextField, Select, Autocomplete, NumberField, Checkbox, RadioGroup, Switch, Rating, and Slider.

## Keep Native Controls Native

TextField, Select, Checkbox, RadioGroup, and Switch already render native named controls. They only need Conform metadata mapped to their Material UI props:

```tsx
<TextField
  id={fields.email.id}
  name={fields.email.name}
  defaultValue={fields.email.defaultValue}
  error={!fields.email.valid}
  helperText={fields.email.errors}
/>
```

The example uses those Material UI components directly. This preserves browser FormData and reset behavior without an adapter.

## Adapt Controlled Components with `useControl`

Autocomplete, NumberField, Rating, and Slider do not expose one suitable native control for all of Conform's reset, focus, and FormData requirements, so their adapters register one hidden named control with `useControl`. `useControl` remains the single source of truth for value, blur, reset, and validation focus:

```tsx
const control = useControl({
  defaultValue,
  onFocus() {
    inputRef.current?.focus();
  },
});

return (
  <>
    <input ref={control.register} name={name} hidden />
    <MuiAutocomplete
      value={control.value || null}
      onChange={(_, value) => control.change(value ?? '')}
      onBlur={() => control.blur()}
    />
  </>
);
```

The adapters forward `aria-invalid` and `aria-describedby` to the accessible Material UI control while the hidden control remains responsible for FormData. Rating's presentation radios are explicitly disassociated from the form so they do not add a second value.

NumberField follows Material UI's documented outlined recipe using `@base-ui/react/number-field`, Material UI FormControl, and OutlinedInput. It demonstrates the new core NumberField pattern without adding MUI X solely for a DatePicker.

## Custom Metadata

[`forms.ts`](./src/forms.ts) uses [`configureForms`](../../docs/api/react/future/configureForms.md#integrating-with-ui-libraries) to provide typed props for native Material UI components and the four adapters:

```tsx
const forms = configureForms({
  extendFieldMetadata(metadata) {
    return {
      get autocompleteProps() {
        return {
          id: metadata.id,
          name: metadata.name,
          defaultValue: metadata.defaultValue,
          error: metadata.errors,
          'aria-invalid': metadata.ariaInvalid,
          'aria-describedby': metadata.ariaDescribedBy,
        } satisfies Partial<React.ComponentProps<typeof Autocomplete>>;
      },
      // ...other component props
    };
  },
});
```

The application spreads these props with full type safety. Nearby “Equivalent to” comments preserve the explicit mapping for readers.

## Compatibility

| Package | Version |
| --- | --- |
| Material UI | `@mui/material@^9.2.0` |
| React | `react@^19.2.7` |
| Zod | `zod@^4.4.3` |
| Conform Zod API | `@conform-to/zod/v4/future` |

## Demo

<!-- sandbox src="/examples/material-ui" -->

Try it out on [Stackblitz](https://stackblitz.com/github/edmundhung/conform/tree/main/examples/material-ui).

<!-- /sandbox -->
