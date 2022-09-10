# Basic

In this section, we will cover how to build a simple login form by utilizing native constraint and then enhance the error handling by populating validation messages manually.

<!-- aside -->

## Table of Contents

- [Installation](#installation)
- [Quick start](#quick-start)
- [Enhancement](#enhancement)
- [Demo](#demo)

<!-- /aside -->

## Installation

```sh
npm install @conform-to/react
```

## Quick start

To begin, let's make a login form with a basic requirement:

- The **email** field should be a valid email address,
- The **password** field should not be left empty.

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

By utilising the [required](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/required) attribute, our form now stop users from submitting until they provide a valid email address with the password. We are also capturing the form value using the [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData) API. However, the [error bubble](https://codesandbox.io/s/cocky-fermi-zwjort?file=/src/App.js) is not ideal, especially, when we find out it is not customizable.

## Enhancement

To enhance this, let's introduce the `useForm` and `useFieldset` hook to populate these error messages next to the input fields manually.

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

You might wonder where are these error messages come from, or you might already notice - they are the same as the one you saw on the error bubbles: Indeed, these messages are provided by the browser vendor and might varies depending on your operating system and user language setting.

In the next section, we will show you how to customize the validation messages and configure custom constraints.

[> Next](../constraint)

## Demo

> [Codesandbox](https://codesandbox.io/s/github/edmundhung/conform/tree/v0.3.0/examples/basic) / [Stackblitz](https://stackblitz.com/github/edmundhung/conform/tree/v0.3.0/examples/basic)
