# Command

In this section, we will briefly introduce the Constraint Validation API and explain different approaches for applying validations.

<!-- aside -->

## Table of Contents

- [Constraint Validation](#constraint-validation)
- [Manual Validation](#manual-validation)
- [Demo](#demo)

<!-- /aside -->

## Dynamic list

Conform provides an additional hook [useFieldList](/packages/conform-react/README.md#usefieldlist) to handle dynamic list and setup control buttons:

```tsx
export default function TodoForm() {
  const form = useForm();
  const { title, tasks } = useFieldset<Todo>(form.ref);
  const [taskList, control] = useFieldList(form.ref, tasks.config);

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

Checkout the [remix](/docs/integrations/remix) example for a demo.
