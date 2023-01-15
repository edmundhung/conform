## Commands

A submit button can contribute to the form data when it triggers the submission as a [submitter](https://developer.mozilla.org/en-US/docs/Web/API/SubmitEvent/submitter).

## On this page

- [Command button](#command-button)
- [Modifying a list](#modifying-a-list)
- [Validation](#validation)
- [Triggering a command](#triggering-a-command)

### Command button

The submitter allows us to extend the form with different behaviour based on the intent. However, it also polutes the form data with information used for controlling form behaviour only.

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

**Conform** refers this pattern as a **command button**. If you name the button with a prefix `conform/`, e.g. `conform/submit`, its name and value will be used to populate the type and intent of the submission instead of the form value.

```tsx
import { useForm } from '@conform-to/react';

function Product() {
  const [form] = useForm({
    onSubmit(event, { submission }) {
      event.preventDefault();

      // This will log `submit`
      console.log(submission.type);

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

### Modifying a list

Conform provides built-in [list](../packages/conform-react/README.md#list) command button builder for you to modify a list of fields.

```tsx
import { useForm, useFieldList, conform, list } from '@conform-to/react';

export default function Todos() {
  const [form, { tasks }] = useForm();
  const taskList = useFieldList(form.ref, tasks.config);

  return (
    <form {...form.props}>
      <ul>
        {taskList.map((task, index) => (
          <li key={task.key}>
            <input {...conform.input(task.config)} />
            <button {...list.remove(tasks.config.name, { index })}>
              Delete
            </button>
          </li>
        ))}
      </ul>
      <div>
        <button {...list.append(tasks.config.name)}>Add task</button>
      </div>
      <button>Save</button>
    </form>
  );
}
```

## Validation

A validation can be triggered by configuring a button with the [validate](../packages/conform-react/README.md#validate) command button builder.

```tsx
import { useForm, conform, validate } from '@conform-to/react';

export default function Todos() {
  const [form, { email }] = useForm();

  return (
    <form {...form.props}>
      <input {...conform.input(email.config)} />
      {/* Validating field by name */}
      <button {...validate(email.config.name)}>Validate email</button>
      {/* Validating the whole form */}
      <button {...validate()}>Validate</button>
      <button>Send</button>
    </form>
  );
}
```

## Triggering a command

Sometimes, it could be useful to trigger a command without requiring the users to click on the command button. We can do this by capturing the button element with `useRef` and trigger the command with `.click()`

```tsx
import { useForm, useFieldList, conform, list } from '@conform-to/react';
import { useEffect } from 'react';

export default function Todos() {
  const [form, { tasks }] = useForm();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const taskList = useFieldList(form.ref, tasks.config);

  useEffect(() => {
    if (taskList.length === 0) {
      // Ensure at least 1 task is shown
      // by clicking on the Add task button
      buttonRef.click();
    }
  }, [taskList.length]);

  return (
    <form {...form.props}>
      <ul>
        {taskList.map((task, index) => (
          <li key={task.key}>
            <input {...conform.input(task.config)} />
          </li>
        ))}
      </ul>
      <div>
        <button {...list.append(tasks.config.name)} ref={buttonRef}>
          Add task
        </button>
      </div>
      <button>Save</button>
    </form>
  );
}
```

However, if the command button can not be preconfigured easily, like drag and drop an item on the list with dynamic `from` / `to` index, it is also possible by using the [requestCommand](../packages/conform-react/README.md#requestCommand) helper.

```tsx
import {
  useForm,
  useFieldList,
  conform,
  list,
  requestCommand,
} from '@conform-to/react';
import DragAndDrop from 'awesome-dnd-example';

export default function Todos() {
  const [form, { tasks }] = useForm();
  const taskList = useFieldList(form.ref, tasks.config);

  const handleDrop = (from, to) =>
    requestCommand(form.ref.current, list.reorder({ from, to }));

  return (
    <form {...form.props}>
      <DragAndDrop onDrop={handleDrop}>
        {taskList.map((task, index) => (
          <div key={task.key}>
            <input {...conform.input(task.config)} />
          </div>
        ))}
      </DragAndDrop>
      <button>Save</button>
    </form>
  );
}
```

Conform also utilises this helper to trigger the validate command based on the event received and its event target, e.g. blur / input event on each field.
