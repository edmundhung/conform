# Basic

<!-- aside -->

## Table of Contents

- [Installation](#installation)
- [Quick start](#quick-start)
- [Enhancing your form](#enhancing-your-form)
- [Customizing the messages](#enhancing-your-form)

<!-- /aside -->

## Installation

```sh
npm install @conform-to/react
```

## Quick start

To begin, let's make a login form with a basic requirement: The **email** field should be a valid email address and the **password** field should not be left empty.

```tsx
export default function LoginForm() {
  function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const value = Object.fromEntries(formData);

    console.log(value);
  }

  return (
    <form onSubmit={handleSubmit}>
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

By utilising the [required](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/required) attribute, our form now stop users from submitting until they provide a valid email address with the password. We are also capturing the form value using the [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData) API. However, the [error bubble](https://codesandbox.io/s/cocky-fermi-zwjort?file=/src/App.js) doesn't look good. It is also not customizable.

## Populating the errors

To enhance this, let's introduce the `useForm` and `useFieldset` hook to populate these error messages next to the input fields manually.

```diff
+import { useForm, useFieldset } from '@conform-to/react';

export default function LoginForm() {
  const onSubmit = event => {
      event.preventDefault();

      const formData = new FormData(event.currentTarget);
      const value = Object.fromEntries(formData);

      console.log(value);
  };
+ const formProps = useForm({
+   onSubmit,
+ });
+ const { email, password } = useFieldset(formProps.ref);

  return (
+   <form {...formProps}>
-   <form onSubmit={onSubmit}>
      <label>
        <div>Email</div>
        <input type="email" name="email" required />
+       <div>{email.error}</div>
      </label>
      <label>
        <div>Password</div>
        <input type="password" name="password" required />
+       <div>{password.error}</div>
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

You might wonder where are these error messages come from, or you might already notice - they are the same as the one you saw on the error bubbles:

These messages are provided by the browser vendor and might varies depending on your operating system and user language setting.

In the next section, we will show you how to customize the validation messages and setup custom constraints.

[Next section](../constraint)

## Demo

> [Codesandbox](https://codesandbox.io/s/github/edmundhung/conform/tree/v0.3.0/examples/basic) / [Stackblitz](https://stackblitz.com/github/edmundhung/conform/tree/v0.3.0/examples/basic)
