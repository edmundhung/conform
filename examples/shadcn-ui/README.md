# shadcn/ui with Radix

[shadcn/ui](https://ui.shadcn.com/) provides component source code that applications can adapt directly. This Vite React project uses its current [Radix UI](https://www.radix-ui.com/) registry with React 19, Tailwind CSS 4, Conform, and Zod 4 validation through `@conform-to/zod/v4/future`. It is the direct counterpart to the Base UI-based [`shadcn-base-ui`](../shadcn-base-ui) example.

For a lower-level integration with Radix primitives, see the [`radix-ui`](../radix-ui) example. This example focuses on the generated shadcn/ui component layer, including Field, InputGroup, DatePicker, toggle groups, InputOTP, and TeamMemberSelect composition.

## Integration

When a component renders a normal form control, the example passes Conform's field props directly to it. InputGroupInput (composed from Input) and Textarea receive their name, default value, and validation attributes this way. NativeSelect is also native, although this form uses it only as TeamMemberSelect's local role filter.

Compound controls use [`useControl`](../../docs/api/react/future/useControl.md) with a [`BaseControl`](../../docs/api/react/future/BaseControl.md). This covers DatePicker, Combobox, RadioGroup, Checkbox, Select, Slider, Switch, toggle groups, InputOTP, and TeamMemberSelect. The base control is the only named form control; the visible Radix primitive stays controlled through `control.value`, `control.checked`, `control.options`, or `control.payload` and reports changes through `control.change()`.

The adapters preserve initial and updated defaults, restore visible state on reset, and forward validation focus from BaseControl to the interactive trigger, item, thumb, or input. Group and popup controls report blur only when the interaction leaves the whole control. Scalar values use a standard BaseControl, Checkbox and Switch use its checkbox mode, the multiple toggle group uses a multiple select, and TeamMemberSelect uses a fieldset for its structured payload.

Radix primitives that can render hidden inputs are left unnamed to avoid duplicate `FormData` entries. The accessible element receives the field label, invalid state, and error description. See [Integrating with UI Libraries](../../docs/integration/ui-libraries.md) for the general pattern.

| Pattern | Components | Form integration |
| --- | --- | --- |
| Native form control | Input, Textarea | The interactive element owns the name and serialization |
| Unnamed compound control | DatePicker, Combobox, RadioGroup, Checkbox, Select, Slider, Switch, toggle groups, InputOTP, TeamMemberSelect | The generated component handles interaction and accessible focus |
| `useControl` with `BaseControl` | Scalar and boolean compound controls | A hidden input or checkbox owns scalar and boolean values |
| Array or structured `BaseControl` | Multiple toggle group, repeated interests, TeamMemberSelect | A multiple select, repeated checkboxes, or fieldset serializes arrays and structured values |

Conform remains the source of validation and form state, while shadcn/ui supplies field layout and styled interaction. The application keeps its native `<form {...form.props}>`.

## Project Structure

- [`App.tsx`](./src/App.tsx) contains the form and keeps useful explicit Conform prop mappings in nearby comments.
- [`forms.tsx`](./src/forms.tsx) contains the shadcn/Radix adapters and uses [`configureForms`](../../docs/api/react/future/configureForms.md#integrating-with-ui-libraries) to expose their mappings as typed field props.
- [`tests/index.test.ts`](./tests/index.test.ts) verifies validation, focus delegation, submission, updated defaults, and reset behavior.

## Demo

<!-- sandbox src="/examples/shadcn-ui" -->

Try it out on [StackBlitz](https://stackblitz.com/github/edmundhung/conform/tree/main/examples/shadcn-ui).

<!-- /sandbox -->
