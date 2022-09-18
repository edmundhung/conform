# Advanced

In this section, we will cover how to associate an input to a form using the `form` attribute and utilizing the button value.

<!-- aside -->

## Table of Contents

- [Associating input](#associating-input)
- [Button value](#button-value)
- [Demo](#demo)

<!-- /aside -->

## Associating input

HTML allows assoicating an input field in one part of the DOM tree with a form in another part of the DOM tree through the use of the [form](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#form) attributes and this is supported by conform out of the box:

```tsx
import { useForm, useFieldset } from '@conform-to/react';

function ExampleForm() {
  const formProps = useForm();

  return (
    <div>
      <form id="product" {...formProps} />
      <AnotherDOMTree />
      <button type="submit" form="product">
        Add to cart
      </button>
    </div>
  );
}

function AnotherDOMTree() {
  const ref = useRef<HTMLFieldSetElement>(null);
  const { quanitiy, frequency } = useFieldset(ref);

  return (
    <fieldset form="product" ref={ref}>
      <legend>Order</legend>
      <label>
        <div>Quantity</div>
        <input type="number" form="product" name="quanitiy" required />
        <div>{quanitiy.error}</div>
      </label>
      <label>
        <div>Frequency (Weeks)</div>
        <input type="text" form="product" name="frequency" />
        <div>{frequency.error}</div>
      </label>
    </fieldset>
  );
}
```

## Button value

Another powerful HTML form feature is the [value](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#attr-value) associated with the button element and will be avilable as the [submitter](https://developer.mozilla.org/en-US/docs/Web/API/SubmitEvent/submitter) when a submit event is triggered. This makes it possible to trigger different behaviour based on the button value.

For example, you can utilise this for different validation rules based on the button clicked::

```tsx
import { createValidate } from '@conform-to/react';

const validate = createValidate((field, formData) => {
  switch (field.name) {
    case 'quantity': {
      if (field.value === '') {
        field.setCustomValidity('Quantity is required');
      } else {
        field.setCustomValidity('');
      }
      break;
    }
    case 'frequency': {
      const type = formData.get('type');

      if (type === 'subscription' && field.value === '') {
        field.setCustomValidity('Frequnecy is required');
      } else if (type === 'onetime-purchase' && field.value !== '') {
        field.setCustomValidity('Frequnecy should be blank');
      } else {
        field.setCustomValidity('');
      }
      break;
    }
  }
});
```

## Demo

> [Codesandbox](https://codesandbox.io/s/github/edmundhung/conform/tree/main/examples/advanced) / [Stackblitz](https://stackblitz.com/github/edmundhung/conform/tree/main/examples/advanced)
