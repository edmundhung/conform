---
'@conform-to/react': patch
---

fix(conform-react): restore missing v1 metadata in future `useForm` hook

This restores form and field metadata that were present in v1 but accidentally omitted from the future `useForm` hook release:

- Add `key`, `errorId` and `descriptionId` properties to form metadata
- Add `valid` property to both form and field metadata with `invalid` deprecated and to be removed in 1.10.0
- Add `formId` property to field metadata
- Add `fieldErrors` to field metadata (renamed from v1's `allErrors`) with improvements:
  - Keys use relative paths scoped to the parent field instead of full field names
  - Excludes the current field's own errors (only includes child field errors)
