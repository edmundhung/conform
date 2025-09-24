---
'@conform-to/react': minor
---

Simplified type signatures by removing the Metadata generic parameter:

- `FormMetadata<ErrorShape = string>` (previously `FormMetadata<ErrorShape, Metadata>`)
- `FieldMetadata<FieldShape, ErrorShape = string>` (previously `FieldMetadata<FieldShape, Metadata>`)
- `Fieldset<FieldShape, ErrorShape = string>` (previously `Fieldset<FieldShape, Metadata>`)

The `Metadata` generic parameter has been removed from all three types and replaced with a more specific `ErrorShape` parameter for `FieldMetadata` and `Fieldset`.
