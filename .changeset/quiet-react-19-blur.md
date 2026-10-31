---
'@conform-to/dom': patch
---

Fix server errors being cleared on React 19 when a field is blurred without changes. React 19 resets each input's `name` while re-rendering, which Conform mistook for a value change, so revalidating on blur replaced errors from the server with the client result.
