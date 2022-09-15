# List

In this section, we will cover how to manage a dynamic list of fields with control buttons using the `useFieldList` hook and finally pack the data using the `createSubmission` API in the submit event handler.

<!-- aside -->

## Table of Contents

- [Naming convention](#naming-convention)
- [Configuration](#configuration)
  - [Manual setup](#manual-setup)
  - [Derived config](#derived-config)
- [Dynamic list](#dynamic-list)
  - [Control Buttons](#control-buttons)
- [Demo](#demo)

<!-- /aside -->

## Naming convention

Conform utilise a naming definition similiar to how array items are accessed in JavaScript: `array[index]`. The square bracket notation could be nested as many levels as you need and mixed with the dot notation for [nested data structure](../nested).

Once the name of the fields are configured properly, you will need to consturct a submission object using the `createSubmission()` API instead of `Object.fromEntries()`:

```tsx
import { useForm, createSubmission } from '@conform-to/react';

export default function PaymentForm() {
  const formProps = useForm({
    onSubmit(event) {
      event.preventDefault();

      const formData = new FormData(event.currentTarget);
      const submission = createSubmission(formData);

      console.log(submission);
    },
  });

  return <form {...formProps}>{/* ... */}</form>;
}
```

## Configuration

There are 2 approaches to setup the field name. For example, if we are building a todo list with the following schema:

```ts
interface Task {
  content: string;
  completed: boolean;
}

interface TodoList {
  title: string;
  tasks: Task[];
}
```

### Manual setup

It can be setup manually as below:

```tsx
export default function TodoForm() {
  const formProps = useForm();

  return (
    <form {...formProps}>
      <fieldset>
        <label>
          <div>Title</div>
          <input type="text" name="title" required />
        </label>
        <ul>
          <li>
            <fieldset>
              <label>
                <span>{title}</span>
                <input type="text" name="tasks[0].content" required />
              </label>
              <div>
                <label>
                  <span>Completed</span>
                  <input
                    type="checkbox"
                    name="tasks[0].completed"
                    value="yes"
                  />
                </label>
              </div>
            </fieldset>
          </li>
          <li>
            <fieldset>
              <label>
                <span>{title}</span>
                <input type="text" name="tasks[1].content" required />
              </label>
              <div>
                <label>
                  <span>Completed</span>
                  <input
                    type="checkbox"
                    name="tasks[1].completed"
                    value="yes"
                  />
                </label>
              </div>
            </fieldset>
          </li>
        </ul>
      </fieldset>
      <button type="submit">Save</button>
    </form>
  );
}
```

### Derived config

Alternatively, there is also dervied config provided by [useFieldset](/packages/conform-react/README.md#usefieldset):

```tsx
export default function TodoForm() {
  const formProps = useForm();
  const { title, tasks } = useFieldset<Todo>(formProps.ref);

  return (
    <form {...formProps}>
      <fieldset>
        <label>
          <div>Title</div>
          <input type="text" name="title" required />
        </label>
        <ul>
          <li>
            <TaskFieldset title="Task #1" name={`${tasks.config.name}[0]`} />
          </li>
          <li>
            <TaskFieldset title="Task #2" name={`${tasks.config.name}[1]`} />
          </li>
        </ul>
      </fieldset>
      <button type="submit">Save</button>
    </form>
  );
}

export function TaskFieldset({ title, ...config }: TaskFieldsetProps) {
  const ref = useRef<HTMLFieldSetElement>(null);
  const { content, completed } = useFieldset(ref, config);

  return (
    <fieldset ref={ref}>
      <label>
        <span>{title}</span>
        <input type="text" name={content.config.name} required />
      </label>
      <div>
        <label>
          <span>Completed</span>
          <input type="checkbox" name={completed.config.name} value="yes" />
        </label>
      </div>
    </fieldset>
  );
}
```

## Dynamic list

Conform provides an additional hook [useFieldList](/packages/conform-react/README.md#usefieldlist) to handle dynamic list and setup control buttons:

```tsx
export default function TodoForm() {
  const formProps = useForm();
  const { title, tasks } = useFieldset<Todo>(formProps.ref);
  const [taskList, control] = useFieldList(formProps.ref, tasks.config);

  return (
    <form {...formProps}>
      <fieldset>
        <label>
          <div>Title</div>
          <input type="text" name="title" required />
        </label>
        <ul>
          {taskList.map((task, index) => (
            <li key={task.key}>
              <TaskFieldset title={`Task #${index + 1}`} {...task.config} />
              <button {...control.remove({ index })}>Delete</button>
              <button {...control.reorder({ from: index, to: 0 })}>
                Move to top
              </button>
              <button
                {...control.replace({ index, defaultValue: { content: '' } })}
              >
                Clear
              </button>
            </li>
          ))}
        </ul>
      </fieldset>
      <button type="submit">Save</button>
    </form>
  );
}
```

### Control Buttons

Currently, there are **5** commands supported:

```tsx
// To append a new row with optional defaultValue
<button {...controls.append({ defaultValue })}>Append</button>;

// To prepend a new row with optional defaultValue
<button {...controls.prepend({ defaultValue })}>Prepend</button>;

// To remove a row by index
<button {...controls.remove({ index })}>Remove</button>;

// To replace a row with another defaultValue
<button {...controls.replace({ index, defaultValue })}>Replace</button>;

// To reorder a particular row to an another index
<button {...controls.reorder({ from, to })}>Reorder</button>;
```

These commands are built with progressive enhancement in mind and work regradless of JavaScript is enabled or not.

Checkout the [remix](/examples/remix) example for a demo.

## Demo

> [Codesandbox](https://codesandbox.io/s/github/edmundhung/conform/tree/main/examples/list) \| [Stackblitz](https://stackblitz.com/github/edmundhung/conform/tree/main/examples/list)
