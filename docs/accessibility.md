# Accessibility

Building an accessible form is critical. This includes providing unique IDs to link multiple pieces of information together, i.e. label and error of a particular input and leveraging aria-attributes that hints about the validity of the input, i.e. _aria-invalid_.

<!-- aside -->

## On this page

- [Configuration](#configuration)

<!-- /aside -->

## Configuration

The [useForm](/packages/conform-react/README.md#useform) hook accepts an `id` as part of the config. This enables Conform to infer an id which you can assign to the label and error element. The [conform](/packages/conform-react/README.md#conform) helpers will also return the _id_, _aria-describedby_ and _aria-invalid_ attributes.

```tsx
import { useForm, conform } from '@conform-to/react';
// Note: only available on react 18
import { useId } from 'react';

function Example() {
    const id = useId()
    const [form, { message }] = useForm({
        id, // You can also provide a hardcoded id
    });

    return (
        <form {...form.props}>
            <label htmlFor={message.config.id}>
            <input {...conform.input(message.config)}>
            <div id={message.config.errorId} role="alert">
                {message.error}
            </div>
            <button>Send</button>
        </form>
    );
}
```
