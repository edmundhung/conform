# Focus Management

Conform will focus on the first invalid field on submit.

<!-- aside -->

## On this page

- [Focusing before JavaScript is loaded](#focusing-before-javascript-is-loaded)
- [Focusing on Custom Control](#focusing-on-custom-control)

<!-- /aside -->

## Focusing before JavaScript is loaded

Conform utilises the [autofocus](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/autofocus) attributeto enable error focus working in a progressive manner. This can also be set using the [conform](/packages/conform-react/README.md#conform) helpers, which checks if there is any initial error from the previous submission.

```tsx
import { useForm, conform } from '@conform-to/react';

function Example() {
  const [form, { message }] = useForm();

  return (
    <form {...form.props}>
      <input {...conform.input(message)} />
      <div>{message.error}</div>
      <button>Send</button>
    </form>
  );
}
```

## Focusing on Custom Control

Conform can focus on custom control as well. Here is an example snippet integrating with **react-select**:

```tsx
function Select({ options, .. }: SelectProps) {
  const shadowInputRef = useRef<HTMLInputElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);
  const control = useInputEvent({
    ref: shadowInputRef,
  });

  return (
    <>
      <input
        ref={shadowInputRef}
        {...conform.input(config, { hidden: true })}
        onFocus={() => customInputRef.current?.focus()}
      />
      <Select
        innerRef={customInputRef}
        options={options}
        defaultValue={config.defaultValue ?? ''}
        onChange={control.change}
        onFocus={control.focus}
        onBlur={control.blur}
      />
    </>
  );
}
```

Please check the [integration](/docs/integrations.md) guide for more details.
