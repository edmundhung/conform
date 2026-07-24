---
'@conform-to/react': patch
---

Fix output inference for unrecognized schemas to fall back to `unknown` while preserving `undefined` when no schema is provided.
