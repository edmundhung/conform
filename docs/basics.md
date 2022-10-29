# Basics

In this section, we will show you how to build a login form by utilizing the **Constraint Validation** API with **Conform**.

<!-- aside -->

## Table of Contents

- [Installation](#installation)
- [Quick start](#quick-start)
- [Constraint Validation](#constraint-validation)
- [Capturing errors](#capturing-errors)
- [Customize messages](#customize-messages)
- [Early reporting](#early-reporting)
- [Demo](#demo)

<!-- /aside -->

## Installation

```sh
npm install @conform-to/react
```

## Quick start

To begin, let's make a login form with 2 basic requirements:

- The **email** field should contain a valid email address
- The **password** field should not be empty

```tsx
export default function LoginForm() {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        console.log(Object.fromEntries(formData));
      }}
    >
      <label>
        <div>Email</div>
        <input type="email" name="email" required />
      </label>
      <label>
        <div>Password</div>
        <input type="password" name="password" required />
      </label>
      <label>
        <div>
          <span>Remember me</span>
          <input type="checkbox" name="remember-me" value="yes" />
        </div>
      </label>
      <button type="submit">Login</button>
    </form>
  );
}
```

Both the **email** input type and the [required](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/required) attribute are parts of the [Constraint Validation](#constraint-validation) API. It tells the browser to stop users from submitting the form until they provide a valid email address with the password.

### Constraint Validation

The [Constraint Validation](https://caniuse.com/constraint-validation) API is introduced with HTML5 to enable native client side form validation. This includes:

- Utilizing [HTML attributes](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Constraint_validation#validation-related_attributes) for validations (e.g. `required`, `type`)
- Accessing form validity and configuring custom constraint through the [DOM APIs](https://developer.mozilla.org/en-US/docs/Web/API/Constraint_validation#extensions_to_other_interfaces) (e.g `validityState`, `setCustomValidity()`)
- Styling form elements with [CSS pseudo-class](https://developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation#the_constraint_validation_api) based on the validity (e.g. `:required`, `:invalid`)

Conform utilizes these APIs internally. For example, form errors are reported by listening to the [invalid event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/invalid_event) and the error messages are captured from the element [validationMessage](https://developer.mozilla.org/en-US/docs/Web/API/HTMLObjectElement/validationMessage) property.

### Capturing errors

With the help of Constraint Validation, users will see [error bubbles](https://codesandbox.io/s/cocky-fermi-zwjort?file=/src/App.js) popping up when they try to submit a form with invalid fields. These bubbles are not customizable unfortunately. What if we can capture the error messages and decide where to put them ourselves?

Let's introduce the [useForm](/packages/conform-react/README.md#useform) and [useFieldset](/packages/conform-react/README.md#usefieldset) hooks.

```tsx
import { useForm, useFieldset } from '@conform-to/react';

export default function LoginForm() {
  /**
   * The useForm hook let you take control of the browser
   * validation flow and customize it. The submit event
   * handler will be called only when the form is valid.
   */
  const form = useForm({
    onSubmit(event, { formData }) {
      event.preventDefault();

      console.log(Object.fromEntries(formData));
    },
  });

  /**
   * The useFieldset hook helps you configure each field and
   * subscribe to its state. The properties accessed should
   * match the name of the inputs.
   */
  const { email, password } = useFieldset(form.ref, form.config);

  return (
    <form {...form.props}>
      <label>
        <div>Email</div>
        <input type="email" name="email" required autoComplete="off" />
        {/* The email error captured */}
        <div>{email.error}</div>
      </label>
      <label>
        <div>Password</div>
        <input type="password" name="password" required />
        {/* The password error captured */}
        <div>{password.error}</div>
      </label>
      <label>
        <div>
          <span>Remember me</span>
          <input type="checkbox" name="remember-me" value="yes" />
        </div>
      </label>
      <button type="submit">Login</button>
    </form>
  );
}
```

### Customize messages

Although we haven't define any error messages yet, the form above should be able to populate some message depends on the conditions. These messages are provided by the browser vendor and might vary depending on your users operating system and language setting. Let's customize messages based on the elements' [ValidityState](https://developer.mozilla.org/en-US/docs/Web/API/ValidityState).

```tsx
import { useForm, useFieldset, parse, getFormError } from '@conform-to/react';

export default function LoginForm() {
  const form = useForm({
    onValidate({ form, formData }) {
      /**
       * We will cover the details of submission in the next section
       */
      const submission = parse(formData);

      /**
       * The `getFormError` helper will loop through the form elements and call
       * the provided validate function on each field. The result will then be
       * formatted to the conform error structure (i.e. Array<[string, string]>).
       */
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
            if (element.validity.valueMissing) {
              messages.push('Password is required');
            }
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

### Early reporting

Currently, form error is reported only when a submission is made. If you want it to be shown earlier, you can set the `initialReport` option to `onBlur` and then error will be reported once the user leave the field.

```tsx
import { useForm } from '@conform-to/react';

export default function LoginForm() {
  const form = useForm({
    /**
     * Define when the error should be reported initially.
     * Support "onSubmit", "onChange", "onBlur".
     *
     * Default to `onSubmit`.
     */
    initialReport: 'onBlur',
    onSubmit(event, { formData }) {
      // ...
    },
  });

  // ...
}
```

## Demo

<!-- sandbox title="Login form demo" src="/examples/basic" -->

Try it out on [Codesandbox](https://codesandbox.io/s/github/edmundhung/conform/tree/main/examples/basic).

<!-- /sandbox -->
