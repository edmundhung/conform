---
'@conform-to/dom': minor
'@conform-to/react': minor
'@conform-to/valibot': minor
'@conform-to/zod': minor
---

chore: remove deprecated Future APIs from the `/future` exports

- The `stripEmptyValues` option from `parseSubmission()`, deprecated in [v1.18.0](https://github.com/edmundhung/conform/releases/tag/v1.18.0), is now removed.
- The `value` option from `report()`, deprecated in [v1.20.0](https://github.com/edmundhung/conform/releases/tag/v1.20.0), is now removed. Use `targetValue` instead.
- The `invalid` property from field and form metadata, deprecated in [v1.9.1](https://github.com/edmundhung/conform/releases/tag/v1.9.1), is now removed. Use `!valid` instead.
- The `getZodConstraint()` and `getValibotConstraint()` exports, deprecated in [v1.16.0](https://github.com/edmundhung/conform/releases/tag/v1.16.0), are now removed. Use `getConstraints()` instead.
