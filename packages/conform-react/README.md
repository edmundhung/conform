# @conform-to/react

> [React](https://github.com/facebook/react) adapter for [conform](https://github.com/edmundhung/conform)

<!-- aside -->

## API Reference

- [useForm](#useform)
- [useFieldset](#usefieldset)
- [useFieldList](#usefieldlist)
- [useControlledInput](#usecontrolledinput)
- [conform](#conform)
- [getFormError](#getFormError)
- [hasError](#haserror)
- [isFieldElement](#isfieldelement)
- [parse](#parse)
- [shouldValidate](#shouldvalidate)

<!-- /aside -->

### useForm

By default, the browser calls the [reportValidity()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/reportValidity) API on the form element when it is submitted. This checks the validity of all the fields in it and reports if there are errors through the bubbles.

This hook enhances the form validation behaviour in 3 parts:

1. It enhances form validation with custom rules by subscribing to different DOM events and reporting the errors only when it is configured to do so.
2. It unifies client and server validation in one place.
3. It exposes the state of each field in the form of [data attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/data-*), such as `data-conform-touched`, allowing flexible styling across your form without the need to manipulate the class names.

```tsx
import { useForm } from '@conform-to/react';

function LoginForm() {
  const form = useForm({
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
    onValidate({ form, formData, submission }) {
      // ...
    },

    /**
     * The submit event handler of the form.
     */
    onSubmit(event, { form, formData, submission }) {
      // ...
    },
  });

  // ...
}
```

<details>
<summary>What is `form.props`?</summary>

It is a group of properties properties required to hook into form events. They can also be set explicitly as shown below:

```tsx
function RandomForm() {
  const form = useForm();

  return (
    <form
      ref={form.props.ref}
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
  const form = useForm();

  return (
    <Form method="post" action="/login" {...form.props}>
      {/* ... */}
    </Form>
  );
}
```

</details>

<details>
<summary>Is the `onValidate` function required?</summary>

The `onValidate` function is not required if the validation logic can be fully covered by the [native constraints](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Constraint_validation#validation-related_attributes), e.g. **required** / **min** / **pattern** etc.

```tsx
import { useForm, useFieldset } from '@conform-to/react';

function LoginForm() {
  const formProps = useForm();
  const { email, password } = useFieldset(formProps.ref);

  return (
    <form {...formProps}>
      <label>
        <input type="email" name="email" required />
        {email.error}
      </label>
      <label>
        <input type="password" name="password" required />
        {password.error}
      </label>
      <button type="submit">Login</button>
    </form>
  );
}
```

</details>

---

### useFieldset

This hook can be used to monitor the state of each field and help configuration. It lets you:

1. Capturing errors at the form/fieldset level, removing the need to setup invalid handler on each field.
2. Defining config in one central place. e.g. name, default value and constraint, then distributing it to each field with the [conform](#conform) helpers.

```tsx
import { useForm, useFieldset } from '@conform-to/react';

/**
 * Consider the schema as follow:
 */
type Book = {
  name: string;
  isbn: string;
};

function BookFieldset() {
  const formProps = useForm();
  const { name, isbn } = useFieldset<Book>(
    /**
     * A ref object of the form element or fieldset element
     */
    formProps.ref,
    {
      /**
       * The prefix used to generate the name of nested fields.
       */
      name: 'book',

      /**
       * An object representing the initial value of the fieldset.
       */
      defaultValue: {
        isbn: '0340013818',
      },

      /**
       * An object describing the initial error of each field
       */
      initialError: {
        isbn: 'Invalid ISBN',
      },

      /**
       * An object describing the constraint of each field
       */
      constraint: {
        isbn: {
          required: true,
          pattern: '[0-9]{10,13}',
        },
      },

      /**
       * The id of the form. This is required only if you
       * are connecting each field to a form remotely.
       */
      form: 'remote-form-id',
    },
  );

  /**
   * Latest error of the field
   * This would be 'Invalid ISBN' initially as specified
   * in the initialError config
   */
  console.log(isbn.error);

  /**
   * This would be `book.isbn` instead of `isbn`
   * if the `name` option is provided
   */
  console.log(isbn.config.name);

  /**
   * This would be `0340013818` if specified
   * on the `initalValue` option
   */
  console.log(isbn.config.defaultValue);

  /**
   * Initial error message
   * This would be 'Invalid ISBN' if specified
   */
  console.log(isbn.config.initialError);

  /**
   * This would be `random-form-id`
   * because of the `form` option provided
   */
  console.log(isbn.config.form);

  /**
   * Constraint of the field (required, minLength etc)
   *
   * For example, the constraint of the isbn field would be:
   * {
   *   required: true,
   *   pattern: '[0-9]{10,13}'
   * }
   */
  console.log(isbn.config.required);
  console.log(isbn.config.pattern);

  return <form {...formProps}>{/* ... */}</form>;
}
```

If you don't have direct access to the form ref, you can also pass a fieldset ref.

```tsx
import { useFieldset } from '@conform-to/react';
import { useRef } from 'react';

function Fieldset() {
  const ref = useRef();
  const fieldset = useFieldset(ref);

  return <fieldset ref={ref}>{/* ... */}</fieldset>;
}
```

<details>
<summary>Why does `useFieldset` require a ref object of the form or fieldset?</summary>

Unlike most of the form validation library out there, **conform** use the DOM as its context provider. As the dom maintains a link between each input / button / fieldset with the form through the [form property](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement#properties) of these elements. The ref object allows us restricting the scope to elements associated to the same form only.

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

It returns a list of key and config, with helpers to configure command buttons with [list command](/docs/submission.md#list-command).

```tsx
import { useFieldset, useFieldList } from '@conform-to/react';
import { useRef } from 'react';

/**
 * Consider the schema as follow:
 */
type Book = {
  name: string;
  isbn: string;
};

type Collection = {
  books: Book[];
};

function CollectionFieldset() {
  const ref = useRef();
  const { books } = useFieldset<Collection>(ref);
  const [bookList, command] = useFieldList(ref, books.config);

  return (
    <fieldset ref={ref}>
      {bookList.map((book, index) => (
        <div key={book.key}>
          {/* To setup the fields */}
          <input
            name={`${book.config.name}.name`}
            defaultValue={book.config.defaultValue.name}
          />
          <input
            name={`${book.config.name}.isbn`}
            defaultValue={book.config.defaultValue.isbn}
          />

          {/* To setup a delete button */}
          <button {...command.remove({ index })}>Delete</button>
        </div>
      ))}

      {/* To setup a button that can append a new row with optional default value */}
      <button {...command.append({ defaultValue: { name: '', isbn: '' } })}>
        add
      </button>
    </fieldset>
  );
}
```

This hook can also be used in combination with `useFieldset` to distribute the config:

```tsx
import { useForm, useFieldset, useFieldList } from '@conform-to/react';
import { useRef } from 'react';

function CollectionFieldset() {
  const ref = useRef();
  const { books } = useFieldset<Collection>(ref);
  const [bookList, command] = useFieldList(ref, books.config);

  return (
    <fieldset ref={ref}>
      {bookList.map((book, index) => (
        <div key={book.key}>
          {/* `book.config` is a FieldConfig object similar to `books` */}
          <BookFieldset {...book.config} />

          {/* To setup a delete button */}
          <button {...command.remove({ index })}>Delete</button>
        </div>
      ))}

      {/* To setup a button that can append a new row */}
      <button {...command.append()}>add</button>
    </fieldset>
  );
}

/**
 * This is basically the BookFieldset component from
 * the `useFieldset` example, but setting all the
 * options with the component props instead
 */
function BookFieldset({ name, form, defaultValue, error }) {
  const ref = useRef();
  const { name, isbn } = useFieldset(ref, {
    name,
    form,
    defaultValue,
    error,
  });

  return <fieldset ref={ref}>{/* ... */}</fieldset>;
}
```

<details>
  <summary>What can I do with `controls`?</summary>

```tsx
// To append a new row with optional defaultValue
<button {...controls.append({ defaultValue })}>Append</button>;

// To prepend a new row with optional defaultValue
<button {...controls.prepend({ defaultValue })}>Prepend</button>;

// To remove a row by index
<button {...controls.remove({ index })}>Remove</button>;

// To replace a row with another defaultValue
<button {...controls.replace({ index, defaultValue })}>Replace</button>;

// To reorder a particular row to an another index
<button {...controls.reorder({ from, to })}>Reorder</button>;
```

</details>

---

### useControlledInput

It returns the properties required to configure a shadow input for validation. This is particular useful when integrating dropdown and datepicker whichs introduces custom input mode.

```tsx
import { useFieldset, useControlledInput } from '@conform-to/react';
import { Select, MenuItem } from '@mui/material';
import { useRef } from 'react';

function MuiForm() {
  const ref = useRef();
  const { category } = useFieldset(schema);
  const [inputProps, control] = useControlledInput(category.config);

  return (
    <fieldset ref={ref}>
      {/* Render a shadow input somewhere */}
      <input {...inputProps} />

      {/* MUI Select is a controlled component */}
      <Select
        label="Category"
        inputRef={control.ref}
        value={control.value}
        onChange={control.onChange}
        onBlur={control.onBlur}
        inputProps={{
          onInvalid: control.onInvalid
        }}
      >
        <MenuItem value="">Please select</MenuItem>
        <MenuItem value="a">Category A</MenuItem>
        <MenuItem value="b">Category B</MenuItem>
        <MenuItem value="c">Category C</MenuItem>
      </TextField>
    </fieldset>
  );
}
```

---

### conform

It provides several helpers to configure a native input field quickly:

```tsx
import { useFieldset, conform } from '@conform-to/react';
import { useRef } from 'react';

function RandomForm() {
  const ref = useRef();
  const { category } = useFieldset(ref);

  return (
    <fieldset ref={ref}>
      <input {...conform.input(category.config, { type: 'text' })} />
      <textarea {...conform.textarea(category.config)} />
      <select {...conform.select(category.config)}>{/* ... */}</select>
    </fieldset>
  );
}
```

This is equivalent to:

```tsx
function RandomForm() {
  const ref = useRef();
  const { category } = useFieldset(ref);

  return (
    <fieldset ref={ref}>
      <input
        type="text"
        name={category.config.name}
        form={category.config.form}
        defaultValue={category.config.defaultValue}
        requried={category.config.required}
        minLength={category.config.minLength}
        maxLength={category.config.maxLength}
        min={category.config.min}
        max={category.config.max}
        multiple={category.config.multiple}
        pattern={category.config.pattern}
      >
      <textarea
        name={category.config.name}
        form={category.config.form}
        defaultValue={category.config.defaultValue}
        requried={category.config.required}
        minLength={category.config.minLength}
        maxLength={category.config.maxLength}
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
    </fieldset>
  );
}
```

---

### getFormError

It will loop through the form elements and call the provided validate function on each field. The result will then be formatted to the conform error structure. It can be used for client validation only.

```tsx
export default function LoginForm() {
  const form = useForm({
    onValidate({ form, formData }) {
      const submission = parse(formData);
      const error = getFormError(form, (element) => {
        const messages: string[] = [];

        switch (element.name) {
          case 'email': {
            if (element.validity.valueMissing) {
              /**
               * This will be true when the input is marked as `required`
               * while the input is blank
               */
              messages.push('Email is required');
            } else if (element.validity.typeMismatch) {
              /**
               * This will be true when the input type is `email`
               * while the value does not match
               */
              messages.push('Email is invalid');
            } else if (!element.value.endsWith('gmail.com')) {
              /**
               * We can also validate the field manually with custom logic
               */
              messages.push('Only gmail is accepted');
            }
            break;
          }
          case 'password': {
            // ...
            break;
          }
        }

        return messages;
      });

      // Returns the submission state
      return {
        ...submission,
        error: submission.error.concat(error),
      };
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

### isFieldElement

This checks if the provided element is an `input` / `select` / `textarea` or `button` HTML element with type guard. Useful when you need to access the validityState of the fields and modify the validation message manually.

```tsx
import { isFieldElement } from '@conform-to/react';

export default function SignupForm() {
  const form = useForm({
    onValidate({ form }) {
      for (const element of form.elements) {
        if (isFieldElement(element)) {
          switch (field.name) {
            case 'email':
              if (field.validity.valueMissing) {
                field.setCustomValidity('Email is required');
              } else if (field.validity.typeMismatch) {
                field.setCustomValidity('Please enter a valid email');
              } else {
                field.setCustomValidity('');
              }
              break;
            case 'password':
              // ...
              break;
            case 'confirm-password': {
              // ...
              break;
            }
          }
        }
      }
    },
  });

  // ...
}
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
