# Checkbox and Radio Group

Setting up a checkbox or radio group is no different from any standard inputs.

## Radio Group

To set up a radio group, make sure the **name** attribute is the same for all the inputs. You can also use the initialValue from the field metadata to derive whether the radio button should be checked.

```tsx
import { useForm } from '@conform-to/react';

function Example() {
  const [form, fields] = useForm();

  return (
    <form id={form.id}>
      <fieldset>
        <legend>Please select your favorite color</legend>
        {['red', 'green', 'blue'].map((value) => (
          <div key={value}>
            <label>{value}</label>
            <input
              type="radio"
              name={fields.color.name}
              value={value}
              defaultChecked={fields.color.initialValue === value}
            />
          </div>
        ))}
        <div>{fields.color.errors}</div>
      </fieldset>
      <button>Submit</button>
    </form>
  );
}
```

## Checkbox

Setting up a checkbox group would be similar to a radio group except the initialValue can be either a string or an array because of missing information on the server side whether the checkbox is a boolean or a group. You can derive the **defaultChecked** value from the initialValue as shown below.

```tsx
import { useForm } from '@conform-to/react';

function Example() {
  const [form, fields] = useForm();

  return (
    <form id={form.id}>
      <fieldset>
        <legend>Please select the correct answers</legend>
        {['a', 'b', 'c', 'd'].map((value) => (
          <div key={value}>
            <label>{value}</label>
            <input
              type="checkbox"
              name={fields.answer.name}
              value={value}
              defaultChecked={
                fields.answer.initialValue &&
                Array.isArray(fields.answer.initialValue)
                  ? fields.answer.initialValue.includes(value)
                  : fields.answer.initialValue === value
              }
            />
          </div>
        ))}
        <div>{fields.answer.errors}</div>
      </fieldset>
      <button>Submit</button>
    </form>
  );
}
```

However, if it is just a single checkbox, you can check if the initialValue matches the input **value** which defaults to **on** by the browser.

```tsx
import { useForm } from '@conform-to/react';

function Example() {
  const [form, fields] = useForm();

  return (
    <form id={form.id}>
      <div>
        <label>Terms and conditions</label>
        <input
          name={fields.toc}
          defaultChecked={fields.toc.initialValue === 'on'}
        />
        <div>{fields.toc.errors}</div>
      </div>
      <button>Submit</button>
    </form>
  );
}
```
