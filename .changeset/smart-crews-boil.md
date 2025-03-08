---
'@conform-to/react': minor
'@conform-to/dom': minor
---

feat: form side effect

Conform will now run a side effect function to update the input value directly instead of relying on the React `key` prop. If you were passing a `key` prop to the input, you can now remove it.
