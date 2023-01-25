# @conform-to/react

> [React](https://github.com/facebook/react) adapter for [conform](https://github.com/edmundhung/conform)

<!-- aside -->

## API Reference

- [useForm](#useform)
- [useFieldset](#usefieldset)
- [useFieldList](#usefieldlist)
- [useInputEvent](#useinputevent)
- [useControlledInput](#usecontrolledinput)
- [conform](#conform)
- [list](#list)
- [validate](#validate)
- [requestCommand](#requestcommand)
- [getFormElements](#getformelements)
- [hasError](#haserror)
- [parse](#parse)
- [shouldValidate](#shouldvalidate)

<!-- /aside -->

### useForm

By default, the browser calls the [reportValidity()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/reportValidity) API on the form element when a submission is triggered. This checks the validity of all the fields and reports through the error bubbles.

This hook enhances the form validation behaviour by:

- Enabling customizing form validation behaviour.
- Capturing the error message and removes the error bubbles.
- Preparing all properties required to configure the dom elements.

```tsx
import { useForm } from '@conform-to/react';

function LoginForm() {
  const [form, { email, password }] = useForm({
    /**
     * If the form id is provided, Id for label,
     * input and error elements will be derived.
     */
    id: undefined,

    /**
     * Validation mode.
     * Support "client-only" or "server-validation".
     *
     * Default to `client-only`.
     */
    mode: 'client-only',

    /**
     * Define when the error should be reported initially.
     * Support "onSubmit", "onChange", "onBlur".
     *
     * Default to `onSubmit`.
     */
    initialReport: 'onBlur',

    /**
     * An object representing the initial value of the form.
     */
    defaultValue: undefined;

    /**
     * An object describing the state from the last submission
     */
    state: undefined;

    /**
     * An object describing the constraint of each field
     */
    constraint: undefined;

    /**
     * Enable native validation before hydation.
     *
     * Default to `false`.
     */
    fallbackNative: false,

    /**
     * Accept form submission regardless of the form validity.
     *
     * Default to `false`.
     */
    noValidate: false,

    /**
     * A function to be called when the form should be (re)validated.
     * Only sync validation is supported
     */
    onValidate({ form, formData }) {
      // ...
    },

    /**
     * The submit event handler of the form.
     */
    onSubmit(event, { formData, submission }) {
      // ...
    },
  });

  // ...
}
```

<details>
<summary>What is `form.props`?</summary>

It is a group of properties required to hook into form events. They can also be set explicitly as shown below:

```tsx
function RandomForm() {
  const [form] = useForm();

  return (
    <form
      ref={form.props.ref}
      id={form.props.id}
      onSubmit={form.props.onSubmit}
      noValidate={form.props.noValidate}
    >
      {/* ... */}
    </form>
  );
}
```

</details>

<details>
<summary>Does it work with custom form component like Remix Form?</summary>

Yes! It will fallback to native form submission as long as the submit event is not default prevented.

```tsx
import { useFrom } from '@conform-to/react';
import { Form } from '@remix-run/react';

function LoginForm() {
  const [form] = useForm();

  return (
    <Form method="post" action="/login" {...form.props}>
      {/* ... */}
    </Form>
  );
}
```

</details>

---

### useFieldset

This hook enables you to work with [nested object](/docs/configuration.md#nested-object) by monitoring the state of each nested field and prepraing the config required.

```tsx
import { useForm, useFieldset, conform } from '@conform-to/react';

interface Address {
  street: string;
  zipcode: string;
  city: string;
  country: string;
}

function Example() {
  const [form, { address }] = useForm<{ address: Address }>();
  const { city, zipcode, street, country } = useFieldset(
    form.ref,
    address.config,
  );

  return (
    <form {...form.props}>
      <fieldset>
        <legned>Address</legend>
        <input {...conform.input(street.config)} />
        <div>{street.error}</div>
        <input {...conform.input(zipcode.config)} />
        <div>{zipcode.error}</div>
        <input {...conform.input(city.config)} />
        <div>{city.error}</div>
        <input {...conform.input(country.config)} />
        <div>{country.error}</div>
      </fieldset>
      <button>Submit</button>
    </form>
  );
}
```

If you don't have direct access to the form ref, you can also pass a fieldset ref.

```tsx
import { type FieldConfig, useFieldset } from '@conform-to/react';
import { useRef } from 'react';

function Fieldset(config: FieldConfig<Address>) {
  const ref = useRef<HTMLFieldsetElement>(null);
  const { city, zipcode, street, country } = useFieldset(ref, config);

  return <fieldset ref={ref}>{/* ... */}</fieldset>;
}
```

<details>
<summary>Why does `useFieldset` require a ref object of the form or fieldset?</summary>

**conform** utilises the DOM as its context provider / input registry, which maintains a link between each input / button / fieldset with the form through the [form property](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement#properties). The ref object allows it to restrict the scope to elements associated to the same form only.

```tsx
function ExampleForm() {
  const formRef = useRef();
  const inputRef = useRef();

  useEffect(() => {
    // Both statements will log `true`
    console.log(formRef.current === inputRef.current.form);
    console.log(formRef.current.elements.namedItem('title') === inputRef.current)
  }, []);

  return (
    <form ref={formRef}>
      <input ref={inputRef} name="title">
    </form>
  );
}
```

</details>

---

### useFieldList

This hook enables you to work with [array](/docs/configuration.md#array) and support [list](#list) command button builder to modify a list. It can also be used with [useFieldset](#usefieldset) for [nested list](/docs/configuration.md#nested-list) at the same time.

```tsx
import { useForm, useFieldList, list } from '@conform-to/react';

/**
 * Consider the schema as follow:
 */
type Schema = {
  items: string[];
};

function Example() {
  const [form, { items }] = useForm<Schema>();
  const list = useFieldList(form.ref, items.config);

  return (
    <fieldset ref={ref}>
      {list.map((item, index) => (
        <div key={item.key}>
          {/* Setup an input per item */}
          <input {...conform.input(item.config)} />

          {/* Error of each item */}
          <span>{item.error}</span>

          {/* Setup a delete button (Note: It is `items` not `item`) */}
          <button {...list.remove(items.config.name, { index })}>Delete</button>
        </div>
      ))}

      {/* Setup a button that can append a new row with optional default value */}
      <button {...list.append(items.config.name, { defaultValue: '' })}>
        add
      </button>
    </fieldset>
  );
}
```

---

### useInputEvent

It returns a ref object and a set of helpers that dispatch corresponding dom event.

```tsx
import { useForm, useInputEvent } from '@conform-to/react';
import { Select, MenuItem } from '@mui/material';
import { useState, useRef } from 'react';

function MuiForm() {
  const [form, { category }] = useForm();
  const [value, setValue] = useState(category.config.defaultValue ?? '');
  const [ref, control] = useInputEvent({
    onReset: () => setValue(category.config.defaultValue ?? ''),
  });
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form {...form.props}>
      {/* Render a shadow input somewhere */}
      <input
        ref={ref}
        {...conform.input(category.config, { hidden: true })}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => inputRef.current?.focus()}
      />

      {/* MUI Select is a controlled component */}
      <TextField
        label="Category"
        inputRef={inputRef}
        value={value}
        onChange={control.change}
        onBlur={control.blur}
        select
      >
        <MenuItem value="">Please select</MenuItem>
        <MenuItem value="a">Category A</MenuItem>
        <MenuItem value="b">Category B</MenuItem>
        <MenuItem value="c">Category C</MenuItem>
      </TextField>
    </form>
  );
}
```

---

### useControlledInput

> This API is deprecated and replaced with the [useInputEvent](#useinputevent) hook.

It returns the properties required to configure a shadow input for validation and helper to integrate it. This is particularly useful when [integrating custom input components](/docs/integrations.md#custom-input-component) like dropdown and datepicker.

```tsx
import { useForm, useControlledInput } from '@conform-to/react';
import { Select, MenuItem } from '@mui/material';

function MuiForm() {
  const [form, { category }] = useForm();
  const [inputProps, control] = useControlledInput(category.config);

  return (
    <form {...form.props}>
      {/* Render a shadow input somewhere */}
      <input {...inputProps} />

      {/* MUI Select is a controlled component */}
      <TextField
        label="Category"
        inputRef={control.ref}
        value={control.value}
        onChange={control.onChange}
        onBlur={control.onBlur}
        inputProps={{
          onInvalid: control.onInvalid,
        }}
        select
      >
        <MenuItem value="">Please select</MenuItem>
        <MenuItem value="a">Category A</MenuItem>
        <MenuItem value="b">Category B</MenuItem>
        <MenuItem value="c">Category C</MenuItem>
      </TextField>
    </form>
  );
}
```

---

### conform

It provides several helpers to remove the boilerplate when configuring a form control.

You are recommended to create a wrapper on top if you need to integrate with custom input component. As the helper derives attributes for [accessibility](/docs/accessibility.md#configuration) concerns and helps [focus management](/docs/focus-management.md#focusing-before-javascript-is-loaded).

Before:

```tsx
import { useForm } from '@conform-to/react';

function Example() {
  const [form, { title, description, category }] = useForm();

  return (
    <form {...form.props}>
      <input
        type="text"
        name={title.config.name}
        form={title.config.form}
        defaultValue={title.config.defaultValue}
        requried={title.config.required}
        minLength={title.config.minLength}
        maxLength={title.config.maxLength}
        min={title.config.min}
        max={title.config.max}
        multiple={title.config.multiple}
        pattern={title.config.pattern}
      />
      <textarea
        name={description.config.name}
        form={description.config.form}
        defaultValue={description.config.defaultValue}
        requried={description.config.required}
        minLength={description.config.minLength}
        maxLength={description.config.maxLength}
      />
      <select
        name={category.config.name}
        form={category.config.form}
        defaultValue={category.config.defaultValue}
        requried={category.config.required}
        multiple={category.config.multiple}
      >
        {/* ... */}
      </select>
    </form>
  );
}
```

After:

```tsx
import { useForm, conform } from '@conform-to/react';

function Example() {
  const [form, { title, description, category }] = useForm();

  return (
    <form {...form.props}>
      <input {...conform.input(title.config, { type: 'text' })} />
      <textarea {...conform.textarea(description.config)} />
      <select {...conform.select(category.config)}>{/* ... */}</select>
    </form>
  );
}
```

---

### list

It provides serveral helpers to configure a command button for [modifying a list](/docs/commands.md#modifying-a-list).

```tsx
import { list } from '@conform-to/react';

function Example() {
  return (
    <form>
      {/* To append a new row with optional defaultValue */}
      <button {...list.append('name', { defaultValue })}>Append</button>

      {/* To prepend a new row with optional defaultValue */}
      <button {...list.prepend('name', { defaultValue })}>Prepend</button>

      {/* To remove a row by index */}
      <button {...list.remove('name', { index })}>Remove</button>

      {/* To replace a row with another defaultValue */}
      <button {...list.replace('name', { index, defaultValue })}>
        Replace
      </button>

      {/* To reorder a particular row to an another index */}
      <button {...list.reorder('name', { from, to })}>Reorder</button>
    </form>
  );
}
```

---

### validate

It returns the properties required to configure a command button for [validation](/docs/commands.md#validation).

```tsx
import { validate } from '@conform-to/react';

function Example() {
  return (
    <form>
      {/* To validate a single field by name */}
      <button {...validate('email')}>Validate email</button>

      {/* To validate the whole form */}
      <button {...validate()}>Validate</button>
    </form>
  );
}
```

---

### requestCommand

It lets you [trigger a command](/docs/commands.md#triggering-a-command) without requiring users to click on a button. It supports both [list](#list) and [validate](#validate) command.

```tsx
import {
  useForm,
  useFieldList,
  conform,
  list,
  requestCommand,
} from '@conform-to/react';
import DragAndDrop from 'awesome-dnd-example';

export default function Todos() {
  const [form, { tasks }] = useForm();
  const taskList = useFieldList(form.ref, tasks.config);

  const handleDrop = (from, to) =>
    requestCommand(form.ref.current, list.reorder({ from, to }));

  return (
    <form {...form.props}>
      <DragAndDrop onDrop={handleDrop}>
        {taskList.map((task, index) => (
          <div key={task.key}>
            <input {...conform.input(task.config)} />
          </div>
        ))}
      </DragAndDrop>
      <button>Save</button>
    </form>
  );
}
```

---

### getFormElements

It returns all _input_ / _select_ / _textarea_ or _button_ in the forms. Useful when looping through the form elements to validate each field manually.

```tsx
import { useForm, parse, getFormElements } from '@conform-to/react';

export default function LoginForm() {
  const [form] = useForm({
    onValidate({ form, formData }) {
      const submission = parse(formData);

      for (const element of getFormElements(form)) {
        switch (element.name) {
          case 'email': {
            if (element.validity.valueMissing) {
              submission.error.push([element.name, 'Email is required']);
            } else if (element.validity.typeMismatch) {
              submission.error.push([element.name, 'Email is invalid']);
            }
            break;
          }
          case 'password': {
            if (element.validity.valueMissing) {
              submission.error.push([element.name, 'Password is required']);
            }
            break;
          }
        }
      }

      return submission;
    },

    // ....
  });

  // ...
}
```

---

### hasError

This helper checks if there is any message defined in error array with the provided name.

```ts
import { hasError } from '@conform-to/react';

/**
 * Assume the error looks like this:
 */
const error = [['email', 'Email is required']];

// This will log `true`
console.log(hasError(error, 'email'));

// This will log `false`
console.log(hasError(error, 'password'));
```

---

### parse

It parses the formData based on the [naming convention](/docs/submission).

```tsx
import { parse } from '@conform-to/react';

const formData = new FormData();
const submission = parse(formData);

console.log(submission);
```

---

### shouldValidate

This helper checks if the scope of validation includes a specific field by checking the submission:

```tsx
import { shouldValidate } from '@conform-to/react';

/**
 * The submission type and intent give us hint on what should be valdiated.
 * If the type is 'validate', only the field with name matching the metadata must be validated.
 * If the type is 'submit', everything should be validated (Default submission)
 */
const submission = {
  context: 'validate',
  intent: 'email',
  value: {},
  error: [],
};

// This will log 'true'
console.log(shouldValidate(submission, 'email'));

// This will log 'false'
console.log(shouldValidate(submission, 'password'));
```
