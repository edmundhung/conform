---
'@conform-to/react': minor
'@conform-to/dom': minor
---

Introduces `parseSubmission` and `report` future APIs that decouple form data parsing from validation.

**`parseSubmission`** - Parses FormData/URLSearchParams into structured objects with nested data support. This is already used internally by the `isDirty` helper.
**`report`** - Creates submission results with validation errors and security features

This allows parsing forms independently of validation libraries and will eventually replace the existing `parse` helpers (e.g. `parseWithZod`) and `submission.report()`.
