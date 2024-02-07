# getCollectionProps

A helper that returns all the props required to make a group of checkboxes or radio buttons accessible.

```tsx
const collectionProps = getCollectionProps(meta, options);
```

## Example

```tsx
import { useForm, getCollectionProps } from '@conform-to/react';

function Example() {
  const [form, fields] = useForm();

  return (
    <>
      {getCollectionProps(fields.color, {
        type: 'radio',
        options: ['red', 'green', 'blue'],
      }).map((props) => (
        <label key={props.id} htmlFor={props.id}>
          <input {...props} />
          <span>{props.value}</span>
        </label>
      ))}
    </>
  );
}
```

## Options

### `type`

The type of the collection. It could be **checkbox** or **radio**.

### `options`

The options of the collection. Each option will be treated as the value of the input and used to derive the corresponding **key** or **id**.

### `value`

The helper will return a **defaultValue** unless this is set to `false`, e.g. a controlled input.

### `ariaAttributes`

Decide whether to include `aria-invalid` and `aria-describedby` in the result props. Default to **true**.

### `ariaInvalid`

Decide whether the aria attributes should be based on `meta.errors` or `meta.allErrors`. Default to **errors**.

### `ariaDescribedBy`

Append additional **id** to the `aria-describedby` attribute. You can pass `meta.descriptionId` from the field metadata.

## Tips

### The helper is optional

The helper is just a convenience function to help reducing boilerplate and make it more readable. You can always use the field metadata directly to set the props of your checkbox element.

```tsx
// Before
function Example() {
  return (
    <form>
      {['a', 'b', 'c'].map((value) => (
        <label key={value} htmlFor={`${fields.category.id}-${value}`}>
          <input
            type="checkbox"
            key={`${fields.category.key}-${value}`}
            id={`${fields.category.id}-${value}`}
            name={fields.category.name}
            form={fields.category.formId}
            value={value}
            defaultChecked={fields.category.initialValue?.includes(value)}
            aria-invalid={!fields.category.valid || undefined}
            aria-describedby={
              !fields.category.valid ? fields.category.errorId : undefined
            }
          />
          <span>{value}</span>
        </label>
      ))}
      x
    </form>
  );
}

// After
function Example() {
  return (
    <form>
      {getCollectionProps(fields.category, {
        type: 'checkbox',
        options: ['a', 'b', 'c'],
      }).map((props) => (
        <label key={props.id} htmlFor={props.id}>
          <input {...props} />
          <span>{props.value}</span>
        </label>
      ))}
    </form>
  );
}
```

### Make your own helper

The helper is designed for the native checkbox elements. If you need to use a custom component, you can always make your own helpers.
