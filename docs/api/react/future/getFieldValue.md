# getFieldValue

> The `getFieldValue` function is part of Conform's future export. These APIs are experimental and may change in minor versions. [Learn more](https://github.com/edmundhung/conform/discussions/954)

A utility function that extracts and validates field values from `FormData` or `URLSearchParams`. It supports type guards for runtime validation and can parse nested objects from field naming conventions.

```ts
import { getFieldValue } from '@conform-to/react/future';

const value = getFieldValue(formData, name, options);
```

## Parameters

### `formData: FormData | URLSearchParams`

The form data to extract values from. Can be:

- A `FormData` object from a form submission
- A `URLSearchParams` object from a URL query string

### `name: string | FieldName<T>`

The field name to retrieve. Supports nested field names using dot notation and array indices:

- `email` → retrieves the `email` field
- `address.city` → retrieves the nested `city` field within `address`
- `items[0]` → retrieves the first item in the `items` array

When using a `FieldName<T>` from Conform's field metadata, the return type is automatically inferred.

### `options.type?: 'string' | 'file' | 'object'`

Specifies the expected type of the field value. When set, the function validates the value at runtime and throws an error if the type doesn't match.

- `'string'` - Expects a string value
- `'file'` - Expects a `File` object
- `'object'` - Expects a plain object

### `options.array?: boolean`

When `true`, expects the value to be an array.

### `options.optional?: boolean`

When `true`, returns `undefined` for missing fields instead of throwing an error. Type validation still applies when the field exists.

## Returns

The return type depends on the options provided:

| Options                           | Return Type                 |
| --------------------------------- | --------------------------- |
| (none)                            | `unknown`                   |
| `{ type: 'string' }`              | `string`                    |
| `{ type: 'file' }`                | `File`                      |
| `{ type: 'object' }`              | `{ [key]: unknown }`        |
| `{ array: true }`                 | `unknown[]`                 |
| `{ type: 'string', array: true }` | `string[]`                  |
| `{ type: 'file', array: true }`   | `File[]`                    |
| `{ type: 'object', array: true }` | `Array<{ [key]: unknown }>` |
| `{ optional: true }`              | `... \| undefined`          |

## Example

### Basic field retrieval

```ts
const formData = new FormData();
formData.append('email', 'user@example.com');
formData.append('tags', 'react');
formData.append('tags', 'typescript');

// Get single value
const email = getFieldValue(formData, 'email'); // 'user@example.com'

// Get all values as array
const tags = getFieldValue(formData, 'tags', { array: true }); // ['react', 'typescript']
```

### Parsing nested objects

```ts
const formData = new FormData();
formData.append('address.city', 'New York');
formData.append('address.zipcode', '10001');

const address = getFieldValue(formData, 'address', { type: 'object' });
// { city: 'New York', zipcode: '10001' }
```

### Parsing array of objects

```ts
const formData = new FormData();
formData.append('items[0].name', 'Item 1');
formData.append('items[0].price', '10');
formData.append('items[1].name', 'Item 2');
formData.append('items[1].price', '20');

const items = getFieldValue(formData, 'items', { type: 'object', array: true });
// [{ name: 'Item 1', price: '10' }, { name: 'Item 2', price: '20' }]
```

### With useFormData for live updates

```tsx
import { useForm, useFormData, getFieldValue } from '@conform-to/react/future';

function AddressForm() {
  const { form, fields } = useForm();

  const addressFields = fields.address.getFieldset();
  // Subscribe to address changes with type inference from field name
  const address = useFormData(form.id, (formData) =>
    getFieldValue(formData, fields.address.name, { type: 'object' }),
  );

  return (
    <form {...form.props}>
      <input name={addressFields.city.name} />
      <input name={addressFields.street.name} />

      {/* Show live parsed address */}
      <pre>{JSON.stringify(address, null, 2)}</pre>
    </form>
  );
}
```
