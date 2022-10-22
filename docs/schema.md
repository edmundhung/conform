# Schema

In this section, we will cover how to construct nested data structure by following the naming convention.

<!-- aside -->

## Table of Contents

- [Naming convention](#naming-convention)
- [Configuration](#configuration)
  - [Manual setup](#manual-setup)
  - [Derived config](#derived-config)
- [Demo](#demo)

<!-- /aside -->

## Naming convention

Conform utilise a naming definition similiar to how properties are accessed in JavaScript:
(1) `object.propertyName` and `array[index]`. The dot and square bracket notation could be nested as many levels as you need and mixed together.

Once the name of the fields are configured properly, you can just access the value from `submission.value`:

```tsx
import { useForm, createSubmission } from '@conform-to/react';

export default function TodoList() {
  const formProps = useForm({
    onSubmit(event, { submission }) {
      event.preventDefault();

      console.log(submission.value);
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
  const form = useForm();

  return (
    <form {...form.props}>
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
  const form = useForm();
  const { title, tasks } = useFieldset<Todo>(form.ref);

  return (
    <form {...form.props}>
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

## Demo

<!-- sandbox src="/docs/examples/nested" -->

Try it out on [Codesandbox](https://codesandbox.io/s/github/edmundhung/conform/tree/main/docs/examples/nested).

<!-- /sandbox -->
