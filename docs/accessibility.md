# Accessibility

On this guide, we will show you how to utilize the inferred field id to setup aria attributes on the form controls.

<!-- aside -->

## On this page

- [Configuration](#configuration)

<!-- /aside -->

## Configuration

If you provide an `id` to the [useForm](/packages/conform-react/README.md#useform) hook, conform will infer an unique id on each field which you can use to setup aria attributes on the form controls.

```tsx
import { useForm, conform } from '@conform-to/react';
import { useId } from 'react';

function Example() {
    // If you are using react 18, you can generate
    // an unique id with the useId hook
    const id = useId()
    const [form, { message }] = useForm({
        id,
    });

    return (
        <form {...form.props}>
            <label htmlFor={message.id}>
            <input
                id={message.id}
                name={message.name}
                defaultValue={message.defaultValue}
                aria-invalid={message.error ? true : undefined}
                aria-describedby={message.error ? `${message.id}-error` : undefined}
            />
            <div id={`${message.id}-error`}>
                {message.error}
            </div>
            <button>Send</button>
        </form>
    );
}
```
