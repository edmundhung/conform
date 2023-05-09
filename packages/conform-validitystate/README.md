# @conform-to/validitystate

> The current version is not compatible with the react package.

[Conform](https://github.com/edmundhung/conform) helpers for server validation based on the validation attributes.

<!-- aside -->

## API Reference

- [parse](#parse)
- [validate](#validate)
- [defaultFormatError](#defaultformaterror)
- [getError](#geterror)

<!-- /aside -->

### parse

A function to parse FormData or URLSearchParams on the server based on the constraints and an optional error formatter.

```ts
import { type FormConstraints, type FormatErrorArgs, parse } from '@conform-to/validitystate';

const constraints = {
    email: { type: 'email', required: true },
    password: { type: 'password', required: true },
    remember: { type: 'checkbox' },
} satisify FormConstraints;

function formatError({ input }: FormatErrorArgs) {
    switch (input.name) {
        case 'email': {
            if (input.validity.valueMissing) {
                return 'Email is required';
            } else if (input.validity.typeMismatch) {
                return 'Email is invalid';
            }
            break;
        }
        case 'password': {
            if (input.validity.valueMissing) {
                return 'Password is required';
            }
            break;
        }
     }

     return '';
}

const submission = parse(formData, {
  constraints,
  formatError,
});

// The error will be a dictinioary mapping input name to the corresponding errors
// e.g. { email: 'Email is required', password: 'Password is required' }
console.log(submission.error);

if (!submission.error) {
    // If no error, the parsed data will be available with the inferred type.
    // e.g. { email: string; password: string; remember: boolean; }
    console.log(submission.value);
}
```

The error formatter can also return multiple error.

```ts
function formatError({ input }: FormatErrorArgs) {
  const error = [];

  switch (input.name) {
    case 'email': {
      if (input.validity.valueMissing) {
        error.push('Email is required');
      }
      if (input.validity.typeMismatch) {
        error.push('Email is invalid');
      }
      break;
    }
    case 'password': {
      if (input.validity.valueMissing) {
        error.push('Password is required');
      }
      if (input.validity.tooShort) {
        error.push('Passowrd is too short');
      }
      break;
    }
  }

  return error;
}
```

If no error formatter is provided, check the [defaultFormatError](#defaultformaterror) helpers for the default behavior.

### validate

A helper to customize client validation by reusing the constraints and error formatter. Error will be set on the form control element using the `setCustomValidity` method. It should be called before reporting new error (i.e. triggering `form.reportValidity()`).

```tsx
import { validate } from '@conform-to/validitystate';

function Example() {
  return (
    <form
      onSubmit={(event) => {
        const form = event.currentTarget;

        // validate before reporting new error
        validate(form, {
          constraints,
          formatError,
        });

        if (!form.reportValidity()) {
          event.preventDefault();
        }
      }}
      noValidate
    >
      {/* ... */}
    </form>
  );
}
```

### defaultFormatError

This is the default error formatter used by [parse](#parse) to represent error by all failed validation attributes. For example:

```json
{ "email": ["required", "type"], "password": ["required"] }
```

This helper is useful if you want to customize the error based on the default error formatter.

```ts
import { type FormConstraints, type FormatErrorArgs, defaultFormatError } from '@conform-to/validitystate';

const constraints = {
    email: { type: 'email', required: true },
    password: { type: 'password', required: true },
    confirmPassowrd: { type: 'password', required: true },
} satisify FormConstraints;

function formatError({ input }: FormatErrorArgs<typeof constraints>) {
    const error = defaultFormatError({ input });

    if (input.name === 'confirmPassword' && error.length === 0 && value.password !== value.confirmPassword) {
        error.push('notmatch');
    }

    return error;
}

const submission = parse(formData, {
    constraints,
    formatError,
});
```

### getError

It gets the actual error messages stored on the `validationMessage` property. This is needed if the custom error formatter returns multiple error.

```tsx
import { getError } from '@conform-to/validitystate';

function Example() {
  const [error, setError] = useState({});

  return (
    <form
      onInvalid={(event) => {
        const input = event.target as HTMLInputElement;

        setError((prev) => ({
          ...prev,
          [input.name]: getError(input.validationMessage),
        }));

        event.preventDefault();
      }}
    >
      {/* ... */}
    </form>
  );
}
```

## Attributes supported

> `month` and `week` input type are not implemented due to limited browser support

| Support        | type | required | minLength | maxLength | pattern | min | max | step | multiple |
| :------------- | :--: | :------: | :-------: | :-------: | :-----: | :-: | :-: | :--: | :------: |
| text           |      |    🗸     |     🗸     |     🗸     |    🗸    |     |     |      |          |
| email          |  🗸   |    🗸     |     🗸     |     🗸     |    🗸    |     |     |      |          |
| password       |      |    🗸     |     🗸     |     🗸     |    🗸    |     |     |      |          |
| url            |  🗸   |    🗸     |     🗸     |     🗸     |    🗸    |     |     |      |          |
| tel            |      |    🗸     |     🗸     |     🗸     |    🗸    |     |     |      |          |
| search         |      |    🗸     |     🗸     |     🗸     |    🗸    |     |     |      |          |
| datetime-local |      |    🗸     |           |           |         |  🗸  |  🗸  |  🗸   |          |
| date           |      |    🗸     |           |           |         |  🗸  |  🗸  |  🗸   |          |
| time           |      |    🗸     |           |           |         |  🗸  |  🗸  |  🗸   |          |
| select         |      |    🗸     |           |           |         |     |     |      |    🗸     |
| textarea       |      |    🗸     |     🗸     |     🗸     |         |     |     |      |          |
| radio          |      |    🗸     |           |           |         |     |     |      |          |
| color          |      |    🗸     |           |           |         |     |     |      |          |
| checkbox       |      |    🗸     |           |           |         |     |     |      |          |
| number         |      |    🗸     |           |           |         |  🗸  |  🗸  |  🗸   |          |
| range          |      |    🗸     |           |           |         |  🗸  |  🗸  |  🗸   |          |
| file           |      |    🗸     |           |           |         |     |     |      |    🗸     |
