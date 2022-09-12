# Basics

In this section, we will cover how to build a simple login form by utilizing native constraint and then enhancing it with conform.

<!-- aside -->

## Table of Contents

- [Installation](#installation)
- [Quick start](#quick-start)
- [Enhancing with conform](#enhancing-with-conform)
  - [Capturing errors](#capturing-errors)
  - [Styling invalid fields](#styling-invalid-fields)
  - [Early reporting](#early-reporting)
- [Demo](#demo)

<!-- /aside -->

## Installation

```sh
npm install @conform-to/react
```

## Quick start

To begin, let's make a login form with 2 basic requirements:

- The **email** field should be a valid email address
- The **password** field should not be empty

```tsx
export default function LoginForm() {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const value = Object.fromEntries(formData);

        console.log(value);
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

## Enhancing with conform

By utilising the [required](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/required) attribute, our form now stop users from submitting until they provide a valid email address with the password. We are also capturing the form value using the [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData) API. However, there are still things that can be improved:

### Capturing errors

With the help of native form validation, users will see [error bubbles](https://codesandbox.io/s/cocky-fermi-zwjort?file=/src/App.js) popping up if they try to submit a form with invalid fields. These bubbles, unfortunately, are not customizable.

What if we can capture the error messages and decide where to put them ourselves? Let's introduce **conform**:

```tsx
import { useForm, useFieldset } from '@conform-to/react';

export default function LoginForm() {
  const formProps = useForm({
    onSubmit(event) {
      event.preventDefault();

      const formData = new FormData(event.currentTarget);
      const value = Object.fromEntries(formData);

      console.log(value);
    },
  });
  const { email, password } = useFieldset(formProps.ref);

  return (
    <form {...formProps}>
      <label>
        <div>Email</div>
        <input type="email" name="email" required />
        <div>{email.error}</div>
      </label>
      <label>
        <div>Password</div>
        <input type="password" name="password" required />
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

<details>
<summary>Where are these error messages come from?</summary>
You might already notice - they are the same as the one you saw on the error bubbles: Indeed, these messages are provided by the browser vendor and might varies depending on your operating system and user language setting.
</details>

### Styling invalid fields

It might be common to update the class name based on the error state. However, conform makes it possible to style using a combination of [CSS pseudo-class](https://developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation#the_constraint_validation_api) with data attribute as well:

```css
input[data-conform-touched]:invalid {
  border-color: red;
}

input + div {
  color: red;
}
```

### Early reporting

Currently, form error will not be reported until a submission is made. We can take this one step further by passing the `initialReport` option to `onBlur`, making the errors to be reported once the user leave the field:

```tsx
import { useForm } from '@conform-to/react';

export default function LoginForm() {
  const formProps = useForm({
    initialReport: 'onBlur',
  });

  return <form {...formProps}>{/* ... */}</form>;
}
```

## Demo

> [Codesandbox](https://codesandbox.io/s/github/edmundhung/conform/tree/v0.3.0/examples/basic) / [Stackblitz](https://stackblitz.com/github/edmundhung/conform/tree/v0.3.0/examples/basic)
