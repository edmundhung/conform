# Validation

In this section, we will briefly introduce the Constraint Validation API and explain different approaches for applying validations.

<!-- aside -->

## Table of Contents

- [Constraint Validation](#constraint-validation)
- [Schema Resolver](#schema-resolver)
- [Manual Validation](#manual-validation)
- [Demo](#demo)

<!-- /aside -->

## Constraint Validation

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

> [Codesandbox](https://codesandbox.io/s/github/edmundhung/conform/tree/main/docs/examples/validation) / [Stackblitz](https://stackblitz.com/github/edmundhung/conform/tree/main/docs/examples/validation)
