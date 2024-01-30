# Upgrading to v1

In this guide, we will walk you through all the changes that were introduced in v1 and how to upgrade your existing codebase.

## Minimum React version

Conform now requires React 18 or higher. If you are using an older version of React, you will need to upgrade your react version first.

## The `conform` object is removed

First, all helpers are renamed and can be imported individually:

- `conform.input` -> [getInputProps](./api//react/getInputProps.md)
- `conform.select` -> [getSelectProps](./api/react/getSelectProps.md)
- `conform.textarea` -> [getTextareaProps](./api/react/getTextareaProps.md)
- `conform.fieldset` -> [getFieldsetProps](./api/react/getFieldsetProps.md)
- `conform.collection` -> [getCollectionProps](./api/react/getCollectionProps.md)

If you are using `conform.VALIDATION_UNDEFINED` and `conform.VALIDATION_SKIPPED` before, you will find them on our zod integration (`@conform-to/zod`) instead.

- `conform.VALIDATION_SKIPPED` -> [conformZodMessage.VALIDATION_SKIPPED](./api/zod/conformZodMessage.md#conformzodmessagevalidation_skipped)
- `conform.VALIDATION_UNDEFINED` -> [conformZodMessage.VALIDATION_UNDEFINED](./api/zod/conformZodMessage.md#conformzodmessagevalidation_undefined)

Be aware that `conform.INTENT` is no longer exported. If you need to setup an intent button, you can name it **intent** (or anything you preferred) in combination with [z.discriminatedUnion()](https://zod.dev/?id=discriminated-unions) from zod for better type safety.

There are also some breaking changes on the options:

- The `type` option on `getInputProps` is now required.

```tsx
<input {...getInputProps(fields.title, { type: 'text' })} />
```

- The `description` option is renamed to `ariaDescribedBy` and expects a string (the `id` of the description element) instead of a boolean.

```tsx
<input
  {...getInputProps(fields.title, {
    ariaDescribedBy: fields.title.descriptionId,
  })}
/>
```

## Form setup changes

First,`form.props` is removed. You can use the [getFormProps()](./api/react/getFormProps.md) helper instead.

```tsx
import { useForm, getFormProps } from '@conform-to/react';

function Example() {
  const [form] = useForm();

  return <form {...getFormProps(form)} />;
}
```

Both `useFieldset` and `useFieldList` hooks are removed. You can call the `getFieldset()` or `getFieldList()` method on the field metadata instead.

```tsx
function Example() {
  const [form, fields] = useForm();

  // Before: useFieldset(form.ref, fields.address)
  const address = fields.address.getFieldset();
  // Before: useFieldList(form.ref, fields.tasks)
  const tasks = fields.tasks.getFieldList();

  return (
    <form>
      <ul>
        {tasks.map((task) => {
          // It is no longer necessary to define an addtional component
          // with nested list as you can access the fieldset directly
          const taskFields = task.getFieldset();

          return <li key={task.key}>{/* ... */}</li>;
        })}
      </ul>
    </form>
  );
}
```

Both `validate` and `list` exports are merged into the form metadata object:

```tsx
function Example() {
  const [form, fields] = useForm();
  const tasks = fields.tasks.getFieldList();

  return (
    <form>
      <ul>
        {tasks.map((task) => {
          return <li key={task.key}>{/* ... */}</li>;
        })}
      </ul>
      <button {...form.insert.getButtonProps({ name: fields.tasks.name })}>
        Add (Declarative API)
      </button>
      <button onClick={() => form.insert({ name: fields.tasks.name })}>
        Add (Imperative API)
      </button>
    </form>
  );
}
```

Here are all the equivalent methods:

- `validate` -> `form.validate`
- `list.insert` -> `form.insert`
- `list.remove` -> `form.remove`
- `list.reorder` -> `form.reorder`
- `list.replace` -> `form.update`
- `list.append` and `list.prepend` are removed. You can use `form.insert` instead.

## Schema integration

We have also renamed the APIs on each of the integrations with an unique name to avoid confusion. Here are the equivalent methods:

#### `@conform-to/zod`

- `parse` -> [parseWithZod](./api/zod/parseWithZod.md)
- `getFieldsetConstraint` -> [getZodConstraint](./api/zod/getZodConstraint.md)

#### `@conform-to/yup`

- `parse` -> [parseWithYup](./api/yup/parseWithYup.md)
- `getFieldsetConstraint` -> [getYupConstraint](./api/yup/getYupConstraint.md)

## Improved submission handling

We have redesigned the submission object to simplify the setup.

```tsx
export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const submission = parse(formData, { schema });

  /**
   * The submission status could be either "success", "error" or undefined
   * If the status is undefined, it means that the submission is not ready (i.e. `intent` is not `submit`)
   */
  if (submission.status !== 'success') {
    return json(submission.reply(), {
      // You can also use the status to determine the HTTP status code
      status: submission.status === 'error' ? 400 : 200,
    });
  }

  const result = await save(submission.value);

  if (!result.successful) {
    return json(
      submission.reply({
        // You can also pass additional error to the `reply` method
        formErrors: ['Submission failed'],
        fieldErrors: {
          address: ['Address is invalid'],
        },

        // or avoid sending the the field value back to client by specifying the field names
        hideFields: ['password'],
      }),
    );
  }

  // Reply the submission with `resetForm` option
  return json(submission.reply({ resetForm: true }));
}

export default function Example() {
  const lastResult = useActionData<typeof action>();
  const [form, fields] = useForm({
    // `lastSubmission` is renamed to `lastResult` to avoid confusion
    lastResult,
  });

  // We can now find out the status of the submission from the form metadata as well
  console.log(form.status); // "success", "error" or undefined
}
```

## Simplified integration with the `useInputControl` hook

The `useInputEvent` hook is replaced by the [useInputControl](./api/react/useInputControl.md) hook with some new features.

- There is no need to provide a ref of the inner input element anymore. It looks up the input element from the DOM and will insert one for you if it is not found.

- You can now use `control.value` to integrate a custom input as a controlled input and update the value state through `control.change(value)`. The value will also be reset when a form reset happens

```tsx
import { useForm, useInputControl } from '@conform-to/react';
import { CustomSelect } from './some-ui-library';

function Example() {
  const [form, fields] = useForm();
  const control = useInputControl(fields.title);

  return (
    <CustomSelect
      name={fields.title.name}
      value={control.value}
      onChange={(e) => control.change(e.target.value)}
      onFocus={control.focus}
      onBlur={control.blur}
    />
  );
}
```
