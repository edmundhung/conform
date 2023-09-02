# Nested object and Array

Conform support both nested object and array by leveraging a naming convention on the name attribute.

<!-- row -->

<!-- col -->

## Naming Convention

**Conform** uses the `object.property` and `array[index]` syntax to denote data structure. These notations could be combined for nested array as well, such as `tasks[0].content`.

The form data should be parsed using the Conform [parse](/packages/conform-zod/README.md#parse) helper to resolves the data correctly based on the naming convention.

<!-- /col -->

<!-- col sticky=true -->

```ts
import { parse } from '@conform-to/zod';

const submission = parse(formData, {
  /* ... */
});
```

<!-- /col -->

<!-- /row -->

---

<!-- row -->

<!-- col -->

## Nested Object

If you need to set up nested fields, you can pass the parent field config to the [useFieldset](/packages/conform-react/README.md#usefieldset) hook which returns the config of each child field. It will also infer the name of each child field automatically based on the parent field.

```ts
import { z } from 'zod';

const schema = z.object({
  address: z.object({
    street: z.string(),
    zipcode: z.string(),
    city: z.string(),
    country: z.string(),
  }),
});
```

For example, the name of the `city` field will be `address.city`.

<!-- /col -->

<!-- col sticky=true -->

```tsx
import { useForm, useFieldset } from '@conform-to/react';

function Example() {
  const [form, fields] = useForm({
    // ...
  });
  const address = useFieldset(form.ref, fields.address);

  return (
    <form {...form.props}>
      <input name={address.street.name} />
      <div>{address.street.error}</div>
      <input name={address.zipcode.name} />
      <div>{address.zipcode.error}</div>
      <input name={address.city.name} />
      <div>{address.city.error}</div>
      <input name={address.country.name} />
      <div>{address.country.error}</div>
    </form>
  );
}
```

<!-- /col -->

<!-- /row -->

---

<!-- row -->

<!-- col -->

## Array

If you need to setup an array of fields, you can pass the parent field config to the [useFieldList](/packages/conform-react/README.md#usefieldlist) hook which returns the config of each item field. It will also infer the name of each item field automatically based on the parent field.

```ts
import { z } from 'zod';

const schema = z.object({
  tasks: z.array(z.string()),
});
```

For example, with the schema above, the name of the first item field will be `tasks[0]`.

For information about modifying list (e.g. insert / remove / reorder), see the [list intent](/docs/intent-button.md#list-intent) section.

<!-- /col -->

<!-- col sticky=true -->

```tsx
import { useForm, useFieldList } from '@conform-to/react';

function Example() {
  const [form, fields] = useForm({
    // ...
  });
  const list = useFieldList(form.ref, fields.tasks);

  return (
    <form {...form.props}>
      <ul>
        {list.map((task) => (
          <li key={task.key}>
            <input name={task.name} />
            <div>{task.error}</div>
          </li>
        ))}
      </ul>
    </form>
  );
}
```

<!-- /col -->

<!-- /row -->

---

<!-- row -->

<!-- col -->

## Nested Array

You can also combine both [useFieldset](/packages/conform-react/README.md#usefieldset) and [useFieldList](/packages/conform-react/README.md#usefieldlist) hook for nested array.

```ts
import { z } from 'zod';

const schema = z.object({
  tasks: z.array(
    z.object({
      title: z.string(),
      content: z.string(),
    }),
  ),
});
```

For example, the name of the first task title field will be `tasks[0].title`.

<!-- /col -->

<!-- col sticky=true -->

```tsx
import type { FieldConfig } from '@conform-to/react';
import {
  useForm,
  useFieldset,
  useFieldList,
} from '@conform-to/react';

function Example() {
  const [form, fields] = useForm({
    // ...
  });
  const tasks = useFieldList(form.ref, fields.tasks);

  return (
    <form {...form.props}>
      <ul>
        {tasks.map((task) => (
          <li key={task.key}>
            {/* Pass each item config to TodoFieldset */}
            <TaskFieldset config={task} />
          </li>
        ))}
      </ul>
    </form>
  );
}

function TaskFieldset({
  config,
}: {
  config: FieldConfig<Task>;
}) {
  const ref = useRef<HTMLFieldsetElement>(null);
  // Both useFieldset / useFieldList accept form or fieldset ref
  const task = useFieldset(ref, config);

  return (
    <fieldset ref={ref}>
      <input name={task.title.name} />
      <div>{task.title.error}</div>
      <input name={task.content.name} />
      <div>{task.content.error}</div>
    </fieldset>
  );
}
```

<!-- /col -->

<!-- /row -->
