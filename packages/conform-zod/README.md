# @conform-to/zod

> [Zod](https://github.com/colinhacks/zod) schema resolver for [conform](https://github.com/edmundhung/conform)

## API Reference

- [resolve](#resolve)
- [parse](#parse)

### resolve

This resolves zod schema to a conform schema:

```tsx
import { useFieldset } from '@conform-to/react';
import { resolve } from '@conform-to/zod';
import { z } from 'zod';

// Define the schema with zod
const schema = z.object({
  email: z.string(),
  password: z.string(),
});

// When used with `@conform-to/react`:
function RandomForm() {
  const [setupFieldset, { email, password }] = useFieldset(resolve(schema));

  // ...
}
```

### parse

The `parse` function could be used to parse the FormData on client side:

```tsx
const schema = z.object({
  // Define the schema with zod
});

form.addEventListener('submit', (e) => {
  e.preventDefault();

  // Read the FormData from the from
  const formData = new FormData(e.target);

  // Parse the data against the zod schema
  const result = parse(formData, schema);

  console.log(result.state);
  // It could be accepted / rejected / processed

  console.log(result.value);
  // Parsed value (if accepted)
  // or Fieldset data in schema structure (if not)

  console.log(result.error);
  // Fieldset error in schema structure  (if rejected)
});
```

Or parse the request payload on server side (e.g. Remix):

```tsx
import { parse } from '@conform-to/zod';
import { z } from 'zod';

const schema = z.object({
  // Define the schema with zod
});

export let action = async ({ request }) => {
  const formData = await request.formData();
  const result = parse(formData, schema);

  // Depends on the usecase, you can also do this:
  // const url = new URL(request.url)
  // const result = parse(url.searchParams, schema)

  // Return the current result if not accepted
  if (result.state !== 'accepted') {
      return json(result);
  }

  // Do something else
};

export default function SomeRoute() {
  const result = useActionData();

  // You can then use result.value / result.error
  // to populate inital value of each fields and
  // its corresponding error
}
```
