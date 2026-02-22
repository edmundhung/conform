---
'@conform-to/dom': minor
---

The `stripEmptyValues` option on `parseSubmission` now defaults to `false`. Empty strings and files are now preserved in the parsed payload. The presence of an empty value can carry meaning (e.g. distinguishing **user cleared a field** from **field wasn't submitted**), and stripping them at the parsing layer loses that information.

This option is deprecated and will be removed in a future minor release. If you are using a schema library like Zod or Valibot, our integration already strips empty values for you during validation. So there is no need to use this option.
