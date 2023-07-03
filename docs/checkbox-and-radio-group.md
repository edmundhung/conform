# Checkbox and Radio Group

Conform provides a [collection](/packages/conform-react/README.md#conform) helper to configure a checkbox or radio group.

<!-- aside -->

## On this page

- [Radio buttons](#radio-group)
- [Checkbox](#checkboxes)

<!-- /aside -->

## Radio buttons

Setting up a radio group is no different from other inputs. You just need to pass the list of options to the helper and each option will be set as the value of the input. The helper will also derive the `defaultChecked` property and manage the `id` and aria attributes for you.

```tsx
import { useForm } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import { z } from 'zod';

const schema = z.object({
	color: z.string(),
});

function Example() {
	const [form, { color }] = useForm({
		onValidate({ formData }) {
			return parse(formData, { schema });
		},
	});

	return (
		<form {...form.props}>
			<fieldset>
        <lengend>Please select your favorite color</legend>
        {conform
          .collection(color, {
            type: 'radio',
            options: ['red', 'green', 'blue'],
            ariaAttributes: true,
          })
          .map((props, index) => (
            <div key={index}>
              <label>{props.value}</label>
              <input {...props} />
            </div>
          )))}
				<div>{color.error}</div>
			</legend>
			<button>Submit</button>
		</form>
	);
}
```

## Checkbox

Setting up a checkbox group would be similar to a radio group with `type` being set to `checkbox`. However, there is one caveat when validating a checkbox group: Conform will transform the value to an array only when there are more than one checkboxes selected. To ensure a consistent data structure, you need to preprocess the data as shown in the snippet.

```tsx
import { useForm } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import { z } from 'zod';

const schema = z.object({
	answer: z.preprocess(
    // Transform the value to an array using concat
    (value) => [].concat(value),
    z.string().array().nonEmpty('At least one answer is required')
  ),
});

function Example() {
	const [form, { answer }] = useForm({
		onValidate({ formData }) {
			return parse(formData, { schema });
		},
	});

	return (
		<form {...form.props}>
			<fieldset>
        <lengend>Please select the correct answers</legend>
        {conform
          .collection(answer, {
            type: 'checkbox',
            options: ['a', 'b', 'c', 'd'],
            ariaAttributes: true,
          })
          .map((props, index) => (
            <div key={index}>
              <label>{props.value}</label>
              <input {...props} />
            </div>
          )))}
				<div>{answer.error}</div>
			</legend>
			<button>Submit</button>
		</form>
	);
}
```
