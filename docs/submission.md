# Submission

Submission is basically form data utilizing **Conform**'s naming convention.

<!-- aside -->

## Table of Contents

- [Data structure](#data-structure)
  - [Configuration](#configuration)
- [Form Submitter](#form-submitter)
  - [Command button](#command-button)
  - [Built-in commands](#built-in-commands)
- [Demo](#demo)

<!-- /aside -->

## Data structure

**Conform** uses `object.property` and `array[index]` to define the data structure. These notations could be nested and mixed together.

Just [parse](/packages/conform-react/README.md#parse) the form data and you will be able to access value with the defined structure through `submission.value`.

```ts
import { parse } from '@conform-to/react';

const formData = new FormData();
const submission = parse(formData);

console.log(submission.value);
```

If the form data is malformed (i.e. Some entries violate the naming convention), any errors will be caught internally and you can access it through `submission.error`.

### Configuration

There are 2 approaches to configure the input name. For example, if we are building a todo list with the following schemas:

```tsx
interface Task {
  content: string;
  completed: boolean;
}

interface TodoList {
  title: string;
  tasks: Task[];
}
```

To setup manually:

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
          {/* repeat with tasks[1], tasks[2] and so on */}
        </ul>
      </fieldset>
      <button type="submit">Save</button>
    </form>
  );
}
```

Configuring fields' name manually might be error-prone. You can also use the derived config provided by [useFieldset](/packages/conform-react/README.md#usefieldset) and [useFieldList](/packages/conform-react/README.md#usefieldlist).

```tsx
export default function TodoForm() {
  /**
   * For better type-safety, you can also provide a schema to `useForm`
   */
  const form = useForm<Todo>();

  /**
   * useFieldset handles object structure. It warns if you are
   * accessing fields not defined in the schema
   */
  const { title, tasks } = useFieldset(form.ref, form.config);

  /**
   * useFieldList handles array structure. It warns if the shape
   * of field provided is not an array
   */
  const [taskList, command] = useFieldList(form.ref, tasks.config);

  return (
    <form {...form.props}>
      <fieldset>
        <label>
          <div>Title</div>
          {/* Configuring the input with the derived name */}
          <input type="text" name={title.config.name} required />
        </label>
        <ul>
          {taskList.map((task, index) => (
            <li key={task.key}>
              {/* Pass the dervied config down the tree */}
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
  /**
   * If `form.ref` is not accessible, you can use a fieldset ref instead
   */
  const ref = useRef<HTMLFieldSetElement>(null);
  /**
   * The task config will be picked up by the `useFieldset` again
   * and derived config based on the field
   */
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

Similar to inputs, a submit button can also contribute to the form data when provided a _name_ and _value_ . It will be added to the final form data if it is the [submitter](https://developer.mozilla.org/en-US/docs/Web/API/SubmitEvent/submitter). i.e. The button that triggered the submit event

<details>
<summary>Why is the submitter value not included with `new FormData()`?</summary>

Unfortunately, the FormData API is not able to capture the submitter information directly and requires manipulations to mimick the browser behaviour. Because of this, **Conform** provides the modified formData to you as well.

```tsx
function Product() {
  const form = useForm({
    onSubmit(event, { formData }) {
      event.preventDefault();

      // This will log `null`
      console.log(new FormData(event.currentTarget).get('intent'));

      // This will log `bookmark`
      console.log(formData.get('intent'));
    },
  });

  return (
    <form>
      <button type="submit" name="intent" value="bookmark">
        Bookmark
      </button>
    </form>
  );
}
```

</details>

### Command button

The submitter value allows us extending the form with different behaviour based on the intent.

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

However, this polutes the form data with information that are used for controlling the behaviour of the form only.

**Conform** specializes this pattern by referring it as **Command button**. If the submitter name is prefixed with `conform/` (e.g. _conform/submit_), it will be excluded from the structured value with `submission.context` being _submit_ and `submission.intent` being _add-to-cart_ or _buy-now_.

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

Command button is also used by **conform** internally. For example, it validates the form by clicking on a button named `conform/validate` with the name of the field being the value. While [useFieldList](/packages/conform-react/README.md#usefieldlist) setup the command button with the name `conform/list` and value representing the intent.

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
          <input type="text" name={title.config.name} required />
        </label>
        <ul>
          {taskList.map((task, index) => (
            <li key={task.key}>
              <TaskFieldset title={`Task #${index + 1}`} {...task.config} />
              {/* Command button 1 */}
              <button {...command.remove({ index })}>Delete</button>
            </li>
          ))}
        </ul>
        <div>
          {/* Command button 2 */}
          <button {...control.append()}>Add task</button>
        </div>
      </fieldset>
      <button type="submit">Save</button>
    </form>
  );
}
```

## Demo

<!-- sandbox src="/examples/todos" -->

Try it out on [Codesandbox](https://codesandbox.io/s/github/edmundhung/conform/tree/main/examples/todos).

<!-- /sandbox -->
