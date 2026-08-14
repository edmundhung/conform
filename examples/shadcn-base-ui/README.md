# shadcn/ui with Base UI

> This guide focuses on behavior specific to Base UI. See [Integrating with UI Libraries](../../docs/integration/ui-libraries.md) for the general concept and the [`useControl`](../../docs/api/react/future/useControl.md) API.

This is the Base UI counterpart to the Radix-based [`examples/shadcn-ui`](../shadcn-ui). It uses the current shadcn Vite setup with React 19, Tailwind CSS 4, Zod 4, and `@conform-to/zod/v4/future`. Files under `src/components/ui` come from the shadcn CLI; the Conform adapters live in [`form-controls.tsx`](./src/components/form-controls.tsx).

## Use Native Controls Where Possible

Input, Textarea, and NativeSelect receive Conform metadata directly. Base UI Slider already renders named range inputs, so the local shadcn Slider only forwards error ARIA attributes to those focusable inputs.

## Bridge Composite Controls

Base UI hidden inputs submit values correctly, but their visual elements do not emit the named blur events Conform uses for `onBlur` validation. Checkbox, RadioGroup, Select, Combobox, and Switch therefore use `useControl` with one unnamed Base UI primitive and one named base control. This also gives validation focus and reset a single source of truth.

DatePicker and InputOTP use the same bridge because they have no suitable native form control. The multi-select Combobox registers a visually hidden multiple select so an empty field can receive validation focus and selected values remain repeated `FormData` entries.

Base UI 1.6 does not restore every uncontrolled visual state on a native form reset. The form handles its `reset` event and remounts the field group, covering both the Reset button and `form.reset()`.

[`forms.ts`](./src/forms.ts) extends Conform field metadata with typed props for the shadcn and adapter components, matching the other modern UI-library examples.

## Demo

<!-- sandbox src="/examples/shadcn-base-ui" -->

Try it on [StackBlitz](https://stackblitz.com/github/edmundhung/conform/tree/main/examples/shadcn-base-ui).

<!-- /sandbox -->
