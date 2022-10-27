# Conform &middot; [![latest release](https://img.shields.io/github/v/release/edmundhung/conform?include_prereleases)](https://github.com/edmundhung/conform/releases) [![GitHub license](https://img.shields.io/github/license/edmundhung/conform)](https://github.com/edmundhung/conform/blob/main/LICENSE)

Conform is a form validation library built on top of the [Constraint Validation](https://caniuse.com/constraint-validation) API.

- **Progressive Enhancement**: Its APIs are designed with progressive enhancement in mind to ensure a smooth and resillent experience before JavaScript is ready.
- **Server-first validation**: It validates your form by making a submission. Your submit handler is now a middleware between you server and the client.
- **Lightweight**: It is only [4kB](https://bundlephobia.com/package/@conform-to/react) compressed thanks to all the native [Web APIs](https://developer.mozilla.org/en-US/docs/Web/API). _#useThePlatform_

## Quick start

<!-- sandbox src="/examples/basic" -->

```tsx
import { useForm, useFieldset } from '@conform-to/react';

export default function LoginForm() {
  const form = useForm({
    onSubmit(event) {
      event.preventDefault();

      const formData = new FormData(event.currentTarget);
      const value = Object.fromEntries(formData);

      console.log(value);
    },
  });
  const { email, password } = useFieldset(form.ref);

  return (
    <form {...form.props}>
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
      <button type="submit">Login</button>
    </form>
  );
}
```

Learn more about conform [here](https://conform.guide/basics).

<!-- /sandbox -->
