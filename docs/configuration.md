# Nested object and Array

Conform has support for nested object and array by introducing a naming convention.

<!-- aside -->

## On this page

- [Naming convention](#naming-convention)
- [Nested Object](#nested-object)
- [Array](#array)
- [Nested List](#nested-list)

<!-- /aside -->

## Naming Convention

**Conform** uses `object.property` and `array[index]` to structure data. These notations could be combined for nest list as well. e.g. `tasks[0].content`.

This is handled by the [parse](/packages/conform-react/README.md#parse) helper, which returns a submission object when provided a form data.

```ts
import { parse } from '@conform-to/react';

const formData = new FormData();
const submission = parse(formData);

console.log(submission.payload); // e.g. { tasks: [{ content: '' }] }
console.log(submission.error); // e.g. { 'tasks[0].content': 'Required' }
```

## Nested Object

When you need to set up fields as nested object, you can pass the parent field config to [useFieldset](/packages/conform-react/README.md#usefieldset) to get access to its child fields.

Each field will come with name infered based on the config and you could have it set on the form control using the [conform](/packages/conform-react/README.md#conform) helper.

```tsx
import { useForm, useFieldset, conform } from '@conform-to/react';

interface Schema {
  address: {
    street: string;
    zipcode: string;
    city: string;
    country: string;
  };
}

function Example() {
  // By providing a schema to useForm
  const [form, { address }] = useForm<Schema>();
  // All the field name will be checked with TypeScript
  const { city, zipcode, street, country } = useFieldset(form.ref, address);

  return (
    <form {...form.props}>
      {/* These set the name to `address.street`, `address.zipcode` etc. */}
      <input {...conform.input(street)} />
      <div>{street.error}</div>
      <input {...conform.input(zipcode)} />
      <div>{zipcode.error}</div>
      <input {...conform.input(city)} />
      <div>{city.error}</div>
      <input {...conform.input(country)} />
      <div>{country.error}</div>
    </form>
  );
}
```

## Array

When you need to setup fields as an array, you can pass the parent field config to [useFieldList](/packages/conform-react/README.md#usefieldlist) to get access to its item fields.

Each field will also come with name infered based on the config and will be set to the form control with the [conform](/packages/conform-react/README.md#conform) helper.

```tsx
import { useForm, useFieldList, conform } from '@conform-to/react';

interface Schema {
  tasks: string[];
}

function Example() {
  // By providing a schema to useForm
  const [form, { tasks }] = useForm<Schema>();
  // All the field name will be checked with TypeScript
  const list = useFieldList(form.ref, tasks);

  return (
    <form {...form.props}>
      <ul>
        {list.map((task) => (
          <li key={task.key}>
            {/* These set the name to `task[0]`, `tasks[1]` etc */}
            <input {...conform.input(task)} />
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

You can also set up fields as nested list by using a combination of [useFieldset](/packages/conform-react/README.md#usefieldset) and [useFieldList](/packages/conform-react/README.md#usefieldlist).

```tsx
import type { FieldConfig } from '@conform-to/react';
import { useForm, useFieldset, useFieldList, conform } from '@conform-to/react';

interface Todo {
  title: string;
  notes: string;
}

interface Schema {
  todos: Todo[];
}

function Example() {
  const [form, { todos }] = useForm<Schema>();
  const list = useFieldList(form.ref, todos);

  return (
    <form {...form.props}>
      <ul>
        {list.map((todo) => (
          <li key={todo.key}>
            {/* Pass the config to TodoFieldset */}
            <TodoFieldset {...todo} />
          </li>
        ))}
      </ul>
    </form>
  );
}

function TodoFieldset(config: FieldConfig<Todo>) {
  const ref = useRef<HTMLFieldsetElement>(null);
  // useFieldset / useFieldList accepts both form or fieldset ref
  const { title, notes } = useFieldset(ref, config);

  return (
    <fieldset ref={ref}>
      <input {...conform.input(title)} />
      <div>{title.error}</div>
      <input {...conform.input(notes)} />
      <div>{notes.error}</div>
    </fieldset>
  );
}
```
