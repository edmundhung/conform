# Submission

**Conform** handles form data as a set of key/value pairs and this is usually constructed by using the [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData) API. This structure, however, does not have direct support of nested or array stucture. To resolve this, it adopts a naming convention to provides hints on how to properly transformed it into the desired structure with additonal metadata.

<!-- aside -->

## Table of Contents

- [Schema](#schema)
- [Configuration](#configuration)
  - [Manual setup](#manual-setup)
  - [Derived config](#derived-config)
- [Form Submitter](#form-submitter)
  - [Command button](#command-button)
  - [Built-in commands](#built-in-commands)
- [Demo](#demo)

<!-- /aside -->

## Schema

The convention **conform** adopted is similiar to how properties are accessed in JavaScript: `object.property` and `array[index]`. These notations could be nested and mixed together.

Once the name of the fields are configured properly, you can then [parse](/packages/conform-react/README.md#parse) the form data and access the value from `submission.value`.

```tsx
import { parse } from '@conform-to/react';

const formData = new FormData(formElement);
const submission = parse(formData);

console.log(submission.value);
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

It can be setup manually:

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
            {/* repeat with tasks[1], tasks[2] and so on */}
          </li>
        </ul>
      </fieldset>
      <button type="submit">Save</button>
    </form>
  );
}
```

### Derived config

However, naming fields manually might be error-prone, especailly when you are dealing with complex structure. You can also use the derived name provided by [useFieldset](/packages/conform-react/README.md#usefieldset) and [useFieldList](/packages/conform-react/README.md#usefieldlist) with optional type hints.

```tsx
export default function TodoForm() {
  // Define the shape of the schema as `Todo`
  const form = useForm<Todo>();

  // It warns if you are accessing fields other than title and tasks
  const { title, tasks } = useFieldset(form.ref, form.config);

  // The hook will warn if the shape of tasks is not an array
  const [taskList, control] = useFieldList(form.ref, tasks.config);

  return (
    <form {...form.props}>
      <fieldset>
        <label>
          <div>Title</div>
          <input type="text" name={title.config.name} required />
        </label>
        <ul>
          {taskList.map((task, index) => (
            <li key={task.key}>
              <TaskFieldset title={`Task #${index + 1}`} {...task.config} />
            </li>
          ))}
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

## Form submitter

Similar to input, a submit button can also contribute to the form data when provided a _name_ and _value_ . It will be added to the final form data only when it is the [submitter](https://developer.mozilla.org/en-US/docs/Web/API/SubmitEvent/submitter). i.e. being clicked

<details>
<summary>Why is the submitter data not included in the FormData object?</summary>

Unfortunately, the FormData API is not able to capture the submitter information for us and requires some manipulations to mimick the browser behaviour. Because of this, **Conform** provides the modified formData to you as well.

```tsx
function Product() {
  const form = useForm({
    onSubmit(event, { formData }) {
      event.preventDefault();

      // This will log `null`
      console.log(new FormData(event.currentTarget).get('action'));

      // This will log `bookmark`
      console.log(formData.get('action'));
    },
  });

  return (
    <form>
      <button type="submit" name="action" value="bookmark">
        Bookmark
      </button>
    </form>
  );
}
```

</details>

### Command button

The submitter value makes it possible to extends the form with different behaviour based on the intent added to the form data.

```tsx
function Product() {
  return (
    <form>
      <input type="hidden" name="productId" value="rf23g43" />
      <button type="submit" name="intent" value="add-to-cart">
        Add to Cart
      </button>
      <button type="submit" name="intent" value="buy-now">
        Buy now
      </button>
    </form>
  );
}
```

However, this also means we are poluting the form data with information that are used for controlling the behaviour of the form only.

**Conform** specializes this pattern by referring it as **Command button**. If the submitter name is prefixed with `conform/` (e.g. _conform/submit_), it will be excluded from the structured data (i.e. `submission.value`) with `submission.context` being _submit_ and `submission.intent` being _add-to-cart_ or _buy-now_.

```tsx
import { useForm } from '@conform-to/react';

function Product() {
  const form = useForm({
    onSubmit(event, { submission }) {
      event.preventDefault();

      // This will log `submit`
      console.log(submission.context);

      // This will log `add-to-cart` or `buy-now`
      console.log(submission.intent);

      // This will log `{ productId: 'rf23g43' }`
      console.log(submission.value);
    },
  });

  return (
    <form {...form.props}>
      <input type="hidden" name="productId" value="rf23g43" />
      <button type="submit" name="conform/submit" value="add-to-cart">
        Add to Cart
      </button>
      <button type="submit" name="conform/submit" value="buy-now">
        Buy now
      </button>
    </form>
  );
}
```

### Built-in commands

Command button is also used internally. For example, [useFieldList](/packages/conform-react/README.md#usefieldlist) works by introducing a set of command buttons with `submission.context` being **list**:

```tsx
export default function Todos() {
  const form = useForm();
  const { title, tasks } = useFieldset<Todo>(form.ref, form.config);
  const [taskList, command] = useFieldList(form.ref, tasks.config);

  return (
    <form {...form.props}>
      <fieldset>
        <label>
          <div>Title</div>
          <input type="text" name="title" required />
        </label>
        <ul>
          {taskList.map((task, index) => (
            <li key={task.key}>
              <TaskFieldset title={`Task #${index + 1}`} {...task.config} />
              <button {...command.remove({ index })}>Delete</button>
              <button {...command.reorder({ from: index, to: 0 })}>
                Move to top
              </button>
              <button
                {...command.replace({ index, defaultValue: { content: '' } })}
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

Valdation is also done through command buttons. For details, please check the [Validation](./validation) section.

## Demo

<!-- sandbox src="/examples/todos" -->

Try it out on [Codesandbox](https://codesandbox.io/s/github/edmundhung/conform/tree/main/examples/todos).

<!-- /sandbox -->
