---
'@conform-to/zod': patch
---

fix(zod): restore `minLength`, `maxLength`, `pattern`, `min`, `max` and `accept` constraints on Zod 4.6

Zod 4.6 no longer writes check metadata to `schema._zod.bag`, so `getZodConstraint` and `getConstraints` dropped every bound derived from checks. Constraints are now folded from the schema's check definitions, keeping the tightest bound when a check is repeated, and the bag is still read so older Zod versions and third-party checks keep working.
