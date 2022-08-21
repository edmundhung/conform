# @conform-to/react

> [React](https://github.com/facebook/react) adapter for [conform](https://github.com/edmundhung/conform)

## API Reference

- [useForm](#useForm)
- [useFieldset](#useFieldset)
- [useFieldList](#useFieldList)
- [useControlledInput](#useControlledInput)
- [conform](#conform)

---

### useForm

By default, the browser calls [reportValidity()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/reportValidity) on the form element when you submit the form. This checks the validity of all the fields in it and reports if there are errors through the bubbles.

This hook enhances this behaviour by allowing the developers to decide the best timing to start reporting errors using the `initialReport` option. This could start as earliest as the user typing or as late as the user submit the form.

But, setting `initialReport` to `onSubmit` still works different from the native browser behaviour, which basically calls `reportValidity()` only at the time a submit event is received. The `useForm` hook introduces a **touched** state to each fields. It will eagerly report the validity of the field once it is touched. Any errors reported later will be updated as soon as new errors are found.

Feel free to **SKIP** this if the native browser behaviour fullfills your need.

```tsx
import { useForm } from '@conform-to/react';

function RandomForm() {
  const formProps = useForm({
    /**
     * Decide when the error should be reported initially.
     * The options are `onSubmit`, `onBlur` or `onChange`.
     * Default to `onSubmit`
     */
    initialReport: 'onBlur',

    /**
     * Native browser report will be enabled before hydation
     * if this is set to `true`. Default to `false`.
     */
    fallbackNative: true,

    /**
     * The form could be submitted regardless of the validity
     * of the form if this is set to `true`. Default to
     * `false`.
     */
    noValidate: false,

    /**
     * Form submit handler
     *
     * It will NOT be called if
     * (1) one of the fields is invalid, and
     * (2) noValidate is set to false
     */
    onSubmit(e) {
      // ...
    },

    /**
     * Form reset handler
     */
    onReset(e) {
      // ...
    },
  });

  return <form {...formProps}>{/* ... */}</form>;
}
```

<details>
<summary>What is `formProps`?</summary>

It is a group of properties required to setup the form. They can also be set explicitly as shown below:

```tsx
<form
  ref={formProps.ref}
  onSubmit={formProps.onSubmit}
  onReset={formProps.onReset}
  noValidate={formProps.noValidate}
>
  {/* ... */}
</form>
```

</details>

---

### useFieldset

This hook prepares all the config you need to setup the fieldset based on the provided schema.

```tsx
import { useFieldset } from '@conform-to/react';

/**
 * Schema of the fieldset
 *
 * Defining a schema manually could be error-prone. It
 * is strongly recommended to use a schema validation
 * library with a schema resolver.
 *
 * Currently only Zod is supported and Yup support is
 * coming soon. Please check the corresponding package
 * for the setup required
 */
const schema = /*
  Assuming this to be a schema for book and it looks like this:

  type Book = {
    name: string;
    isbn: string;
  }

*/

function BookFieldset() {
  const [
    fieldsetProps,
    /**
     * The variables `name` and `isbn` are FieldProps objects
     * They are used to configure the field (input, select, textarea)
     *
     * Please check the docs of the `conform` helpers for how to
     * use them together
     */
    {
      name,
      isbn,
    },
  ] = useFieldset(schema, {
    /**
     * Name of the fieldset
     * Required only for nested fieldset.
     */
    name: 'book',

    /**
     * Id of the form
     * Required only if the fieldset is placed out of the form
     */
    form: 'random-form-id',

    /**
     * Default value of the fieldset
     */
    defaultValue: {
      isbn: '0340013818',
    },

    /**
     * Error reported by the server
     */
    error: {
      isbn: 'Invalid ISBN',
    },
  });

  const {
    /**
     * This would be `book.isbn` instead of `isbn`
     * if the `name` option is provided
     */
    name,

    /**
     * This would be `random-form-id`
     * because of the `form` option provided
     */
    form,

    /**
     * This would be `0340013818` if specified
     * on the `initalValue` option
     */
    defaultValue,

    /**
     * Current error message
     * This would be 'Invalid ISBN' initially if specified
     * on the `error` option
     */
    error,

    /**
     * Constraint of the field (required, minLength etc)
     *
     * For example, the constraint of the isbn field could be:
     * {
     *   required: true,
     *   pattern: '[0-9]{10,13}'
     * }
     */
    ...constraint,
  } = isbn;

  return (
    <fieldset {...fieldsetProps}>
      {/* ... */}
    </fieldset>)
  );
}
```

<details>
  <summary>What is `fieldsetProps`?</summary>

It is a group of properties required to setup the fieldset. They can also be set explicitly as shown below:

```tsx
<fieldset
  ref={fieldsetProps.ref}
  name={fieldsetProps.name}
  form={fieldsetProps.form}
  onInput={fieldsetProps.onInput}
  onInvalid={fieldsetProps.onInvalid}
>
  {/* ... */}
</fieldset>
```

</details>

<details>
<summary>How is a schema looks like?</summary>

```tsx
import type { Schema } from '@conform-to/react';

/**
 * Defining a schema manually
 */
const bookSchema: Schema<{
  name: string;
  isbn: string;
  quantity?: number;
}> = {
  /**
   * Define the fields with its constraint together
   */
  fields: {
    name: {
      required: true,
    },
    isbn: {
      required: true,
      minLength: 10,
      maxLength: 13,
      pattern: '[0-9]{10,13}',
    },
    quantity: {
      min: '0',
    },
  },

  /**
   * Customise validation behaviour
   * Fallbacks to native browser validation if not specified
   */
  validate(fieldset) {
    /**
     * Lookup the field elements using the fieldset element
     */
    const [name] = getFieldElements(fieldset, 'name');

    if (name.validity.valueMissing) {
      /**
       * Setting error message based on validity
       */
      name.setCustomValidity('Required');
    } else if (name.value === 'something') {
      /**
       * Setting error message based on custom constraint
       */
      name.setCustomValidity('Please enter a valid name');
    } else {
      /**
       * Clearing the error message (Important!)
       */
      name.setCustomValidity('');
    }
  },
};
```

</details>

---

### useFieldList

This hook is used in combination with `useFieldset` to handle array structure:

```tsx
import { useFieldset, useFieldList } from '@conform-to/react';

/**
 * Consider the schema as follow:
 *
 * type Collection = {
 *   books: Array<{ name: string; isbn: string; }>
 * }
 */

function CollectionForm() {
  const [fieldsetProps, { books }] = useFieldset(collectionSchema);
  const [bookList, control] = useFieldList(fieldsetProps.ref, books);

  return (
    <fieldset {...fieldsetProps}>
      {bookList.map((book, index) => (
        <div key={book.key}>
          {/* `book.props` is a FieldProps object similar to `books` */}
          <BookFieldset {...book.props}>

          {/* To setup a delete button */}
          <button {...control.remove({ index })}>Delete</button>
        </div>
      ))}

      {/* To setup a button that can append a new row */}
      <button {...control.append()}>add</button>
    </fieldset>
  );
}

/**
 * This is basically the BookFieldset component from
 * the `useFieldset` example, but setting all the
 * options with the component props instead
 */
function BookFieldset({ name, form, defaultValue, error }) {
  const [fieldsetProps, { name, isbn }] = useFieldset(bookSchema, {
    name,
    form,
    defaultValue,
    error,
  });

  return (
    <fieldset {...fieldsetProps}>
      {/* ... */}
    </fieldset>
  );
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

It helps hooking up a controlled component with a shadow input for validation. This is particular useful when integrating dropdown and datepicker whichs introuces different input mode.

```tsx
import { useControlledInput } from '@conform-to/react';
import { Select, MenuItem } from '@mui/material';

function MuiForm() {
  const [fieldsetProps, { category }] = useFieldset(schema);
  const [inputProps, control] = useControlledInput(category);

  return (
    <fieldset {...fieldsetProps}>
      {/* Render a shadow input somewhere */}
      <input {...inputProps} />

      {/* MUI Select is a controlled component */}
      <Select
        label="Category"
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
  )
}
```

---

### conform

It provides several helpers to setup a native input field quickly:

```tsx
import { conform } from '@conform-to/react';

function RandomForm() {
  const [setupFieldset, { cateogry }] = useFieldset(/* ... */);

  return (
    <fieldset {...setupFieldset}>
      <input {...conform.input(cateogry, { type: 'text' })} />
      <textarea {...conform.textarea(cateogry)} />
      <select {...conform.select(cateogry)}>{/* ... */}</select>
    </fieldset>
  );
}
```

This is equivalent to:

```tsx
function RandomForm() {
  const [setupFieldset, { cateogry }] = useFieldset(/* ... */);

  return (
    <fieldset {...setupFieldset}>
      <input
        type="text"
        name={cateogry.name}
        form={cateogry.form}
        defaultValue={cateogry.defaultValue}
        requried={cateogry.required}
        minLength={cateogry.minLength}
        maxLength={cateogry.maxLength}
        min={cateogry.min}
        max={cateogry.max}
        multiple={cateogry.multiple}
        pattern={cateogry.pattern}
      >
      <textarea
        name={cateogry.name}
        form={cateogry.form}
        defaultValue={cateogry.defaultValue}
        requried={cateogry.required}
        minLength={cateogry.minLength}
        maxLength={cateogry.maxLength}
      />
      <select
        name={cateogry.name}
        form={cateogry.form}
        defaultValue={cateogry.defaultValue}
        requried={cateogry.required}
        multiple={cateogry.multiple}
      >
        {/* ... */}
      </select>
    </fieldset>
  );
}
```
