# Nested object and Array

Conform support both nested object and array by leveraging a naming convention on the name attribute.

<!-- aside -->

## On this page

- [Naming convention](#naming-convention)
- [Nested Object](#nested-object)
- [Array](#array)
- [Nested List](#nested-list)

<!-- /aside -->

## Naming Convention

**Conform** uses the `object.property` and `array[index]` syntax to denote data structure. These notations could be combined for nest list as well. e.g. `tasks[0].content`.

The form data should be parsed using the Conform [parse](/packages/conform-react/README.md#parse) helper to resolve each data path and reconstruct the data structure accordingly.

```ts
import { parse } from '@conform-to/react';

const formData = new FormData();

// If the form data has an entry `['tasks[0].content', 'Hello World']`
const submission = parse(formData);

// The submission payload will be `{ tasks: [{ content: 'Hello World' }] }`
console.log(submission.payload);
```

## Nested Object

When you need to set up nested fields, you can pass the parent field config to the[useFieldset](/packages/conform-react/README.md#usefieldset) hook to get access to each child field with name infered automatically.

```tsx
import { useForm, useFieldset } from '@conform-to/react';

function Example() {
  const [form, { address }] = useForm<Schema>();
  const { city, zipcode, street, country } = useFieldset(form.ref, address);

  return (
    <form {...form.props}>
      {/* Set the name to `address.street`, `address.zipcode` etc. */}
      <input name={street.name} />
      <div>{street.error}</div>
      <input name={zipcode.name} />
      <div>{zipcode.error}</div>
      <input name={city.name} />
      <div>{city.error}</div>
      <input name={country.name} />
      <div>{country.error}</div>
    </form>
  );
}
```

## Array

When you need to setup a list of fields, you can pass the parent field config to the[useFieldList](/packages/conform-react/README.md#usefieldlist) hook to get access to each item field with name infered automatically as well.

```tsx
import { useForm, useFieldList } from '@conform-to/react';

function Example() {
  const [form, { tasks }] = useForm();
  const list = useFieldList(form.ref, tasks);

  return (
    <form {...form.props}>
      <ul>
        {list.map((task) => (
          <li key={task.key}>
            {/* Set the name to `task[0]`, `tasks[1]` etc */}
            <input name={task.name} />
            <div>{task.error}</div>
          </li>
        ))}
      </ul>
    </form>
  );
}
```

For information about modifying list (e.g. append / remove / reorder), see the [Modifying a list](/docs/intent-button.md#modifying-a-list) section.

## Nested List

You can also combine both [useFieldset](/packages/conform-react/README.md#usefieldset) and [useFieldList](/packages/conform-react/README.md#usefieldlist) hook for nested list.

```tsx
import type { FieldConfig } from '@conform-to/react';
import { useForm, useFieldset, useFieldList } from '@conform-to/react';

interface Todo {
  title: string;
  notes: string;
}

interface Schema {
  todos: Todo[];
}

function Example() {
  const [form, { tasks }] = useForm();
  const todos = useFieldList(form.ref, tasks);

  return (
    <form {...form.props}>
      <ul>
        {todos.map((todo) => (
          <li key={todo.key}>
            {/* Pass each item config to TodoFieldset */}
            <TodoFieldset {...todo} />
          </li>
        ))}
      </ul>
    </form>
  );
}

function TodoFieldset(config: FieldConfig<Todo>) {
  const ref = useRef<HTMLFieldsetElement>(null);
  // Both useFieldset / useFieldList accept form or fieldset ref
  const { title, notes } = useFieldset(ref, config);

  return (
    <fieldset ref={ref}>
      <input name={title.name} />
      <div>{title.error}</div>
      <input name={notes.name} />
      <div>{notes.error}</div>
    </fieldset>
  );
}
```
