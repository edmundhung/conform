# Remix

Here is a login form example integrating with [Remix](https://remix.run/). You can find the full example [here](../../examples/remix).

```tsx
import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import type { ActionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string(),
  remember: z.boolean().optional(),
});

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema });

  if (submission.status !== 'success') {
    return json(submission.reply());
  }

  // ...
}

export default function Login() {
  // Last submission returned by the server
  const lastResult = useActionData<typeof action>();
  const [form, fields] = useForm({
    // Sync the result of last submission
    lastResult,

    // Reuse the validation logic on the client
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },

    // Validate the form on blur event triggered
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
  });

  return (
    <Form method="post" id={form.id} onSubmit={form.onSubmit} noValidate>
      <div>
        <label>Email</label>
        <input
          type="email"
          key={fields.email.key}
          name={fields.email.name}
          defaultValue={fields.email.initialValue}
        />
        <div>{fields.email.errors}</div>
      </div>
      <div>
        <label>Password</label>
        <input
          type="password"
          key={fields.password.key}
          name={fields.password.name}
          defaultValue={fields.password.initialValue}
        />
        <div>{fields.password.errors}</div>
      </div>
      <label>
        <div>
          <span>Remember me</span>
          <input
            type="checkbox"
            key={fields.remember.key}
            name={fields.remember.name}
            defaultChecked={fields.remember.initialValue === 'on'}
          />
        </div>
      </label>
      <hr />
      <button>Login</button>
    </Form>
  );
}
```

## Tips

### The default value might be out of sync if you reset the form from the action

If the default value of the form comes from the loader and you are trying to reset the form on the action, there is a chance you will see the form reset to the previous default value. As Conform will reset the form the moment action data is updated while Remix is still revalidating the loader data. To fix this, you can wait for the state to be `idle` (e.g. `navigation.state` or `fetcher.state`) before passing the `lastResult` to Conform like this:

```tsx
export default function Example() {
  const { defaultValue } = useLoaderData<typeof loader>();
  const lastResult = useActionData<typeof action>();
  const navigation = useNavigation();
  const [form, fields] = useForm({
    // If the default value comes from loader
    defaultValue,

    // Sync the result of last submission only when the state is idle
    lastResult: navigation.state === 'idle' ? lastResult : null,

    // or, if you are using a fetcher:
    // lastResult: fetcher.state === 'idle' ? lastResult : null,

    // ...
  });

  // ...
}
```
