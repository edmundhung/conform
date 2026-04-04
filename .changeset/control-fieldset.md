---
'@conform-to/dom': minor
'@conform-to/react': minor
---

feat: support structured values in future `useControl`

The future `useControl` API can now register a `<fieldset>` as its base control so custom inputs can work with structured values like objects and nested arrays. This also adds a new `BaseControl` component to render those hidden native controls for you and exposes `field.defaultPayload` for seeding structured defaults.

```tsx
const control = useControl({
	defaultValue: field.defaultPayload,
	parse(payload) {
		return DateRangeSchema.parse(payload);
	},
});

// Then render a hidden fieldset as the base control:
<BaseControl
	type="fieldset"
	name={field.name}
	ref={control.register}
	defaultValue={control.defaultValue}
/>
<DateRangePicker
	value={control.payload}
	onChange={(value) => control.change(value)}
/>
```
