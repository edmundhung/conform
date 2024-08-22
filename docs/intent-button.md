# Intent button

A submit button will contribute to the form data when it triggers the submission as a [submitter](https://developer.mozilla.org/en-US/docs/Web/API/SubmitEvent/submitter).

## Submission Intent

The submitter is particularly useful when you want to extend the form with different behaviour based on the intent.

```tsx
import { useForm } from '@conform-to/react';

function Product() {
  const [form] = useForm({
    onSubmit(event, { formData }) {
      event.preventDefault();

      switch (formData.get('intent')) {
        case 'add-to-cart':
          // Add to cart
          break;
        case 'buy-now':
          // Buy now
          break;
      }
    },
  });

  return (
    <form id={form.id}>
      <input type="hidden" name="productId" value="rf23g43" />
      <button type="submit" name="intent" value="add-to-cart">
        Add to Cart
      </button>
      <button type="submit" name="intent" value="buy-now">
        Buy now
      </button>
    </form>
  );
}
```

## Form Controls

Conform utilizes the submission intent for all form controls, such as validating or removing a field. This is achieved by giving the buttons a reserved name with the intent serialized as the value. To simplify the setup, Conform provides a set of form control helpers, such as `form.validate`, `form.reset` or `form.insert`.

### Validate intent

To trigger a validation, you can configure a button with the validate intent.

```tsx
import { useForm } from '@conform-to/react';

function EmailForm() {
  const [form, fields] = useForm();

  return (
    <form id={form.id}>
      <input name={fields.email.name} />
      <button {...form.validate.getButtonProps({ name: fields.email.name })}>
        Validate Email
      </button>
    </form>
  );
}
```

When the button is clicked, conform identifies the serialized intent with the reserved name and trigger a validation by marking the email field as validated and returns the error message if the email is invalid.

However, if you want to trigger the validation once the user leaves the field, you can also trigger the validate intent directly.

```tsx
import { useForm } from '@conform-to/react';

function EmailForm() {
  const [form, fields] = useForm();

  return (
    <form id={form.id}>
      <input
        name={fields.email.name}
        onBlur={(event) => form.validate({ name: event.target.name })}
      />
    </form>
  );
}
```

### Reset and Update intent

You can also modify a field with the **reset** and **update** intent.

```tsx
import { useForm } from '@conform-to/react';

export default function Tasks() {
  const [form, fields] = useForm();

  return (
    <form id={form.id}>
      <button {...form.reset.getButtonProps()}>Reset form</button>
      <button
        {...form.reset.getButtonProps({
          name: fields.tasks.name,
        })}
      >
        Reset field (including nested / list field)
      </button>
      <button
        {...form.update.getButtonProps({
          name: fields.agenda.name,
          value: {
            title: 'My agenda',
            description: 'This is my agenda',
          },
        })}
      >
        Update field (including nested / list field)
      </button>
      <button
        {...form.update.getButtonProps({
          validated: false,
        })}
      >
        Clear all error
      </button>
    </form>
  );
}
```

Be aware that both intents requires setting up the inputs with the **key** from the field metadata. As Conform relies on the key to notify React for re-mounting the input with the updated initialValue. The only exception is if you are setting up a controlled input with the [useInputControl](./api/react/useInputControl.md) hook which will reset the value when the key changes.

### Insert, remove and reorder intents

To manipulate a field list, you can use the **insert**, **remove** and **reorder** intents.

```tsx
import { useForm, getInputProps } from '@conform-to/react';

export default function Tasks() {
  const [form, fields] = useForm();
  const tasks = fields.tasks.getFieldList();

  return (
    <form id={form.id}>
      <ul>
        {tasks.map((task, index) => (
          <li key={task.key}>
            <input {...getInputProps(task, { type: "text"})} />
            <button
              {...form.reorder.getButtonProps({
                name: fields.tasks.name,
                from: index,
                to: 0,
              })}
            >
              Move to top
            </button>
            <button
              {...form.remove.getButtonProps({
                name: fields.tasks.name,
                index,
              })}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
      <button
        {...form.insert.getButtonProps({
          name: fields.tasks.name,
        })}
      >
        Add task
      </button>
      <button>Save</button>
    </form>
  );
}
```
