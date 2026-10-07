---
'@conform-to/react': patch
---

Fix `event.preventDefault()` throwing in the `onBlur` and `onInput` handlers of the future `useForm`. Calling it now skips validation for that event.
