# Nested

In this section, we will cover how to construct nested data structure by following the naming convention.

<!-- aside -->

## Table of Contents

- [Naming convention](#naming-convention)
- [Configuration](#configuration)
  - [Manual setup](#manual-setup)
  - [Derived config](#derived-config)
- [Demo](#demo)

<!-- /aside -->

## Naming convention

Conform utilise a naming definition similiar to how properties are accessed in JavaScript: `object.propertyName`. The dot notation could be nested as many levels as you need.

Once the name of the fields are configured properly, you will need to consturct a submission object using the `createSubmission()` API instead of `Object.fromEntries()`:

```tsx
import { useForm, createSubmission } from '@conform-to/react';

export default function PaymentForm() {
  const formProps = useForm({
    onSubmit(event) {
      event.preventDefault();

      const formData = new FormData(event.currentTarget);
      const submission = createSubmission(formData);

      console.log(submission);
    },
  });

  return <form {...formProps}>{/* ... */}</form>;
}
```

## Configuration

There are 2 approaches to setup the field name similar to [nested](../nested). For example, if we are building a payment form with the following schema:

```ts
interface Payment {
  account: string;
  amount: {
    currency: string;
    value: number;
  };
  reference?: string;
}
```

### Manual setup

It can be setup manually as below:

```tsx
function PaymentForm() {
  const formProps = useForm();
  const { account, amount, reference } = useFieldset<Payment>(formProps.ref);
  const { currency, value } = useFieldset(formProps.ref, amount.config);

  return (
    <form {...formProps}>
      <label>
        <div>Account Number</div>
        <input type="text" name="account" required />
      </label>
      <label>
        <div>Amount</div>
        <input type="number" name="amount.value" required min={10} step={0.1} />
      </label>
      <label>
        <div>Currency</div>
        <select name="amount.currency" required>
          <option value="">Please select</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="HKD">HKD</option>
        </select>
      </label>
      <label>
        <div>Reference</div>
        <textarea name="reference" minLength={5} />
      </label>
      <button type="submit">Transfer</button>
    </form>
  );
}
```

### Derived config

Alternatively, there is also dervied config provided by [useFieldset](/packages/conform-react#usefieldset):

```tsx
export default function PaymentForm() {
  const formProps = useForm();
  const { account, amount, reference } = useFieldset<Payment>(formProps.ref);
  const { currency, value } = useFieldset(formProps.ref, amount.config);

  return (
    <form {...formProps}>
      <label>
        <div>Account Number</div>
        <input type="text" name={account.config.name} required />
      </label>
      <label>
        <div>Amount</div>
        <input
          type="number"
          name={value.config.name}
          required
          min={10}
          step={0.1}
        />
      </label>
      <label>
        <div>Currency</div>
        <select name={currency.config.name} required>
          <option value="">Please select</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="HKD">HKD</option>
        </select>
      </label>
      <label>
        <div>Reference</div>
        <textarea name={reference.config.name} minLength={5} />
      </label>
      <button type="submit">Transfer</button>
    </form>
  );
}
```

## Demo

> [Codesandbox](https://codesandbox.io/s/github/edmundhung/conform/tree/main/examples/nested) \| [Stackblitz](https://stackblitz.com/github/edmundhung/conform/tree/main/examples/nested)
