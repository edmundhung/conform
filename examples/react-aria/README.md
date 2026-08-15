# React Aria Example

> This guide focuses on behavior specific to React Aria Components. See [Integrating with UI Libraries](../../docs/integration/ui-libraries.md) for the general concept and the [`useControl`](../../docs/api/react/future/useControl.md) API.

[React Aria Components](https://react-spectrum.adobe.com/react-aria/components.html) provides accessible, unstyled components for building application and design-system interfaces.

This example integrates Conform with React 19 and React Aria Components 1.19 using custom metadata. It covers TextField, NumberField, RadioGroup, CheckboxGroup, DatePicker, DateRangePicker, Select, single and multi-select ComboBox, FileTrigger, Switch, and Checkbox.

## Conform integration

- [`forms.ts`](./src/forms.ts) extends Conform's custom field metadata with typed props for each React Aria component.
- `useControl` and `BaseControl` keep React Aria state synchronized with native form controls, so Conform validation, focus, `FormData`, and reset intents share one source of truth.
- Zod 4 validation uses `@conform-to/zod/v4/future` and maps errors to React Aria's `FieldError` composition.
- Checkbox, Radio, and Switch descriptions use `Text slot="description"`, keeping help text and validation errors in their accessible descriptions.

## Multi-select ComboBox

The Topics field demonstrates React Aria's multi-select ComboBox with Conform array metadata:

```tsx
<MultiSelectComboBox {...fields.topics.multiSelectComboBoxProps} label="Topics">
  <ComboBoxItem id="accessibility">Accessibility</ComboBoxItem>
  <ComboBoxItem id="forms">Forms</ComboBoxItem>
</MultiSelectComboBox>
```

Its hidden multiple `BaseControl` serializes selections as repeated entries:

```txt
topics=accessibility
topics=forms
```

The same native control also restores the current Conform default value after Conform and native form resets. Playwright coverage verifies array and file submission, validation focus and descriptions, Switch behavior, and reset behavior across Chromium, Firefox, and WebKit.

## Demo

<!-- sandbox src="/examples/react-aria" -->

Try the example on [StackBlitz](https://stackblitz.com/github/edmundhung/conform/tree/main/examples/react-aria).

<!-- /sandbox -->
