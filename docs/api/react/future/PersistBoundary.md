# PersistBoundary

> The `PersistBoundary` component is part of Conform's future export. These APIs are experimental and may change in minor versions. [Learn more](https://github.com/edmundhung/conform/discussions/954)

A React component that preserves form field values during client-side navigation when React unmounts its contents. Useful for multi-step wizards, form dialogs, and virtualized lists where fields are temporarily hidden but should still be included in form submission.

```tsx
import { PersistBoundary } from '@conform-to/react/future';

{
  step === 1 ? (
    <PersistBoundary name="step-1">
      <input name="name" />
      <input name="email" />
    </PersistBoundary>
  ) : step === 2 ? (
    <PersistBoundary name="step-2">
      <input name="address" />
      <input name="city" />
    </PersistBoundary>
  ) : null;
}
```

## Props

### `name: string`

A unique name for the boundary within the form. This is used to:

1. Ensure proper unmount/remount behavior when switching between boundaries in conditional rendering
2. Isolate persisted inputs so they don't conflict with inputs from other boundaries

When the boundary remounts, any persisted inputs with that name are automatically cleaned up, even if there's no matching field to restore to. This handles scenarios where the fields inside a boundary can change based on external state:

### `form?: string`

The id of the form to associate with. Only needed when the boundary is rendered outside the form element:

```tsx
<form id="my-form">
  <button type="submit">Submit</button>
</form>;

{
  /* Boundary outside the form */
}
<PersistBoundary name="external" form="my-form">
  <input name="field" />
</PersistBoundary>;
```

## Conditional fields

```tsx
{
  step === 1 ? (
    // Step 1: Account type selection
    <PersistBoundary name="step-1">
      <select name="accountType">
        <option value="personal">Personal</option>
        <option value="business">Business</option>
      </select>
    </PersistBoundary>
  ) : step === 2 ? (
    // Step 2: Fields depend on account type from step 1
    <PersistBoundary name="step-2">
      {accountType === 'personal' ? (
        <input name="dateOfBirth" type="date" />
      ) : accountType === 'business' ? (
        <>
          <input name="companyName" />
          <input name="jobTitle" />
        </>
      ) : null}
    </PersistBoundary>
  ) : null;
}
```

If the user fills in `companyName`/`jobTitle`, goes back to step 1, and switches to "personal", the persisted business fields are automatically removed when step 2 remounts. They won't be submitted with the form.

## Examples

### Multi-step form

```tsx
import { useForm, PersistBoundary } from '@conform-to/react/future';
import { useState } from 'react';

function MultiStepForm() {
  const [step, setStep] = useState(1);
  const { form, fields } = useForm();

  return (
    <form {...form.props}>
      {step === 1 ? (
        <PersistBoundary name="step-1">
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
        </PersistBoundary>
      ) : step === 2 ? (
        <PersistBoundary name="step-2">
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
        </PersistBoundary>
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
import { useForm, PersistBoundary } from '@conform-to/react/future';
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
                <PersistBoundary name={`item-${virtualRow.index}`}>
                  <input
                    name={itemField.name}
                    defaultValue={itemField.defaultValue}
                  />
                </PersistBoundary>
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

### Not for optional fields

Do not use `PersistBoundary` for optional fields that users choose to exclude. When a user unchecks a box to hide a field, they typically want that field excluded from submission:

```tsx
// Don't do this - the discount code will still be submitted even when hidden
{
  hasDiscountCode && (
    <PersistBoundary name="discount">
      <input name="discountCode" />
    </PersistBoundary>
  );
}

// Do this instead - let the field unmount normally
{
  hasDiscountCode && <input name="discountCode" />;
}
```
