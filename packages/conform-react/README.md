# @conform-to/react

> [React](https://github.com/facebook/react) adapter for [conform](https://github.com/edmundhung/conform)

<!-- aside -->

## API Reference

- [useForm](#useform)
- [useFieldset](#usefieldset)
- [useFieldList](#usefieldlist)
- [useInputEvent](#useinputevent)
- [conform](#conform)
- [parse](#parse)
- [validateConstraint](#validateconstraint)
- [list](#list)
- [validate](#validate)
- [requestIntent](#requestintent)
- [isFieldElement](#isfieldelement)

<!-- /aside -->

### useForm

By default, the browser calls the [reportValidity()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/reportValidity) API on the form element when a submission is triggered. This checks the validity of all the fields and reports through the error bubbles.

This hook enhances the form validation behaviour by:

- Enabling customizing validation logic.
- Capturing error message and removes the error bubbles.
- Preparing all properties required to configure the form elements.

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
     * Define when conform should start validation.
     * Support "onSubmit", "onChange", "onBlur".
     *
     * Default to `onSubmit`.
     */
    shouldValidate: 'onSubmit',

    /**
     * Define when conform should revalidate again.
     * Support "onSubmit", "onChange", "onBlur".
     *
     * Default based on `shouldValidate`
     */
    shouldRevalidate: 'onInput',

    /**
     * An object representing the initial value of the form.
     */
    defaultValue: undefined,

    /**
     * The last submission result from the server
     */
    lastSubmission: undefined,

    /**
     * An object describing the constraint of each field
     */
    constraint: undefined,

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
    onSubmit(event, { formData, submission, action, encType, method }) {
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

This hook enables you to work with [nested object](/docs/complex-structures.md#nested-object) by monitoring the state of each nested field and prepraing the config required.

```tsx
import { useForm, useFieldset } from '@conform-to/react';

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
    address,
  );

  return (
    <form {...form.props}>
      <fieldset>
        <legned>Address</legend>
        <input name={street.name} />
        <div>{street.error}</div>
        <input name={zipcode.name} />
        <div>{zipcode.error}</div>
        <input name={city.name} />
        <div>{city.error}</div>
        <input name={country.name} />
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

**conform** utilises the DOM as its context provider / input registry, which maintains a link between each input / button / fieldset with the form through the [form property](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement#properties). The ref object allows it to restrict the scope to form elements associated to the same form only.

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

This hook enables you to work with [array](/docs/complex-structures.md#array) and support the [list](#list) intent button builder to modify a list. It can also be used with [useFieldset](#usefieldset) for [nested list](/docs/complex-structures.md#nested-list) at the same time.

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
  const itemsList = useFieldList(form.ref, items);

  return (
    <fieldset ref={ref}>
      {itemsList.map((item, index) => (
        <div key={item.key}>
          {/* Setup an input per item */}
          <input name={item.name} />

          {/* Error of each item */}
          <span>{item.error}</span>

          {/* Setup a delete button (Note: It is `items` not `item`) */}
          <button {...list.remove(items.name, { index })}>Delete</button>
        </div>
      ))}

      {/* Setup a button that can append a new row with optional default value */}
      <button {...list.insert(items.name, { defaultValue: '' })}>add</button>
    </fieldset>
  );
}
```

---

### useInputEvent

It returns a set of helpers that dispatch corresponding dom event.

```tsx
import { useForm, useInputEvent } from '@conform-to/react';
import { Select, MenuItem } from '@mui/material';
import { useState, useRef } from 'react';

function MuiForm() {
  const [form, { category }] = useForm();
  const [value, setValue] = useState(category.defaultValue ?? '');
  const baseInputRef = useRef<HTMLInputElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);
  const control = useInputEvent({
    ref: baseInputRef,
    // Reset the state on form reset
    onReset: () => setValue(category.defaultValue ?? ''),
  });

  return (
    <form {...form.props}>
      {/* Render a base input somewhere */}
      <input
        ref={baseInputRef}
        {...conform.input(category, { hidden: true })}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => customInputRef.current?.focus()}
      />

      {/* MUI Select is a controlled component */}
      <TextField
        label="Category"
        inputRef={customInputRef}
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

### conform

It provides several helpers to:

- Minimize the boilerplate when configuring a form control
- Derive aria attributes for [accessibility](/docs/accessibility.md#configuration)
- Helps [focus management](/docs/focus-management.md#focusing-before-javascript-is-loaded)

```tsx
// Before
function Example() {
  const [form, { title }] = useForm();

  return (
    <form {...form.props}>
      <input
        type="text"
        name={title.name}
        form={title.form}
        defaultValue={title.defaultValue}
        autoFocus={title.initialError ? true : undefined}
        required={title.required}
        minLength={title.minLength}
        maxLength={title.maxLength}
        min={title.min}
        max={title.max}
        multiple={title.multiple}
        pattern={title.pattern}
        aria-invalid={title.error ? true : undefined}
        aria-describedby={title.error ? `${title.name}-error` : undefined}
      />
    </form>
  );
}

// After:
function Example() {
  const [form, { title, description, category }] = useForm();

  return (
    <form {...form.props}>
      <input
        {...conform.input(title, {
          type: 'text',
        })}
      />
    </form>
  );
}
```

---

### parse

It parses the formData based on the [naming convention](/docs/complex-structures.md#naming-convention) with the validation result from the resolver.

```tsx
import { parse } from '@conform-to/react';

const formData = new FormData();
const submission = parse(formData, {
  resolve({ email, password }) {
    const error: Record<string, string[]> = {};

    if (typeof email !== 'string') {
      error.email = ['Email is required'];
    } else if (!/^[^@]+@[^@]+$/.test(email)) {
      error.email = ['Email is invalid'];
    }

    if (typeof password !== 'string') {
      error.password = ['Password is required'];
    }

    if (error.email || error.password) {
      return { error };
    }

    return {
      value: { email, password },
    };
  },
});
```

---

### validateConstraint

> This is a client only API

This enable Constraint Validation with ability to enable custom constraint using data-attribute and customizing error messages. By default, the error message would be the attribute that triggered the error (e.g. `required` / `type` / 'minLength' etc).

```tsx
import { useForm, validateConstraint } from '@conform-to/react';
import { Form } from 'react-router-dom';

export default function SignupForm() {
    const [form, { email, password, confirmPassword }] = useForm({
        onValidate(context) {
            // This enables validating each field based on the validity state and custom cosntraint if defined
            return validateConstraint(
              ...context,
              constraint: {
                // Define custom constraint
                match(value, { formData, attributeValue }) {
                    // Check if the value of the field match the value of another field
                    return value === formData.get(attributeValue);
                },
            });
        }
    });

    return (
        <Form method="post" {...form.props}>
            <div>
                <label>Email</label>
                <input
                    name="email"
                    type="email"
                    required
                    pattern="[^@]+@[^@]+\\.[^@]+"
                />
                {email.error === 'required' ? (
                    <div>Email is required</div>
                ) : email.error === 'type' ? (
                    <div>Email is invalid</div>
                ) : null}
            </div>
            <div>
                <label>Password</label>
                <input
                    name="password"
                    type="password"
                    required
                />
                {password.error === 'required' ? (
                    <div>Password is required</div>
                ) : null}
            </div>
            <div>
                <label>Confirm Password</label>
                <input
                    name="confirmPassword"
                    type="password"
                    required
                    data-constraint-match="password"
                />
                {confirmPassword.error === 'required' ? (
                    <div>Confirm Password is required</div>
                ) : confirmPassword.error === 'match' ? (
                    <div>Password does not match</div>
                ) : null}
            </div>
            <button>Signup</button>
        </Form>
    );
}
```

---

### list

It provides serveral helpers to configure an intent button for [modifying a list](/docs/intent-button.md#modifying-a-list).

```tsx
import { list } from '@conform-to/react';

function Example() {
  return (
    <form>
      {/*
        To insert a new row with optional defaultValue at a given index.
        If no index is given, then the element will be appended at the end of the list.
      */}
      <button {...list.insert('name', { index, defaultValue })}>Insert</button>

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

It returns the properties required to configure an intent button for [validation](/docs/intent-button.md#validation).

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

### requestIntent

It lets you [trigger an intent](/docs/intent-button.md#triggering-an-intent) without requiring users to click on a button. It supports both [list](#list) and [validate](#validate) intent.

```tsx
import {
  useForm,
  useFieldList,
  conform,
  list,
  requestIntent,
} from '@conform-to/react';
import DragAndDrop from 'awesome-dnd-example';

export default function Todos() {
  const [form, { tasks }] = useForm();
  const taskList = useFieldList(form.ref, tasks);

  const handleDrop = (from, to) =>
    requestIntent(form.ref.current, list.reorder({ from, to }));

  return (
    <form {...form.props}>
      <DragAndDrop onDrop={handleDrop}>
        {taskList.map((task, index) => (
          <div key={task.key}>
            <input {...conform.input(task)} />
          </div>
        ))}
      </DragAndDrop>
      <button>Save</button>
    </form>
  );
}
```

---

### isFieldElement

This is an utility for checking if the provided element is a form element (_input_ / _select_ / _textarea_ or _button_) which also works as a type guard.

```tsx
function Example() {
  return (
    <form
      onFocus={(event) => {
        if (isFieldElement(event.target)) {
          // event.target is now considered one of the form elements type
        }
      }}
    >
      {/* ... */}
    </form>
  );
}
```
