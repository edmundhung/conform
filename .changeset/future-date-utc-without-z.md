---
'@conform-to/dom': minor
'@conform-to/zod': minor
'@conform-to/valibot': minor
---

feat: improve `datetime-local` Date handling in future APIs

Date values now serialize to datetime strings without a trailing `Z` (for example, `2026-01-01T12:00:00.000`). Our Zod and Valibot integration will also coerce timezone-less datetime strings as UTC by default.

This applies to future APIs only. No changes were made to v1 APIs to avoid breaking changes.
