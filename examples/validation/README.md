# Validation

In this section, we will briefly introduce the Constraint Validation API and show you how to customize the validation messages and configure custom constraint.

<!-- aside -->

## Table of Contents

- [Schema Resolver](#schema-resolver)
  - [Yup](#yup)
  - [Zod](#zod)
- [Constraint Validation](#constraint-validation)
  - [Manual Validation](#manual-validation)
  - [Using `createValidate`](#using-createvalidate)
- [Demo](#demo)

<!-- /aside -->

## Constraint Validation

The [Constraint Validation](https://caniuse.com/constraint-validation) API is introduced with HTML5 to enable native client side form validation. This includes:

- Utilizing [HTML attributes](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Constraint_validation#validation-related_attributes) for validations (e.g. `required`, `type`)
- Accessing form validity and configure custom constraint through the [DOM APIs](https://developer.mozilla.org/en-US/docs/Web/API/Constraint_validation#extensions_to_other_interfaces) (e.g `validationMessage`, `setCustomValidity()`)
- Styling form elements with [CSS pseudo-class](https://developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation#the_constraint_validation_api) based on the validity (e.g. `:required`, `:invalid`)

Conform utilize these APIs internally. For example, form errors are reported by listening to the [invalid event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/invalid_event) and the messages are captured from the element [validationMessage](https://developer.mozilla.org/en-US/docs/Web/API/HTMLObjectElement/validationMessage) property.

## Schema Resolver

If you find it tedious still using the createValidate helper with the DOM APIs, conform provides an alternative solution which integrate with schema validation library such as [yup](https://github.com/jquense/yup) and [zod](https://github.com/colinhacks/zod). We have prepared examples for each of the integration.

- [@conform-to/yup](../yup)
- [@conform-to/zod](../zod)

## Manual Validation

Conform provides a [createValidate](/packages/conform-react#createvalidate) helper to validate each field and setup custom messages using the DOM APIs.

Consider a signup form with the following requirments:

- The **email** field should be a valid email address,
- The **password** field should not be empty with a minimum length of 10 characters.
- The **conform-password** field should match the **password** field.

```tsx
import { useForm, useFieldset, createValidate } from '@conform-to/react';

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
    onSubmit(event) {
      event.preventDefault();

      const formData = new FormData(event.currentTarget);
      const value = Object.fromEntries(formData);

      console.log(value);
    },
  });
  const {
    email,
    password,
    'confirm-password': confirmPassword,
  } = useFieldset(formProps.ref);

  return (
    <form {...formProps}>
      <label>
        <div>Email</div>
        <input type="email" name="email" required />
        <div>{email.error}</div>
      </label>
      <label>
        <div>Password</div>
        <input type="password" name="password" required minLength={10} />
        <div>{password.error}</div>
      </label>
      <label>
        <div>Confirm Password</div>
        <input type="password" name="confirm-password" required />
        <div>{confirmPassword.error}</div>
      </label>
      <button type="submit">Login</button>
    </form>
  );
}
```

## Demo

> [Codesandbox](https://codesandbox.io/s/github/edmundhung/conform/tree/v0.3.0/examples/custom-validation) \| [Stackblitz](https://stackblitz.com/github/edmundhung/conform/tree/v0.3.0/examples/custom-validation)
