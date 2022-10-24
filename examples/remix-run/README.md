# Remix Integration

This page shows you how to integrate conform with Remix. All examples works without JavaScript.

<!-- aside -->

## Table of Contents

- [Setting up Conform](#setting-up-conform)
- [Configure validation](#configure-validation)
- [Reducing the feedback loop](#reducing-the-feedback-loop)
- [Fallback to the server](#fallback-to-the-server)
- [Demo](#demo)

<!-- /aside -->

## Setting up Conform

To begin, let's build a simple signup form with Remix.

```tsx
export default function SignupForm() {
  const form = useForm();
  const { email, password, confirmPassword } = useFieldset(
    form.ref,
    form.config,
  );

  return (
    <Form>
      <div>
        <label>
          <div>Email</div>
          <input type="text" name="email" />
        </label>
        <div>{email.error}</div>
      </div>
      <div>
        <label>
          <div>Password</div>
          <input type="password" name="password" />
        </label>
        <div>{password.error}</div>
      </div>
      <div>
        <label>
          <div>Confirm password</div>
          <input type="password" name="confirmPassword" />
        </label>
        <div>{confirmPassword.error}</div>
      </div>
      <button type="submit">Signup</button>
    </Form>
  );
}
```

## Demo

<!-- sandbox src="/examples/remix-run" -->

Try it out on [Codesandbox](https://codesandbox.io/s/github/edmundhung/conform/tree/main/examples/remix-run).

<!-- /sandbox -->
