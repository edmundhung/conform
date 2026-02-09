---
'@conform-to/react': minor
---

Add `PreserveBoundary` component for preserving form values when fields are unmounted during client-side navigation (e.g., multi-step wizards, form dialogs, virtualized lists).

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
