---
'@conform-to/react': minor
---

feat: allow submit and form intents to share a field name

`resolveSubmission()` now lets submit intents and form intents share the same `intentName`. Plain intent values are preserved as submit intent payloads:

```ts
// submission.intent === 'delete'
resolveSubmission(submission).intent;
// { type: 'submit', payload: 'delete' }
```

Registered form intents continue to resolve through their handlers, while invalid form intents resolve to `undefined`.
