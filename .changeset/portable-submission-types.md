---
'@conform-to/valibot': patch
'@conform-to/yup': patch
'@conform-to/zod': patch
---

fix: prevent non-portable inferred submission types in TypeScript 5.9+

The stable schema adapters now re-export Submission and SubmissionResult. This
prevents TS2742 and TS2883 when TypeScript emits declarations for inferred
action return types with strict dependency layouts such as pnpm.
