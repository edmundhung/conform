# Tutorial

In this tutorial, we will start with a basic contact form built with just Remix and Zod. Then, we will show you how to enhance it using Conform.

## Installation

Before start, please install conform on your project.

```sh
npm install @conform-to/react @conform-to/zod --save
```

## Initial setup

First, let's define the schema. Here is a zod schema that we will use to validate the form data:

```ts
import { z } from 'zod';

const schema = z.object({
  // The preprocess step is required for zod to perform the required check properly
  // As the value of an empty input is an usually an empty string
  email: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string({ required_error: 'Email is required' }).email('Email is invalid'),
  ),
  message: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z
      .string({ required_error: 'Message is required' })
      .min(10, 'Message is too short')
      .max(100, 'Message is too long'),
  ),
});
```

In the action handler, we will parse the form data and validate it with zod. If there is any error, we will return it to the client together with the submitted value.

```tsx
import { type ActionFunctionArgs, redirect } from '@remix-run/node';
import { z } from 'zod';
import { sendMessage } from '~/message';

const schema = z.object({
  // ...
});

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  // Construct an object using `Object.fromEntries`
  const payload = Object.fromEntries(formData);
  // Then parse it with zod
  const result = schema.safeParse(payload);

  // Return the error to the client if the data is not valid
  if (!result.success) {
    const error = result.error.flatten();

    return {
      payload,
      formErrors: error.formErrors,
      fieldErrors: error.fieldErrors,
    };
  }

  // We will skip the implementation as it is not important to the tutorial
  const message = await sendMessage(result.data);

  // Return a form error if the message is not sent
  if (!message.sent) {
    return {
      payload,
      formErrors: ['Failed to send the message. Please try again later.'],
      fieldErrors: {},
    };
  }

  return redirect('/messages');
}
```

Then, we will implement the contact form. If the submission result is returned from `useActionData()`, we will display the error message next to each field. The fields are also initialized with the submitted value to persist the form data in case the document is reloaded.

```tsx
import { type ActionFunctionArgs } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { z } from 'zod';
import { sendMessage } from '~/message';

const schema = z.object({
  // ...
});

export async function action({ request }: ActionFunctionArgs) {
  // ...
}

export default function ContactUs() {
  const result = useActionData<typeof action>();

  return (
    <Form method="POST">
      <div>{result?.formErrors}</div>
      <div>
        <label>Email</label>
        <input type="email" name="email" defaultValue={result?.payload.email} />
        <div>{result?.fieldsErrors.email}</div>
      </div>
      <div>
        <label>Message</label>
        <textarea name="message" defaultValue={result?.payload.message} />
        <div>{result?.fieldsErrors.message}</div>
      </div>
      <button>Send</button>
    </Form>
  );
}
```

We are not done yet. Accessibility should never be overlooked. Let's make the form more accessible by adding the following attributes:

- Make sure each label is associated with the input properly with an unique **id**
- Setup validation attributes similar to the zod schema
- Configure the **aria-invalid** attribute of the form elements based on the validity
- Make sure the error message is linked to a form element with the **aria-describedby** attribute

```tsx
import { type ActionFunctionArgs } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { z } from 'zod';
import { sendMessage } from '~/message';

const schema = z.object({
  // ...
});

export async function action({ request }: ActionFunctionArgs) {
  // ...
}

export default function ContactUs() {
  const result = useActionData<typeof action>();

  return (
    <Form
      method="POST"
      aria-invalid={result?.formErrors ? true : undefined}
      aria-describedby={result?.formErrors ? 'contact-error' : undefined}
    >
      <div id="contact-error">{result?.formErrors}</div>
      <div>
        <label htmlFor="contact-email">Email</label>
        <input
          id="contact-email"
          type="email"
          name="email"
          defaultValue={result?.payload.email}
          required
          aria-invalid={result?.error.email ? true : undefined}
          aria-describedby={
            result?.error.email ? 'contact-email-error' : undefined
          }
        />
        <div id="contact-email-error">{result?.error.email}</div>
      </div>
      <div>
        <label htmlFor="contact-message">Message</label>
        <textarea
          id="contact-message"
          name="message"
          defaultValue={result?.payload.message}
          required
          minLength={10}
          maxLength={100}
          aria-invalid={result?.error.message ? true : undefined}
          aria-describedby={
            result?.error.message ? 'contact-email-message' : undefined
          }
        />
        <div id="contact-email-message">{result?.error.message}</div>
      </div>
      <button>Send</button>
    </Form>
  );
}
```

This is a lot of work even for a simple contact form. It is also error-prone to maintains all the ids. How can we simplify it?

## Introduce Conform

This is where Conform comes in. To begin, we can remove the preprocess from the zod schema as Conform's zod integration will automatically strip empty string for you.

```tsx
import { z } from 'zod';

const schema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Email is invalid'),
  message: z
    .string({ required_error: 'Message is required' })
    .min(10, 'Message is too short')
    .max(100, 'Message is too long'),
});
```

Then, we can simplify the action with the `parseWithZod()` helper function. It will parse the form data and return a submission object with either the parsed value or the error.

```tsx
import { parseWithZod } from '@conform-to/zod';
import { type ActionFunctionArgs } from '@remix-run/node';
import { z } from 'zod';
import { sendMessage } from '~/message';

const schema = z.object({
  // ...
});

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  // Replace `Object.fromEntries()` with the parseWithZod helper
  const submission = parseWithZod(formData, { schema });

  // Report the submission to client if it is not successful
  if (submission.status !== 'success') {
    return submission.reply();
  }

  const message = await sendMessage(result.data);

  // Return a form error if the message is not sent
  if (!message.sent) {
    return submission.reply({
      formErrors: ['Failed to send the message. Please try again later.'],
    });
  }

  return await sendMessage(submission.value);
}
```

Now, we can manage all the form metadata with the [useForm](./api/react/useForm.md) hook. We will also derive the validation attributes from the zod schema using the `getZodConstraint()` helper.

```tsx
import { useForm } from '@conform-to/react';
import { parseWithZod, getZodConstraint } from '@conform-to/zod';
import { type ActionFunctionArgs } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { z } from 'zod';
import { sendMessage } from '~/message';
import { getUser } from '~/session';

const schema = z.object({
	// ...
});

export async function action({ request }: ActionFunctionArgs) {
	// ...
}

export default function ContactUs() {
	const lastResult = useActionData<typeof action>();
	// The useForm hook will return all the metadata we need to render the form
	// and focus on the first invalid field when the form is submitted
	const [form, fields] = useForm({
		// This not only sync the error from the server
		// But also used as the default value of the form
		// in case the document is reloaded for progressive enhancement
		lastResult,

		// To derive all validation attributes
		constraint: getZodConstraint(schema),
	});

	return (
		<Form
			method="post"
      {/* The only additional attribute you need is the `id` attribute */}
			id={form.id}
			aria-invalid={form.errors ? true : undefined}
			aria-describedby={form.errors ? form.errorId : undefined}
		>
			<div id={form.errorId}>{form.errors}</div>
			<div>
				<label htmlFor={fields.email.id}>Email</label>
				<input
					id={fields.email.id}
					type="email"
					name={fields.email.name}
					defaultValue={fields.email.initialValue}
					required={fields.email.required}
					aria-invalid={fields.email.errors ? true : undefined}
					aria-describedby={
						fields.email.errors ? fields.email.errorId : undefined
					}
				/>
				<div id={fields.email.errorId}>{fields.email.errors}</div>
			</div>
			<div>
				<label htmlFor={fields.message.id}>Message</label>
				<textarea
					id={fields.message.id}
					name={fields.message.name}
					defaultValue={fields.message.initialValue}
					required={fields.message.required}
					minLength={fields.message.minLength}
					maxLength={fields.message.maxLength}
					aria-invalid={fields.message.errors ? true : undefined}
					aria-describedby={
						fields.message.errors ? fields.message.errorId : undefined
					}
				/>
				<div id={fields.message.errorId}>{fields.message.errors}</div>
			</div>
			<button>Send</button>
		</Form>
	);
}
```

## Improve validation experience

Right now the contact form will be validated only when the user submit it. What if we want to give early feedback to the user as they type?

Let's setup the `shouldValidate` and `shouldRevalidate` options.

```tsx
import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { type ActionFunctionArgs, type LoaderFunctionArgs, json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { sendMessage } from '~/message';
import { getUser } from '~/session';

const schema = z.object({
  // ...
});

export async function loader({ request }: LoaderFunctionArgs) {
  // ...
}

export async function action({ request }: ActionFunctionArgs) {
  // ...
}

export default function ContactUs() {
  const user = useLoaderData<typeof loader>();
  const lastResult = useActionData<typeof action>();
  const [form, fields] = useForm({
    // ... previous config

    // Validate field once user leaves the field
    shouldValidate: 'onBlur',
    // Then, revalidate field as user types again
    shouldRevalidate: 'onInput',
  });

  // ...
}
```

At this point, our contact form is only validated on the server and takes a round trip to the server to validate the form each time the user types. Let's shorten the feedback loop with client validation.

```tsx
import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { sendMessage } from '~/message';
import { getUser } from '~/session';

const schema = z.object({
	// ...
});

export async function action({ request }: ActionFunctionArgs) {
	// ...
}

export default function ContactUs() {
	const user = useLoaderData<typeof loader>();
	const lastResult = useActionData<typeof action>();
	const [form, fields] = useForm({
		// ... previous config

		// Run the same validation logic on client
		onValidate({ formData }) {
			return parseWithZod(formData, { schema });
		},
	});

	return (
    <form
      method="post"
			id={form.id}
      {/* The `onSubmit` handler is required for client validation */}
      onSubmit={form.onSubmit}
			aria-invalid={form.errors ? true : undefined}
			aria-describedby={form.errors ? form.errorId : undefined}
    >
      {/* ... */}
    </form>
  );
}
```

## Removing boilerplate

It's great that Conform can manage all the ids and validation attributes for us. However, it is still a lot of work to setup the form and fields. If you are dealing with native inputs, you can use helpers like [getFormProps](./api/react/getFormProps.md) and [getInputProps](./api/react/getInputProps.md) to minimize the boilerplate.

```tsx
import {
  useForm,
  getFormProps,
  getInputProps,
  getTextareaProps,
} from '@conform-to/react';
import { parseWithZod, getZodConstraint } from '@conform-to/zod';
import { type ActionFunctionArgs } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { sendMessage } from '~/message';

const schema = z.object({
  // ...
});

export async function action({ request }: ActionFunctionArgs) {
  // ...
}

export default function ContactUs() {
  const lastResult = useActionData<typeof action>();
  const [form, fields] = useForm({
    // ...
  });

  return (
    <Form method="post" {...getFormProps(form)}>
      <div>
        <label htmlFor={fields.email.id}>Email</label>
        <input {...getInputProps(fields.email, { type: 'email' })} />
        <div id={fields.email.errorId}>{fields.email.errors}</div>
      </div>
      <div>
        <label htmlFor={fields.message.id}>Message</label>
        <textarea {...getTextareaProps(fields.message)} />
        <div id={fields.message.errorId}>{fields.message.errors}</div>
      </div>
      <button>Send</button>
    </Form>
  );
}
```

That's it! Here is the complete example that we have built in this tutorial:

```tsx
import {
  useForm,
  getFormProps,
  getInputProps,
  getTextareaProps,
} from '@conform-to/react';
import { parseWithZod, getZodConstraint } from '@conform-to/zod';
import { type ActionFunctionArgs } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { z } from 'zod';
import { sendMessage } from '~/message';

const schema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Email is invalid'),
  message: z
    .string({ required_error: 'Message is required' })
    .min(10, 'Message is too short')
    .max(100, 'Message is too long'),
});

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema });

  if (submission.status !== 'success') {
    return submission.reply();
  }

  const message = await sendMessage(submission.value);

  if (!message.sent) {
    return submission.reply({
      formErrors: ['Failed to send the message. Please try again later.'],
    });
  }

  return await sendMessage(submission.value);
}

export default function ContactUs() {
  const lastResult = useActionData<typeof action>();
  const [form, fields] = useForm({
    lastResult,
    constraint: getZodConstraint(schema),
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
  });

  return (
    <Form method="post" {...getFormProps(form)}>
      <div>
        <label htmlFor={fields.email.id}>Email</label>
        <input {...getInputProps(fields.email, { type: 'email' })} />
        <div id={fields.email.errorId}>{fields.email.errors}</div>
      </div>
      <div>
        <label htmlFor={fields.message.id}>Message</label>
        <textarea {...getTextareaProps(fields.message)} />
        <div id={fields.message.errorId}>{fields.message.errors}</div>
      </div>
      <button>Send</button>
    </Form>
  );
}
```
