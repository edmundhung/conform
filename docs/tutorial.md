# Tutorial

In this tutorial, we will show you how to enhance a contact form with Conform.

<!-- aside -->

## On this page

- [Installation](#installation)
- [Initial setup](#initial-setup)
- [Introducing Conform](#introducing-conform)
- [Setting client validation](#setting-client-validation)
- [Making it accessible](#making-it-accessible)

<!-- /aside -->

## Installation

Before start, please install conform on your project:

```sh
npm install @conform-to/react @conform-to/zod --save
```

## Initial setup

Let's build a simple contact form with Remix.

```tsx
import { type ActionArgs, json } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { z } from 'zod';
import { sendMessage } from '~/message';

const schema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Email is invalid'),
  message: z.string({ required_error: 'Message is required' }),
});

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();

  // Parse the form data
  const payload = Object.fromEntries(formData);
  const result = schema.safeParse(payload);

  if (!result.success) {
    return json({
      payload,
      error: result.error.flatten().fieldErrors,
    });
  }

  return await sendMessage(result.data);
}

export default function ContactUs() {
  const result = useActionData<typeof action>();

  return (
    <Form method="post">
      <div>
        <label>Email</label>
        <input type="email" name="email" defaultValue={result?.payload.email} />
        <div>{result?.error.email}</div>
      </div>
      <div>
        <label>Message</label>
        <textarea name="message" defaultValue={result?.payload.message} />
        <div>{result?.error.message}</div>
      </div>
      <button>Send</button>
    </Form>
  );
}
```

## Introducing Conform

Now, it's time to enhance it using Conform.

```tsx
import { useForm } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import { type ActionArgs, json } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { z } from 'zod';
import { sendMessage } from '~/message';

const schema = z.object({
  // ...
});

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();

  // Replace `Object.fromEntries()` with the parse function
  const submission = parse(formData, { schema });

  // Report the submission to client
  // 1) if the intent is not `submit`, or
  // 2) if there is any error
  if (submission.intent !== 'submit' || !submission.value) {
    return json(submission);
  }

  return await sendMessage(submission.value);
}

export default function ContactUs() {
  const lastSubmission = useActionData<typeof action>();

  // The `useForm` hook will return everything you need to setup a form
  // including the error and config of each field
  const [form, fields] = useForm({
    // The last submission will be used to report the error and
    // served as the default value and initial error of the form
    // for progressive enhancement
    lastSubmission,

    // Validate the field once a `blur` event is triggered
    shouldValidate: 'onBlur',
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
        <textarea name="message" defaultValue={fields.message.defaultValue} />
        <div>{fields.message.errors}</div>
      </div>
      <button>Send</button>
    </Form>
  );
}
```

Conform will trigger a [server validation](./validation.md#server-validation) to validate each field whenever user leave the input (i.e. `onBlur`). It also focuses on the first invalid field on submit.

## Setting client validation

Server validation might some time be too slow for a good user experience. We can also reuse the validation logic on the client for a instant feedback.

```tsx
import { parse, useForm } from '@conform-to/react';
import { type ActionArgs, json } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { sendMessage } from '~/message';

const schema = z.object({
  // ...
});

export async function action({ request }: ActionArgs) {
  // ...
}

export default function ContactUs() {
  const lastSubmission = useActionData<typeof action>();
  const [form, fields] = useForm({
    lastSubmission,
    shouldValidate: 'onBlur',

    // Run the same validation logic on client
    onValidate({ formData }) {
      return parse(formData, { schema });
    },
  });

  // ...
}
```

## Making it accessible

There is more we need do to make a form accessible. For example:

- Set an `id` for each field and use it as the `for` attribute of the label
- Set an `aria-invalid` attribute of the field to `true` when there is an error
- Set an `id` for the error message and use it as the `aria-describedby` attribute of the field when there is an error

```tsx
import { parse, useForm } from '@conform-to/react';
import { type ActionArgs, json } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { sendMessage } from '~/message';

const schema = z.object({
  // ...
});

export async function action({ request }: ActionArgs) {
  // ...
}

export default function LoginForm() {
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
          aria-invalid={fields.email.errors.length > 0 || undefined}
          aria-describedby={
            fields.email.errors.length > 0 ? 'email-error' : undefined
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
          aria-invalid={fields.message.errors.length > 0 || undefined}
          aria-describedby={
            fields.message.errors.length > 0 ? 'message-error' : undefined
          }
        />
        <div id="message-error">{fields.message.error}</div>
      </div>
      <button>Send</button>
    </Form>
  );
}
```

How about letting Conform manage all these ids for us?

```tsx
import { conform, useForm } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import { type ActionArgs, json } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { useId } from 'react';
import { sendMessage } from '~/message';

const schema = z.object({
  // ...
});

export async function action({ request }: ActionArgs) {
  // ...
}

export default function LoginForm() {
  const lastSubmission = useActionData<typeof action>();

  // Generate a unique id for the form, or you can pass in your own
  // Note: useId() is only available in React 18
  const id = useId();
  const [form, fields] = useForm({
    // Let Conform manage all ids for us
    id,

    lastSubmission,
    shouldValidate: 'onBlur',
    onValidate({ formData }) {
      return parse(formData, { schema });
    },
  });

  return (
    <Form method="post" {...form.props}>
      <div>
        <label htmlFor={fields.email.id}>Email</label>
        {/* This derives attributes required by the input, such as type, name and default value */}
        <input {...conform.input(fields.email, { type: 'email' })} />
        <div id={fields.email.errorId}>{fields.email.errors}</div>
      </div>
      <div>
        <label htmlFor={fields.message.id}>Message</label>
        {/* It also manages id, aria attributes, autoFocus and validation attributes for us! */}
        <textarea {...conform.textarea(fields.message)} />
        <div id={fields.message.errorId}>{fields.message.errors}</div>
      </div>
      <button>Send</button>
    </Form>
  );
}
```
