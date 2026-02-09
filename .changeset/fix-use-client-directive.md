---
'@conform-to/react': patch
---

fix: add missing `'use client'` directive to internal modules

The build was not adding the `'use client'` directive to all internal modules that need it. This caused React Server Component frameworks to incorrectly treat parts of the package as server code, breaking applications that import from `@conform-to/react`.
