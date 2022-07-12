# @conform-to/react

> [React](https://github.com/facebook/react) adapter for [conform](https://github.com/edmundhung/conform)

## API Reference

- [useForm](#useForm)
- [useFieldset](#useFieldset)
- [useFieldList](#useFieldList)
- [useControlledInput](#useControlledInput)
- [conform](#conform)

### useForm

By default, the browser calls [reportValidity()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/reportValidity) on the form element when you submit the form. This checks the validity of all the fields in it and reports if there are errors through the bubbles.

This hook enhances this behaviour by allowing the developers to decide the best timing to start reporting errors using the `initialReport` option. This could start as earliest as the user typing or as late as the user submit the form.

But, setting `initialReport` to `onSubmit` still works different from the native browser behaviour, which basically calls `reportValidity()` only at the time a submit event is received. The `useForm` hook introduces a **touched** state to each fields. It will eagerly report the validity of the field once it is touched. Any errors reported later will be updated as soon as new errors are found.

Feel free to **SKIP** setting up this hook if the native browser behaviour fullfills your need.

```tsx
import { useForm } from '@conform-to/react';

function RandomForm() {
  const setupForm = useForm({
    /**
     * Decide when the error should be reported initially.
     * Options: onSubmit | onBlur | onChange
     * Default: onSubmit
     */
    initialReport: 'onBlur',

    /**
     * Native browser report will be enabled before hydation
     * if this is set to `true`.
     * Default: `false`
     */
    fallbackNative: true,

    /**
     * The form could be submitted regardless of any invalid
     * inputs exists or not if this is set to `true`.
     * Default: `false`
     */
    noValidate: false,

    /**
     * The submit handler will be triggered when
     * (1) All the fields are valid, or
     * (2) noValidate is set to `true`
     */
    onSubmit(e) {
        // ...
    },

    /**
     * The reset handler will be triggered when
     * (1) The reset button of the form is clicked, or
     * (2) The reset function of the form is called
     */
    onReset(e) {
        // ...
    },
  });

  return <form {...setupForm}>{/* ... */}</form>;

  // This is equivalent to:
  //
  // return (
  //     <form
  //         ref={setupForm.ref}
  //         onSubmit={setupForm.onSubmit}
  //         onReset={setupForm.onReset}
  //         noValidate={setForm.noValidate}
  //     >
  //         {/* ... */}
  //     </form>
  // );
}
```

### useFieldset

```tsx
import { useFieldset } from '@conform-to/react';

const schema = {
  /**
   * Define the schema and the constraint of each fields
   */
  fields: {
    isbn: {
      required: true,
      minLength: 10,
      maxLength: 13,
      pattern: '[0-9]{10,13}',
    },
  },

  /**
   *
   *
   */
  validate(element) {},
};

function RandomFieldset() {
  const [setupFieldset, fields] = useFieldset(schema, {
    /**
     * Name of the fieldset (For nested fieldset)
     */
    name: 'book',

    /**
     *  Id of the correponding form
     */
    form: 'random-form-id',

    /**
     * Initial value of the fieldset
     */
    initialValue: {
      isbn: '0340013818',
    },

    /**
     * To populate error reported by the server
     */
    error: {
      isbn: 'Invalid ISBN',
    },
  });

  console.log(isbn.name);
  // 'book.isbn' or
  // 'isbn' if name is not provided
  console.log(isbn.form);
  // 'random-form-id' or
  // undefined if form is not provided
  console.log(isbn.initialValue);
  // '0340013818' or
  // undefined if initalValue is not provided
  console.log(isbn.error);
  // Latest error message
  // 'Invalid ISBN' initially if error is provided
  console.log(isbn.constraint);
  //  {
  //    required: true,
  //    minLength: 10,
  //    maxLength: 13,
  //    pattern: '[0-9]{10,13}',
  //  }

  return <fieldset {...setupFieldset}>{/* ... */}</fieldset>;

  // This is equivalent to:
  //
  // return (
  //   <fieldset
  //     ref={setupFieldset.ref}
  //     name={setupFieldset.name}
  //     form={setupFieldset.form}
  //     onInput={setupFieldset.onInput}
  //     onInvalid={setupFieldset.onInvalid}
  //   >
  //     {/* ... */}
  //   </fieldset>
  // );
}
```

### useFieldList

### useControlledInput

### conform

It provides several helpers to setup a native input fields quickly:

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
        name={isbn.name}
        form={isbn.form}
        defaultValue={isbn.initialValue}
        requried={isbn.constraint?.required}
        minLength={isbn.constraint?.minLength}
        maxLength={isbn.constraint?.maxLength}
        min={isbn.constraint?.min}
        max={isbn.constraint?.max}
        multiple={isbn.constraint?.multiple}
        pattern={isbn.constraint?.pattern}
      >
      <textarea
        name={isbn.name}
        form={isbn.form}
        defaultValue={isbn.initialValue}
        requried={isbn.constraint?.required}
        minLength={isbn.constraint?.minLength}
        maxLength={isbn.constraint?.maxLength}
      />
      <select
        name={isbn.name}
        form={isbn.form}
        defaultValue={isbn.initialValue}
        requried={isbn.constraint?.required}
        multiple={isbn.constraint?.multiple}
      >
        {/* ... */}
      </select>
    </fieldset>
  );
}
```
