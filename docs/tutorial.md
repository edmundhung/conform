# Tutorial

In this tutoiral, we will start with a simple contact form built with just Remix and Zod. Then, we will show you how to enhance it using Conform.

## Installation

Before start, please install conform on your project.

```sh
npm install @conform-to/react @conform-to/zod --save
```

## Initial setup

First, let's build a contact form with Remix and Zod. Here is a schema that we will use to validate the form data:

```ts
import { z } from 'zod';

const schema = z.object({
  // The preprocess is necessary for zod to perform the required check correctly
  // As the value of an empty input is an empty string
  email: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z
      .string({ required_error: 'Email is required' })
      .email('Email is invalid'),
  ),
  message: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string({ required_error: 'Message is required' }),
  ),
});
```

In the action, we will parse the form data and validate it with zod. If there is any error, we will return it to the client together with the submitted value.

```tsx
import { type ActionArgs, json } from '@remix-run/node';
import { z } from 'zod';
import { sendMessage } from '~/message';

const schema = z.object({
  // ...
});

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();

  // Parse the form data with zod
  const payload = Object.fromEntries(formData);
  const result = schema.safeParse(payload);

  if (!result.success) {
    return json({
      payload,
      error: result.error.flatten().fieldErrors,
    });
  }

  // Sends a message if the form is valid
  // We will skip the implementation as it is not relevant to the tutorial
  return await sendMessage(result.data);
}
```

Lastly, we will render the contact form. If the last submission is returned from `useActionData()`, we will display the error message next to each field. The fields are also initialized with the submitted value to persist the form data in case the document is reloaded.

```tsx
import { type ActionArgs, json } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { z } from 'zod';
import { sendMessage } from '~/message';

const schema = z.object({
  // ...
});

export async function action({ request }: ActionArgs) {
  // ...
}

export default function ContactUs() {
  const result = useActionData<typeof action>();

  return (
    <Form method="post">
      <div>
        <label>Email</label>
        <input
          type="email"
          name="email"
          defaultValue={result?.payload.email}
        />
        <div>{result?.error.email}</div>
      </div>
      <div>
        <label>Message</label>
        <textarea
          name="message"
          defaultValue={result?.payload.message}
        />
        <div>{result?.error.message}</div>
      </div>
      <button>Send</button>
    </Form>
  );
}
```

## Introduce Conform

Now, let's enhance it using Conform. To begin, we can remove the preprocess from the zod schema as Conform's zod integration will strip empty value for you.

```tsx
import { z } from 'zod';

const schema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Email is invalid'),
  message: z.string({ required_error: 'Message is required' }),
});
```

Then, we can simplify the action with the `parse()` helper function. It will parse the form data and return a submission object which has both the submitted value and error message returned by the schema.

```tsx
import { parse } from '@conform-to/zod';
import { type ActionArgs, json } from '@remix-run/node';
import { z } from 'zod';
import { sendMessage } from '~/message';

const schema = z.object({
  // ...
});

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();

  // Replace `Object.fromEntries()` with the parse helper
  const submission = parse(formData, { schema });

  // Report the submission to client
  // 1) if the intent is not `submit`, or
  // 2) if there is any error (i.e. Failed to parse the value)
  if (submission.intent !== 'submit' || !submission.value) {
    return json(submission);
  }

  return await sendMessage(submission.value);
}
```

Configuring a form could be messy and tedious. How about centralizing all config in a `useForm()` hook and let Conform manages them for you?

```tsx
import { useForm } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import { type ActionArgs, json } from '@remix-run/node';
import {
  Form,
  useActionData,
  useLoaderData,
} from '@remix-run/react';
import { z } from 'zod';
import { sendMessage } from '~/message';
import { getUser } from '~/session';

const schema = z.object({
  // ...
});

export async function loader({ request }: LoaderArgs) {
  // Fetch user profile from the session
  return json(await getUser(request));
}

export async function action({ request }: ActionArgs) {
  // ...
}

export default function ContactUs() {
  const user = useLoaderData<typeof loader>();
  const lastSubmission = useActionData<typeof action>();
  const [form, fields] = useForm({
    // To sync server error from the server
    // It will also be used as the default value of the form
    // if document is reloaded for progressive enhancement
    lastSubmission,

    // Setup default value for each field
    defaultValue: {
      email: user.email,
    },
  });

  return (
    <Form method="post" {...form.props}>
      <div>
        <label>Email</label>
        <input
          type="email"
          name="email"
          defaultValue={fields.email.defaultValue}
        />
        <div>{fields.email.errors}</div>
      </div>
      <div>
        <label>Message</label>
        <textarea
          name="message"
          defaultValue={fields.message.defaultValue}
        />
        <div>{fields.message.errors}</div>
      </div>
      <button>Send</button>
    </Form>
  );
}
```

## Improve validation experience

Right now the contact form will be validated on the server when the user submit it. What if we want to have each field being validated whenever user leaves the field?

```tsx
import { useForm } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import {
  type ActionArgs,
  type LoaderArgs,
  json,
} from '@remix-run/node';
import {
  Form,
  useActionData,
  useLoaderData,
} from '@remix-run/react';
import { sendMessage } from '~/message';
import { getUser } from '~/session';

const schema = z.object({
  // ...
});

export async function loader({ request }: LoaderArgs) {
  // ...
}

export async function action({ request }: ActionArgs) {
  // ...
}

export default function ContactUs() {
  const user = useLoaderData<typeof loader>();
  const lastSubmission = useActionData<typeof action>();
  const [form, fields] = useForm({
    // ... previous config

    // Validate field once a `blur` event is triggered
    shouldValidate: 'onBlur',
  });

  // ...
}
```

Server validation might some time be too slow for a good user experience. With Conform, we can reuse the zod schema on the client for a instant feedback.

```tsx
import { useForm } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import {
  type ActionArgs,
  type LoaderArgs,
  json,
} from '@remix-run/node';
import {
  Form,
  useActionData,
  useLoaderData,
} from '@remix-run/react';
import { sendMessage } from '~/message';
import { getUser } from '~/session';

const schema = z.object({
  // ...
});

export async function loader({ request }: LoaderArgs) {
  // ...
}

export async function action({ request }: ActionArgs) {
  // ...
}

export default function ContactUs() {
  const user = useLoaderData<typeof loader>();
  const lastSubmission = useActionData<typeof action>();
  const [form, fields] = useForm({
    // ... previous config

    // Run the same validation logic on client
    onValidate({ formData }) {
      return parse(formData, { schema });
    },
  });

  // ...
}
```

## Make it accessible

There is more we need do to make a form accessible. For example:

- Set an `id` for each field and use it as the `for` attribute of the label
- Set an `aria-invalid` attribute of the field to `true` when there is an error
- Set an `id` for the error message and use it as the `aria-describedby` attribute of the field when there is an error

```tsx
import { useForm } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import {
  type ActionArgs,
  type LoaderArgs,
  json,
} from '@remix-run/node';
import {
  Form,
  useActionData,
  useLoaderData,
} from '@remix-run/react';
import { sendMessage } from '~/message';
import { getProfile } from '~/session';

const schema = z.object({
  // ...
});

export async function loader({ request }: LoaderArgs) {
  // ...
}

export async function action({ request }: ActionArgs) {
  // ...
}

export default function LoginForm() {
  const user = useLoaderData<typeof loader>();
  const lastSubmission = useActionData<typeof action>();
  const [form, fields] = useForm({
    // ...
  });

  return (
    <Form method="post" {...form.props}>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          name="email"
          defaultValue={fields.email.defaultValue}
          aria-invalid={
            fields.email.errors.length > 0 || undefined
          }
          aria-describedby={
            fields.email.errors.length > 0
              ? 'email-error'
              : undefined
          }
        />
        <div id="email-error">{fields.email.errors}</div>
      </div>
      <div>
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          name="message"
          defaultValue={fields.message.defaultValue}
          aria-invalid={
            fields.message.errors.length > 0 || undefined
          }
          aria-describedby={
            fields.message.errors.length > 0
              ? 'message-error'
              : undefined
          }
        />
        <div id="message-error">{fields.message.error}</div>
      </div>
      <button>Send</button>
    </Form>
  );
}
```

What if Conform can manage all these ids for us?

```tsx
import { conform, useForm } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import {
  type ActionArgs,
  type LoaderArgs,
  json,
} from '@remix-run/node';
import {
  Form,
  useActionData,
  useLoaderData,
} from '@remix-run/react';
import { useId } from 'react';
import { sendMessage } from '~/message';
import { getProfile } from '~/session';

const schema = z.object({
  // ...
});

export async function action({ request }: ActionArgs) {
  // ...
}

export default function LoginForm() {
  const user = useLoaderData<typeof loader>();
  const lastSubmission = useActionData<typeof action>();

  // Generate a unique id for the form, or you can pass in your own
  // Note: useId() is only available in React 18
  const id = useId();
  const [form, fields] = useForm({
    // Let Conform manage all ids for us
    id,

    // ... previous config
  });

  return (
    <Form method="post" {...form.props}>
      <div>
        <label htmlFor={fields.email.id}>Email</label>
        {/* This derives attributes required by the input, such as type, name and default value */}
        <input
          {...conform.input(fields.email, { type: 'email' })}
        />
        <div id={fields.email.errorId}>
          {fields.email.errors}
        </div>
      </div>
      <div>
        <label htmlFor={fields.message.id}>Message</label>
        {/* It also manages id, aria attributes, autoFocus and validation attributes for us! */}
        <textarea {...conform.textarea(fields.message)} />
        <div id={fields.message.errorId}>
          {fields.message.errors}
        </div>
      </div>
      <button>Send</button>
    </Form>
  );
}
```

That's it! Here is the complete example that we have built in this tutorial:

```tsx
import { conform, useForm } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import {
  type ActionArgs,
  type LoaderArgs,
  json,
} from '@remix-run/node';
import {
  Form,
  useActionData,
  useLoaderData,
} from '@remix-run/react';
import { useId } from 'react';
import { sendMessage } from '~/message';
import { getProfile } from '~/session';

const schema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Email is invalid'),
  message: z.string({ required_error: 'Message is required' }),
});

export async function loader({ request }: LoaderArgs) {
  return json(await getUser(request));
}

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const submission = parse(formData, { schema });

  if (submission.intent !== 'submit' || !submission.value) {
    return json(submission);
  }

  return await sendMessage(submission.value);
}

export default function LoginForm() {
  const user = useLoaderData<typeof loader>();
  const lastSubmission = useActionData<typeof action>();
  const id = useId();
  const [form, fields] = useForm({
    id,
    lastSubmission,
    defaultValue: {
      email: user.email,
    },
    onValidate({ formData }) {
      return parse(formData, { schema });
    },
  });

  return (
    <Form method="post" {...form.props}>
      <div>
        <label htmlFor={fields.email.id}>Email</label>
        <input
          {...conform.input(fields.email, { type: 'email' })}
        />
        <div id={fields.email.errorId}>
          {fields.email.errors}
        </div>
      </div>
      <div>
        <label htmlFor={fields.message.id}>Message</label>
        <textarea {...conform.textarea(fields.message)} />
        <div id={fields.message.errorId}>
          {fields.message.errors}
        </div>
      </div>
      <button>Send</button>
    </Form>
  );
}
```
