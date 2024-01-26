# Accessibility

Making your form accessible requires configuring each form element with proper attributes. But Conform can help you with that.

## Aria Attributes

When it comes to accessibility, aria attributes are usually the first thing that comes to mind, which usually requires some unique ids to associate different elements together. Conform helps you by generating all the ids for you.

```tsx
import { useForm } from '@conform-to/react';

function Example() {
  const [form, fields] = useForm();

  return (
    <form id={form.id}>
      <label htmlFor={fields.message.id}>Message</label>
      <input
        type="text"
        id={fields.message.id}
        name={fields.message.name}
        aria-invalid={!fields.message.valid ? true : undefined}
        aria-describedby={
          !fields.message.valid
            ? `${fields.message.errorId} ${fields.message.descriptionId}`
            : fields.message.descriptionId
        }
      />
      <div id={fields.message.descriptionId}>The message you want to send</div>
      <div id={fields.message.errorId}>{fields.message.errors}</div>
      <button>Send</button>
    </form>
  );
}
```

## Validation attributes

Validation attributes also play an important role in accessibility, such as improving the hint for screen readers. With Conform, you can derive the validation attributes from your zod or yup schema and have them populated on each field metadata.

```tsx
import { parseWithZod, getZodConstraint } from '@conform-to/zod';
import { useForm } from '@conform-to/react';
import { z } from 'zod';

const schema = z.object({
  message: z
    .string()
    .min(10)
    .max(100)
    .regex(/^[A-Za-z0-9 ]{10-100}$/),
});

function Example() {
  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
  });

  return (
    <form id={form.id}>
      <input
        type="text"
        name={fields.message.name}
        required={fields.message.constraint?.required}
        minLength={fields.message.constraint?.minLength}
        maxLength={fields.message.constraint?.maxLength}
        pattern={fields.message.constraint?.pattern}
      />
      <button>Send</button>
    </form>
  );
}
```

## Progressive enhancement

Progressive enhancement also helps with accessibility, such as minimizing the impact of temporary network issues. For example, Conform make it possible to manipulate a list of fields with the form data and state persisted even across page refreshes.

```tsx
import { useForm } from '@conform-to/react';

export default function Example() {
  const [form, fields] = useForm();

  return (
    <form id={form.id}>
      <ul>
        {tasks.map((task) => (
          <li key={task.key}>
            <input name={task.name} defaultValue={task.initialValue} />
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

## Reducing boilerplate

Setting up all the attributes mentioned above can be tedious and error prone. Conform wants to help you with that by providing a set of helpers that derive all the related attributes for you.

> Note: All the helpers mentioned are designed for the native HTML elements. You might not need them if you are using custom UI components, such as react-aria-components or Radix UI, which might already have the attributes set up for you through their own APIs.

- [getFormProps](./api/react/getFormProps.md)
- [getFieldsetProps](./api/react/getFieldsetProps.md)
- [getInputProps](./api/react/getInputProps.md)
- [getSelectProps](./api/react/getSelectProps.md)
- [getTextareaProps](./api/react/getTextareaProps.md)
- [getCollectionProps](./api/react/getButtonProps.md)

Here is an example of how it compares to the manual setup. If you want to know more about the helpers, please check the corresponding documentation linked above

```tsx
import { parseWithZod, getZodConstraint } from '@conform-to/zod';
import { useForm } from '@conform-to/react';
import { z } from 'zod';

const schema = z.object({
  message: z
    .string()
    .min(10)
    .max(100)
    .regex(/^[A-Za-z0-9 ]{10-100}$/),
});

function Example() {
  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
  });

  return (
    <form id={form.id}>
      {/* Before */}
      <input
        type="text"
        id={fields.message.id}
        name={fields.message.name}
        required={fields.message.constraint?.required}
        minLength={fields.message.constraint?.minLength}
        maxLength={fields.message.constraint?.maxLength}
        pattern={fields.message.constraint?.pattern}
        aria-invalid={!fields.message.valid ? true : undefined}
        aria-describedby={
          !fields.message.valid
            ? `${fields.message.errorId} ${fields.message.descriptionId}`
            : fields.message.descriptionId
        }
      />
      {/* After */}
      <input
        {...getInputProps(fields.message, {
          type: 'text',
          ariaDescribedBy: fields.message.descriptionId,
        })}
      />
      <button>Send</button>
    </form>
  );
}
```
