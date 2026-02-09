# PreserveBoundary

> The `PreserveBoundary` component is part of Conform's future export. These APIs are experimental and may change in minor versions. [Learn more](https://github.com/edmundhung/conform/discussions/954)

A React component that preserves form field values during client-side navigation when React unmounts its contents. Useful for multi-step wizards, form dialogs, and virtualized lists where fields are temporarily hidden but should still be included in form submission.

```tsx
import { PreserveBoundary } from '@conform-to/react/future';

{
  step === 1 ? (
    <PreserveBoundary name="step-1">
      <input name="name" />
      <input name="email" />
    </PreserveBoundary>
  ) : step === 2 ? (
    <PreserveBoundary name="step-2">
      <input name="address" />
      <input name="city" />
    </PreserveBoundary>
  ) : null;
}
```

## Props

### `name: string`

A unique name for the boundary within the form. This is used to:

1. Ensure proper unmount/remount behavior when switching between boundaries in conditional rendering
2. Isolate preserved inputs so they don't conflict with inputs from other boundaries

### `form?: string`

The id of the form to associate with. Only needed when the boundary is rendered outside the form element:

```tsx
<form id="my-form">
  <button type="submit">Submit</button>
</form>;
{
  /* Boundary outside the form */
}
<PreserveBoundary name="external" form="my-form">
  <input name="field" />
</PreserveBoundary>;
```

## Examples

### Multi-step form

```tsx
import { useForm, PreserveBoundary } from '@conform-to/react/future';
import { useState } from 'react';

function MultiStepForm() {
  const [step, setStep] = useState(1);
  const { form, fields } = useForm();

  return (
    <form {...form.props}>
      {step === 1 ? (
        <PreserveBoundary name="step-1">
          <label>
            Name
            <input
              name={fields.name.name}
              defaultValue={fields.name.defaultValue}
            />
          </label>
          <label>
            Email
            <input
              name={fields.email.name}
              defaultValue={fields.email.defaultValue}
            />
          </label>
        </PreserveBoundary>
      ) : step === 2 ? (
        <PreserveBoundary name="step-2">
          <label>
            Address
            <input
              name={fields.address.name}
              defaultValue={fields.address.defaultValue}
            />
          </label>
          <label>
            City
            <input
              name={fields.city.name}
              defaultValue={fields.city.defaultValue}
            />
          </label>
        </PreserveBoundary>
      ) : null}

      <div>
        {step > 1 ? (
          <button type="button" onClick={() => setStep(step - 1)}>
            Previous
          </button>
        ) : null}
        {step < 2 ? (
          <button type="button" onClick={() => setStep(step + 1)}>
            Next
          </button>
        ) : step === 2 ? (
          <button type="submit">Submit</button>
        ) : null}
      </div>
    </form>
  );
}
```

### Virtualized list

For virtualized lists, each item should use `name` with a stable identifier to ensure values are correctly associated with their items:

```tsx
import { useForm, PreserveBoundary } from '@conform-to/react/future';
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualizedItemList({ items }) {
  const { form, fields } = useForm({
    defaultValue: { items },
  });

  const parentRef = useRef(null);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  const itemFields = fields.items.getFieldList();

  return (
    <form {...form.props}>
      <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
        <div
          style={{ height: virtualizer.getTotalSize(), position: 'relative' }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const itemField = itemFields[virtualRow.index];
            return (
              <div
                key={virtualRow.key}
                style={{
                  position: 'absolute',
                  top: virtualRow.start,
                  height: virtualRow.size,
                }}
              >
                <PreserveBoundary name={`item-${virtualRow.index}`}>
                  <input
                    name={itemField.name}
                    defaultValue={itemField.defaultValue}
                  />
                </PreserveBoundary>
              </div>
            );
          })}
        </div>
      </div>
      <button type="submit">Save All</button>
    </form>
  );
}
```

## Tips

### Only use for navigational conditions

The condition that unmounts a `PreserveBoundary` should be navigational (step changes, dialog open/close), not when the user is intentionally excluding data from the submission. Otherwise, the preserved values will still be submitted even when the user hides the field:

```tsx
// Don't do this: the discount code will still be submitted even when hidden
{
  hasDiscountCode && (
    <PreserveBoundary name="discount">
      <input name="discountCode" />
    </PreserveBoundary>
  );
}

// Do this instead: let the field unmount normally
{
  hasDiscountCode && <input name="discountCode" />;
}
```

### Stale values are cleaned up automatically

When the fields inside a boundary change based on external state, stale preserved values are automatically removed on remount. For example, if the user fills in `companyName`/`jobTitle` on step 2, goes back to step 1, and switches account type to "personal", the preserved business fields are removed when step 2 remounts:

```tsx
{
  step === 1 ? (
    <PreserveBoundary name="step-1">
      <select name="accountType">
        <option value="personal">Personal</option>
        <option value="business">Business</option>
      </select>
    </PreserveBoundary>
  ) : step === 2 ? (
    <PreserveBoundary name="step-2">
      {accountType === 'personal' ? (
        <input name="dateOfBirth" type="date" />
      ) : accountType === 'business' ? (
        <>
          <input name="companyName" />
          <input name="jobTitle" />
        </>
      ) : null}
    </PreserveBoundary>
  ) : null;
}
```
