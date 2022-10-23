# Validation

**Conform** adopts a `server-first` paradigma. It tries to submit your form for validation and uses client-side validation to improve the user experience by blocking it when deemed unnecessary.

<!-- aside -->

## Table of Contents

- [Server Validation](#server-validation)
  - [Schema Integration](#schema-integration)
  - [Validating on-demand](#validating-on-demand)
- [Client Validation](#client-validation)
  - [Constraint Validation](#constraint-validation)
  - [Reusing schema](#resuing-schema)
- [Demo](#demo)

<!-- /aside -->

## Server Validation

Your APIs should always validate the form data provided regardless if client validation is done well. There are also things that can only be validated server side, e.g. checking the uniqness of a username on the database. It could be considered the source of truth of your validation logic.

For example, you can validate a login form in Remix as follow:

```tsx
import { parse } from '@conform-to/react';

interface LoginForm {
  email: string;
  password: string;
}

export async function action({ request }) {
  const formData = await request.formData();
  const submission = parse<LoginForm>(formData);

  if (!submission.value.email) {
    submission.error.push(['email', 'Email is required']);
  } else if (!submission.value.email.includes('@')) {
    submission.error.push(['email', 'Email is invalid']);
  }

  if (!submission.value.password) {
    submission.error.push(['password', 'Password is required']);
  }

  /**
   * Try logging the user in only when the submission is intentional
   * with no error found
   */
  if (submission.type !== 'validate' && submission.error.length === 0) {
    try {
      return await login(submission.value);
    } catch (error) {
      /**
       * By specifying the key as '', the message will be
       * treated as a form-level error and populated
       * on the client side as `form.error`
       */
      submission.error.push(['', 'Login failed']);
    }
  }

  return submission;
}
```

### Schema Integration

Integrating with a schema validation library is simple. For example, you can integrate it with `zod` like this:

```tsx
import { parse } from '@conform-to/react';
import { getError } from '@conform-to/zod';
import { z } from 'zod';

export async function action({ request }) {
  const formData = await request.formData();
  const submission = parse(formData);
  const result = z
    .object({
      email: z.string().min(1, 'Email is required').email('Email is invalid'),
      password: z.string().min(1, 'Password is required'),
    })
    .safeParse(submission.value);

  if (submission.type !== 'validate' && result.success) {
    try {
      return await login(result.data);
    } catch (error) {
      submission.error.push(['', 'Login failed']);
    }
  } else {
    /**
     * The `getError` helpers simply convert the ZodError to
     * a set of key/value pairs which represent the name and
     * error of each field.
     */
    submission.error = submission.error.concat(getError(result));
  }

  return submission;
}
```

### Validating on-demand

Some validation rule could be expensive especially when it requires query result from database or even 3rd party services. This can be minimized by checking the submission type and metadata, or using the `shouldValidate()` helper.

```tsx
import { parse, shouldValidate } from '@conform-to/react';
import { getError } from '@conform-to/zod';
import { z } from 'zod';

export async function action({ request }) {
  const formData = await request.formData();
  const submission = parse(formData);

  if (!submission.value.email) {
    submission.error.push(['email', 'Email is required']);
  } else if (!submission.value.email.includes('@')) {
    submission.error.push(['email', 'Email is invalid']);
  } else if (
    // Continue checking only if necessary
    shouldValidate(submission, 'email') &&
    // e.g. Verifying if the email exists on the database (Example only)
    (await isRegistered(submission.value.email))
  ) {
    submission.error.push(['email', 'Email is not registered']);
  }

  if (!submission.value.password) {
    submission.error.push(['password', 'Password is required']);
  }

  /* ... */
}
```

## Client Validation

### Constraint Validation

The [Constraint Validation](https://caniuse.com/constraint-validation) API is introduced with HTML5 to enable native client side form validation. This includes:

- Utilizing [HTML attributes](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Constraint_validation#validation-related_attributes) for validations (e.g. `required`, `type`)
- Accessing form validity and configure custom constraint through the [DOM APIs](https://developer.mozilla.org/en-US/docs/Web/API/Constraint_validation#extensions_to_other_interfaces) (e.g `validationMessage`, `setCustomValidity()`)
- Styling form elements with [CSS pseudo-class](https://developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation#the_constraint_validation_api) based on the validity (e.g. `:required`, `:invalid`)

Conform utilize these APIs internally. For example, form errors are reported by listening to the [invalid event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/invalid_event) and the messages are captured from the element [validationMessage](https://developer.mozilla.org/en-US/docs/Web/API/HTMLObjectElement/validationMessage) property.

## Schema Resolver

The recommended approach at the moment is to integrate schema validation libraries such as [yup](https://github.com/jquense/yup) and [zod](https://github.com/colinhacks/zod) through a schema resolver, which resolves FormData to the desired structure and set the error from the parsing result though the Constraint Validation APIs.

Consider a signup form with the following requirments:

- The **email** field should be a valid email address,
- The **password** field should not be empty with a minimum length of 10 characters.
- The **conform-password** field should match the **password** field.

<details>
<summary>With `yup` </summary>

```tsx
import { useForm } from '@conform-to/react';
import { resolve } from '@conform-to/yup';
import * as yup from 'yup';

const schema = resolve(
  yup.object({
    email: yup
      .string()
      .required('Email is required')
      .email('Please enter a valid email'),
    password: yup
      .string()
      .required('Password is required')
      .min(10, 'The password should be at least 10 characters long'),
    'confirm-password': yup
      .string()
      .required('Confirm Password is required')
      .equals([yup.ref('password')], 'The password does not match'),
  }),
);

export default function SignupForm() {
  const formProps = useForm({
    validate: schema.validate,
  });

  return <form {...formProps}>{/* ... */}</form>;
}
```

[Full example](/docs/examples/yup)

</details>

<details>
<summary>With `zod`</summary>

```tsx
import { useForm } from '@conform-to/react';
import { resolve } from '@conform-to/zod';
import { z } from 'zod';

const schema = resolve(
  z
    .object({
      email: z
        .string({ required_error: 'Email is required' })
        .email('Please enter a valid email'),
      password: z
        .string({ required_error: 'Password is required' })
        .min(10, 'The password should be at least 10 characters long'),
      'confirm-password': z.string({
        required_error: 'Confirm Password is required',
      }),
    })
    .refine((value) => value.password === value['confirm-password'], {
      message: 'The password does not match',
      path: ['confirm-password'],
    }),
);

export default function SignupForm() {
  const formProps = useForm({
    validate: schema.validate,
  });

  return <form {...formProps}>{/* ... */}</form>;
}
```

[Full example](/docs/examples/zod)

</details>

## Manual Validation

If none of the [schema resolvers](#schema-resolver) fits your requirements, you can also setup the validation manually by using the [createValidate](/packages/conform-react/README.md#createvalidate) helper to validate each field and setup custom messages using the DOM APIs.

```tsx
import { useForm, createValidate } from '@conform-to/react';

export default function SignupForm() {
  const formProps = useForm({
    validate: createValidate((field, formData) => {
      switch (field.name) {
        case 'email':
          if (field.validity.valueMissing) {
            field.setCustomValidity('Email is required');
          } else if (field.validity.typeMismatch) {
            field.setCustomValidity('Please enter a valid email');
          } else {
            field.setCustomValidity('');
          }
          break;
        case 'password':
          if (field.validity.valueMissing) {
            field.setCustomValidity('Password is required');
          } else if (field.validity.tooShort) {
            field.setCustomValidity(
              'The password should be at least 10 characters long',
            );
          } else {
            field.setCustomValidity('');
          }
          break;
        case 'confirm-password': {
          if (field.validity.valueMissing) {
            field.setCustomValidity('Confirm Password is required');
          } else if (field.value !== formData.get('password')) {
            field.setCustomValidity('The password does not match');
          } else {
            field.setCustomValidity('');
          }
          break;
        }
      }
    }),
  });

  return <form {...formProps}>{/* ... */}</form>;
}
```

## Demo

<!-- sandbox src="/docs/examples/validation" -->

Try it out on [Codesandbox](https://codesandbox.io/s/github/edmundhung/conform/tree/main/docs/examples/validation).

<!-- /sandbox -->
