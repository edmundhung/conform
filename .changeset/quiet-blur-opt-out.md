---
'@conform-to/react': patch
---

Fix `event.preventDefault()` and `event.stopPropagation()` throwing in the `onBlur` and `onInput` handlers of the future `useForm`. Calling `preventDefault()` now skips validation for that event.
