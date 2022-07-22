# Conform &middot; [![latest release](https://img.shields.io/github/v/release/edmundhung/conform?include_prereleases)](https://github.com/edmundhung/conform/releases) [![GitHub license](https://img.shields.io/github/license/edmundhung/conform)](https://github.com/edmundhung/conform/blob/main/LICENSE)

> The API is not yet stable. Expect breaking changes on minor versions before v1 (stable release).

Conform is a form validation library built on top of the [Constraint Validation](https://caniuse.com/constraint-validation) API.

- Progressive enhancement: It is designed based on the [specification](https://dev.w3.org/html5/spec-LC/association-of-controls-and-forms.html#constraint-validation). From reporting validity of the form to setting custom error message of each fields. If you don't like part of the solution, you can always replace it with your own one.
- Schema-first: Define the data structure and map it to smaller individual fieldset, then compose them to make complex form. Conform aims at making easy form easy, complex form simple.
- Framework agnostic: The DOM is the only thing it depends on. It might utilize specific features for better integration, but the core will always be based on web standard.

## Example (React + Zod)

```tsx
import { useFieldset, conform } from '@conform-to/react';
import { resolve, parse } from '@conform-to/zod';
import z from 'zod';

const signup = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    confirm: z.string(),
  })
  .refine((value) => value.password === value.confirm, {
    message: 'The password do not match',
    path: ['confirm'],
  });

export default function SignupForm() {
  const [fieldsetProps, { email, password, confirm }] = useFieldset(
    resolve(signup),
  );

  return (
    <form
      onSubmit={event => {
        event.preventDefault();

        const formData = new FormData(e.currentTarget);
        const result = parse(formData, signup);

        // Send the data with fetch API
      }
    >
      <fieldset {...fieldsetProps}>
        <label>
          Email:
          <input {...conform.input(email)} />
          <p>{email.error}</p>
        </label>
        <label>
          Password:
          <input {...conform.input(password, { type: 'password' })} />
          <p>{password.error}</p>
        </label>
        <label>
          Confirm Password:
          <input {...conform.input(confirm, { type: 'password' })} />
          <p>{confirm.error}</p>
        </label>
        <button type="submit">Sign up</button>
      </fieldset>
    </form>
  );
}
```

More examples can be found here: [Codesandbox](https://codesandbox.io/s/github/edmundhung/conform/tree/v0.2.0/examples/remix?file=/app/routes/search.tsx) | [Stackblitz](https://stackblitz.com/github/edmundhung/conform/tree/v0.2.0/examples/remix?file=app%2Froutes%2Fsearch.tsx)

## API References

| Package                                     | Description                                                  | Size                                                                                                                                |
| :------------------------------------------ | :----------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| @conform-to/dom                             | A set of opinionated helpers interacting with the DOM        | [![package size](https://img.shields.io/bundlephobia/minzip/@conform-to/dom)](https://bundlephobia.com/package/@conform-to/dom)     |
| [@conform-to/react](packages/conform-react) | View adapter for [react](https://github.com/facebook/react)  | [![package size](https://img.shields.io/bundlephobia/minzip/@conform-to/react)](https://bundlephobia.com/package/@conform-to/react) |
| [@conform-to/zod](packages/conform-zod)     | Schema resolver for [zod](https://github.com/colinhacks/zod) | [![package size](https://img.shields.io/bundlephobia/minzip/@conform-to/zod)](https://bundlephobia.com/package/@conform-to/zod)     |
