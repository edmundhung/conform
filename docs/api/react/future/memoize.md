# memoize

> The `memoize` function is part of Conform's future export. These APIs are experimental and may change in minor versions. [Learn more](https://github.com/edmundhung/conform/discussions/954)

A utility function that caches the most recent result of a function call. Use it to prevent redundant API calls during async validation, like username availability checks.

```ts
import { memoize } from '@conform-to/react/future';

const memoizedFn = memoize(fn, isEqual);
```

## Parameters

### `fn: T`

The function to memoize. Can be synchronous or asynchronous.

### `isEqual?: (prevArgs: Parameters<T>, nextArgs: Parameters<T>) => boolean`

Optional custom equality function to compare arguments. Defaults to shallow comparison using `Object.is()`.

```ts
const memoizedFn = memoize(
  async (user: { id: string; name: string }) => {
    return await validateUser(user);
  },
  // Custom equality - only compare by ID
  (prevArgs, nextArgs) => prevArgs[0].id === nextArgs[0].id,
);
```

## Returns

A memoized function with the same signature as the original function, plus:

### `clearCache(): void`

Method to manually clear the memoization cache.

## Example

```ts
import { memoize } from '@conform-to/react/future';
import { useMemo } from 'react';

function Example() {
  const validateUsername = useMemo(
    () =>
      memoize(async function isUsernameUnique(username: string) {
        const response = await fetch(`/api/users/${username}`);

        if (!response.ok) {
          return ['Username is already taken'];
        }

        return null;
      }),
    [],
  );

  const { form, fields } = useForm({
    // A standard schema for basic validations
    schema,
    async onValidate({ payload, error }) {
      // Validate username uniqueness only if username is provided and has no other errors
      if (payload.username && !error.fieldErrors.username) {
        const messages = await validateUsername(payload.username);

        if (messages) {
          error.fieldErrors.username = messages;
        }
      }

      return error;
    },
  });

  // ...
}
```

## Tips

### Schema-level validation

`memoize` can also be used directly in schema libraries with async validation support, such as Zod:

```ts
const schema = z.object({
  username: z.string().refine(memoize(isUsernameUnique), {
    message: 'Username is already taken',
  }),
});
```

### Memoize at the component level

Always wrap memoized functions in `useMemo` to prevent recreating them on each render:

```ts
const validateUsername = useMemo(() => memoize(isUsernameUnique), []);
```

Avoid defining memoized functions in the global scope, as this can lead to shared state across multiple component instances.
