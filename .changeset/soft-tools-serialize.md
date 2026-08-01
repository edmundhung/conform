---
'@conform-to/react': minor
---

feat: add intent serialization to intent dispatchers

Intent dispatcher methods now expose a `serialize()` method with the same arguments. Use the returned value with `form.intentName` on a native submit button to trigger form intents for progressive enhancement.
