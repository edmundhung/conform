# Integrating with UI libraries

In this guide, we will show you how to integrate custom inputs with Conform.

## Event delegation

Conform supports all native inputs out of the box by attaching an **input** and **focusout** event listener on the document directly. There is no need to setup any event handlers on the `<input />`, `<select />` or `<textarea />` elements. The only requirment is to set a form **id** on the `<form />` element and make sure all the inputs have a **name** attribute set and are associated with the form either by using the [form](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#form) attribute or by nesting them inside the `<form />` element.

```tsx
function Example() {
  const [form, fields] = useForm({
    // Optional, Conform will generate a random id if not provided
    id: 'example',
  });

  return (
    <form id={form.id}>
      <div>
        <label>Title</label>
        <input type="text" name="title" />
        <div>{fields.title.errors}</div>
      </div>
      <div>
        <label>Description</label>
        <textarea name="description" />
        <div>{fields.description.errors}</div>
      </div>
      <div>
        <label>Color</label>
        <select name="color">
          <option>Red</option>
          <option>Green</option>
          <option>Blue</option>
        </select>
        <div>{fields.color.errors}</div>
      </div>
      <button form={form.id}>Submit</button>
    </form>
  );
}
```

## Identifying if integration is needed

Conform relies on [event delegation](#event-delegation) to validate the form and will work with any custom input as long as it dispatches the form events. This is usually true for simple components that are just a wrapper around the native input element like `<Input />` or `<Textarea />`. However, custom inputs such as `<Select />` or `<DatePicker />` will likely require users to interact with non native form element with a hidden input and so no form event would be dispatched.

To identify if the input is a native input, you can wrap it in a div with event listeners attached to see if the form events are dispatched and bubble up while you are interacting with the custom input. You will also find [examples](#examples) below for some of the popular UI libraries.

```tsx
import { CustomInput } from 'your-ui-library';

function Example() {
  return (
    <div onInput={console.log} onBlur={console.log}>
      <CustomInput />
    </div>
  );
}
```

## Enhancing custom inputs with `useInputControl`

To fix this issue, Conform provides a hook called [useInputControl](../api/react/useInputControl.md) that let you enhance a custom input so that it dispatch the form events when needed. The hook returns a control object with the following properties:

- `value`: The current value of the input with respect to form [reset and update intents](../intent-button.md#reset-and-update-intent)
- `change`: A function to update the current value and dispatch both `change` and `input` events
- `focus`: A function to dispatch `focus` and `focusin` events
- `blur`: A function to dispatch `blur` and `focusout` events

Here is an example wrapping the [Select component from Radix UI](https://www.radix-ui.com/primitives/docs/components/select):

```tsx
import {
  type FieldMetadata,
  useForm,
  useInputControl,
} from '@conform-to/react';
import * as Select from '@radix-ui/react-select';
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@radix-ui/react-icons';

type SelectFieldProps = {
  // You can use the `FieldMetadata` type to define the `meta` prop
  // And restrict the type of the field it accepts through its generics
  meta: FieldMetadata<string>;
  options: Array<string>;
};

function SelectField({ meta, options }: SelectFieldProps) {
  const control = useInputControl(meta);

  return (
    <Select.Root
      name={meta.name}
      value={control.value}
      onValueChange={(value) => {
        control.change(value);
      }}
      onOpenChange={(open) => {
        if (!open) {
          control.blur();
        }
      }}
    >
      <Select.Trigger>
        <Select.Value />
        <Select.Icon>
          <ChevronDownIcon />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content>
          <Select.ScrollUpButton>
            <ChevronUpIcon />
          </Select.ScrollUpButton>
          <Select.Viewport>
            {options.map((option) => (
              <Select.Item key={option} value={option}>
                <Select.ItemText>{option}</Select.ItemText>
                <Select.ItemIndicator>
                  <CheckIcon />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
          <Select.ScrollDownButton>
            <ChevronDownIcon />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

function Example() {
  const [form, fields] = useForm();

  return (
    <form id={form.id}>
      <div>
        <label>Currency</label>
        <SelectField meta={fields.color} options={['red', 'green', 'blue']} />
        <div>{fields.color.errors}</div>
      </div>
      <button>Submit</button>
    </form>
  );
}
```

## Simplify it with Form Context

You can also simplfy the wrapper component by using the [useField](../api/react/useField.md) hook with a [FormProvider](../api/react/FormProvider.md).

```tsx
import {
  type FieldName,
  FormProvider,
  useForm,
  useField,
  useInputControl,
} from '@conform-to/react';
import * as Select from '@radix-ui/react-select';
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@radix-ui/react-icons';

type SelectFieldProps = {
  // Instead of using the `FieldMetadata` type, we will use the `FieldName` type
  // We can also restrict the type of the field it accepts through its generics
  name: FieldName<string>;
  options: Array<string>;
};

function Select({ name, options }: SelectFieldProps) {
  const [meta] = useField(name);
  const control = useInputControl(meta);

  return (
    <Select.Root
      name={meta.name}
      value={control.value}
      onValueChange={(value) => {
        control.change(value);
      }}
      onOpenChange={(open) => {
        if (!open) {
          control.blur();
        }
      }}
    >
      {/* ... */}
    </Select.Root>
  );
}

function Example() {
  const [form, fields] = useForm();

  return (
    <FormProvider context={form.context}>
      <form id={form.id}>
        <div>
          <label>Color</label>
          <Select name={fields.color.name} options={['red', 'green', 'blue']} />
          <div>{fields.color.errors}</div>
        </div>
        <button>Submit</button>
      </form>
    </FormProvider>
  );
}
```

## Examples

Here you can find examples integrating with some of the popular UI libraries.

> We are looking for contributors to help preparing examples for more UI libraries, like Radix UI and React Aria Component.

- [Chakra UI](../../examples/chakra-ui/)
- [Headless UI](../../examples/headless-ui/)
- [Material UI](../../examples/material-ui/)
- [Radix UI](../../examples/radix-ui/)
