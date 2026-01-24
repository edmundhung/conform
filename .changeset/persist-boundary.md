---
'@conform-to/react': minor
---

Add `PersistBoundary` component for persisting form values when fields are unmounted for rendering or navigation reasons (e.g., multi-step wizards, virtualized lists).

```tsx
import { PersistBoundary } from '@conform-to/react/future';

{
  step === 1 ? (
    <PersistBoundary>
      <input name="name" />
      <input name="email" />
    </PersistBoundary>
  ) : step === 2 ? (
    <PersistBoundary>
      <input name="address" />
      <input name="city" />
    </PersistBoundary>
  ) : null;
}
```
