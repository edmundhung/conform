# React Aria Components Example

[React Aria Components](https://react-spectrum.adobe.com/react-aria/components.html) provides accessible, unstyled React components for building application and design-system interfaces.

This Vite React 19 project demonstrates how to use React Aria Components 1.19 with Conform and Zod 4 validation.

## Integration

When a React Aria composition exposes a native form control that owns its value, Conform props such as `name`, `defaultValue`, required state, and validation state can be passed to it directly. The text field follows this pattern, while the radio group registers React Aria's native radio inputs with Conform.

Components whose value is managed by a compound React Aria control use [`useControl`](../../docs/api/react/future/useControl.md) with one or more [`BaseControl`](../../docs/api/react/future/BaseControl.md) elements. These are the canonical named form controls, while the visible component handles interaction. The adapters translate string, array, date-range, checked, and file values; forward changes, blur, and invalid-submission focus; and let Conform update defaults and reset the rendered component without introducing a second source of truth.

The multi-select ComboBox serializes its array as repeated `FormData` entries. React Aria's description and error-message slots connect help text and validation errors to the interactive controls. See [Integrating with UI Libraries](../../docs/integration/ui-libraries.md) for the general pattern.

## Project Structure

- [`App.tsx`](./src/App.tsx) contains the example form and shows the explicit Conform prop mappings in nearby comments.
- [`components`](./src/components) contains the React Aria compositions and their Conform control adapters.
- [`forms.ts`](./src/forms.ts) uses [`configureForms`](../../docs/api/react/future/configureForms.md#integrating-with-ui-libraries) to expose those mappings as typed field props.
- [`tests/index.test.ts`](./tests/index.test.ts) verifies validation, focus, submission, updated defaults, and reset behavior.

## Demo

<!-- sandbox src="/examples/react-aria" -->

Try the example on [StackBlitz](https://stackblitz.com/github/edmundhung/conform/tree/main/examples/react-aria).

<!-- /sandbox -->
