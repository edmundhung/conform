---
'@conform-to/react': minor
---

feat: remove deprecated future APIs

In v1.16.0, we introduced [`configureForms`](https://conform.guide/api/react/future/configureForms) as a replacement for `FormOptionsProvider`. These deprecated future APIs are now removed in favor of the factory-based setup.

Removed these deprecated exports from `@conform-to/react/future`:

- `FormOptionsProvider` component
- `BaseMetadata` type
- `BaseErrorShape` type
- `CustomTypes` type
- `CustomMetadata` type
- `CustomMetadataDefinition` type

The deprecated `schema` option in the future `useForm` hook is also removed. If you were validating with a schema, pass the schema as the first argument: `useForm(schema, options)` instead of `useForm({ schema, ... })`.
