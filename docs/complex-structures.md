# Nested object and Array

Conform support both nested object and array by leveraging a naming convention on the name attribute.

## Naming Convention

Conform uses the `object.property` and `array[index]` syntax to denote data structure. These notations could be combined for nested array as well. e.g. `tasks[0].content`. If the form data has an entry `['tasks[0].content', 'Hello World']`, the object constructed will become `{ tasks: [{ content: 'Hello World' }] }`.

However, there is no need to set the name attribute of each field manually. Conform will always infer the name for you and you will have better type safety if you are using the generated name all

## Nested Object

To set up a nested field, just call the `getFieldset()` method from the parent field metadata to get access to each child field with name infered automatically.

```tsx
import { useForm } from '@conform-to/react';

function Example() {
  const [form, fields] = useForm();
  const address = fields.address.getFieldset();

  return (
    <form id={form.id}>
      {/* Set the name to `address.street`, `address.zipcode` etc. */}
      <input name={address.street.name} />
      <div>{address.street.errors}</div>
      <input name={address.zipcode.name} />
      <div>{address.zipcode.errors}</div>
      <input name={address.city.name} />
      <div>{address.city.errors}</div>
      <input name={address.country.name} />
      <div>{address.country.errors}</div>
    </form>
  );
}
```

## Array

When you need to setup a list of fields, you can call the `getFieldList()` method from the parent field metadata to get access to each item field with name infered automatically as well. If you want to modify the items in the list, you can also use the `insert`, `remove` and `reorder` intents as explained in the [Intent button](./intent-button.md#insert-remove-and-reorder-intents) page.

```tsx
import { useForm } from '@conform-to/react';

function Example() {
  const [form, fields] = useForm();
  const tasks = fields.tasks.getFieldList();

  return (
    <form id={form.id}>
      <ul>
        {tasks.map((task) => (
          <li key={task.key}>
            {/* Set the name to `task[0]`, `tasks[1]` etc */}
            <input name={task.name} />
            <div>{task.errors}</div>
          </li>
        ))}
      </ul>
    </form>
  );
}
```

## Nested Array

You can also combine both `getFieldset()` and `getFieldList()` for nested array.

```tsx
import { useForm } from '@conform-to/react';

function Example() {
  const [form, fields] = useForm();
  const todos = fields.todos.getFieldList();

  return (
    <form id={form.id}>
      <ul>
        {todos.map((todo) => {
          const todoFields = todo.getFieldset();

          return (
            <li key={todo.key}>
              <input name={todoFields.title.name} />
              <div>{todoFields.title.errors}</div>
              <input name={todoFields.notes.name} />
              <div>{todoFields.notes.errors}</div>
            </li>
          );
        })}
      </ul>
    </form>
  );
}
```
