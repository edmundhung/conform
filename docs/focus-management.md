# Focus Management

Conform will focus on the first invalid field on submit.

<!-- aside -->

## On this page

- [Focusing before JavaScript is loaded](#focusing-before-javascript-is-loaded)
- [Focusing on Custom Control](#focusing-on-custom-control)

<!-- /aside -->

## Focusing before JavaScript is loaded

To enable error focus working in a progressive manner, Conform also utilise the [autofocus](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/autofocus) attribute. This will be set for you when using the [conform](../packages/conform-react/README.md#conform) helpers, which checks if there is any initial error from the previous submission.

```tsx
import { useForm, conform } from '@conform-to/react';

function Example() {
  const [form, { message }] = useForm();

  return (
    <form {...form.props}>
      <input {...conform.input(message.config)} />
      <div>{message.error}</div>
      <button>Send</button>
    </form>
  );
}
```

## Focusing on Custom Control

Conform can also focus on custom control if it exposes the inner ref property, where you can pass `control.ref` provided by [useControlledInput](../packages/conform-react/README.md#usecontrolledinput). e.g. `inputRef` on `<TextField />` from Material UI.

```tsx
import { useForm, useControlledInput } from '@conform-to/react';
import { TextField, MenuItem, Button } from '@mui/material';

function Example() {
  const [form, { language }] = useForm();
  const [shadowInputProps, control] = useControlledInput(language.config);

  return (
    <form {...form.props}>
      <div>
        <input {...shadowInputProps} />
        <TextField
          label={label}
          inputRef={control.ref}
          value={control.value}
          onChange={control.onChange}
          onBlur={control.onBlur}
          error={Boolean(language.error)}
          helperText={language.error}
          select
        >
          <MenuItem value="">Please select</MenuItem>
          <MenuItem value="english">English</MenuItem>
          <MenuItem value="deutsch">Deutsch</MenuItem>
          <MenuItem value="japanese">Japanese</MenuItem>
        </TextField>
        <div>{language.error}</div>
      </div>
      <Button>Submit</Button>
    </form>
  );
}
```

Check the [integration](./integrations.md) guide for more details
