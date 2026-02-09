---
'@conform-to/dom': minor
'@conform-to/react': minor
'@conform-to/valibot': minor
'@conform-to/zod': minor
---

Add accept constraint for file inputs, so that MIME types specified in the schema can filter the filesystem dialog.

```tsx
import { configureForms } from '@conform-to/react/future';
import { getConstraints } from '@conform-to/zod/v4/future';
import type { InputHTMLAttributes } from 'react';

const configuredForms = configureForms({
  extendFieldMetadata(metadata) {
    return {
      get inputProps() {
        return {
          accept: metadata.accept, // new
          defaultValue: metadata.defaultValue,
          name: metadata.name,
          required: metadata.required,
        } satisfies InputHTMLAttributes<HTMLInputElement>;
      },
    };
  },
  getConstraints,
});
```
