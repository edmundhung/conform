# Intent button

A submit button can contribute to the form data when it triggers the submission as a [submitter](https://developer.mozilla.org/en-US/docs/Web/API/SubmitEvent/submitter).

<!-- aside -->

## On this page

- [Submission Intent](#submission-intent)
- [Modifying a list](#modifying-a-list)
- [Validation](#validation)
- [Triggering a command](#triggering-a-command)

<!-- /aside -->

### Submission Intent

The submitter allows us to extend the form with different behaviour based on the intent. However, it pollutes the form value with data that are used to control form behaviour.

```tsx
import { useForm } from '@conform-to/react';

function Product() {
  const [form] = useForm({
    onSubmit(event, { submission }) {
      event.preventDefault();

      // This will log `{ productId: 'rf23g43', intent: 'add-to-cart' }`
      // or `{ productId: 'rf23g43', intent: 'buy-now' }`
      console.log(submission.payload);
    },
  });

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

In **Conform**, if the name of a button is configured with `conform.INTENT`, its value will be treated as the intent of the submission instead. Otherwise, the intent would be `submit` by default.

```tsx
import { useForm, conform } from '@conform-to/react';

function Product() {
  const [form] = useForm({
    onSubmit(event, { submission }) {
      event.preventDefault();

      // This will log `add-to-cart` or `buy-now`
      console.log(submission.intent);

      // This will log `{ productId: 'rf23g43' }`
      console.log(submission.payload);
    },
  });

  return (
    <form {...form.props}>
      <input type="hidden" name="productId" value="rf23g43" />
      <button type="submit" name={conform.INTENT} value="add-to-cart">
        Add to Cart
      </button>
      <button type="submit" name={conform.INTENT} value="buy-now">
        Buy now
      </button>
    </form>
  );
}
```

### Modifying a list

Conform provides built-in [list](/packages/conform-react/README.md#list) intent button builder for you to modify a list of fields.

```tsx
import { useForm, useFieldList, conform, list } from '@conform-to/react';

export default function Todos() {
  const [form, { tasks }] = useForm();
  const taskList = useFieldList(form.ref, tasks);

  return (
    <form {...form.props}>
      <ul>
        {taskList.map((task, index) => (
          <li key={task.key}>
            <input {...conform.input(task)} />
            <button {...list.remove(tasks.name, { index })}>Delete</button>
          </li>
        ))}
      </ul>
      <div>
        <button {...list.append(tasks.name)}>Add task</button>
      </div>
      <button>Save</button>
    </form>
  );
}
```

## Validation

A validation can be triggered by configuring a button with the [validate](/packages/conform-react/README.md#validate) intent button builder.

```tsx
import { useForm, conform, validate } from '@conform-to/react';

export default function Todos() {
  const [form, { email }] = useForm();

  return (
    <form {...form.props}>
      <input {...conform.input(email)} />
      {/* Validating field by name */}
      <button {...validate(email.name)}>Validate email</button>
      {/* Validating the whole form */}
      <button {...validate()}>Validate</button>
      <button>Send</button>
    </form>
  );
}
```

## Triggering an intent

Sometimes, it could be useful to trigger an intent without requiring users to click on the intent button. We can do this by capturing the button element with `useRef` and triggering the intent with `.click()`

```tsx
import { useForm, useFieldList, conform, list } from '@conform-to/react';
import { useEffect } from 'react';

export default function Todos() {
  const [form, { tasks }] = useForm();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const taskList = useFieldList(form.ref, tasks);

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
            <input {...conform.input(task)} />
          </li>
        ))}
      </ul>
      <div>
        <button {...list.append(tasks.name)} ref={buttonRef}>
          Add task
        </button>
      </div>
      <button>Save</button>
    </form>
  );
}
```

However, if the intent button can not be pre-configured easily, like drag and drop an item on the list with dynamic `from` / `to` index, an intent can be triggered by using the [requestIntent](/packages/conform-react/README.md#requestintent) helper.

```tsx
import {
  useForm,
  useFieldList,
  conform,
  list,
  requestIntent,
} from '@conform-to/react';
import DragAndDrop from 'awesome-dnd-example';

export default function Todos() {
  const [form, { tasks }] = useForm();
  const taskList = useFieldList(form.ref, tasks);

  const handleDrop = (from, to) =>
    requestIntent(form.ref.current, list.reorder({ from, to }));

  return (
    <form {...form.props}>
      <DragAndDrop onDrop={handleDrop}>
        {taskList.map((task, index) => (
          <div key={task.key}>
            <input {...conform.input(task)} />
          </div>
        ))}
      </DragAndDrop>
      <button>Save</button>
    </form>
  );
}
```

Conform also utilises this helper to trigger the validate intent based on the event received and its event target, e.g. blur / input event on each field.
