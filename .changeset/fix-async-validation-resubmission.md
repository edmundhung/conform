---
'@conform-to/dom': patch
'@conform-to/react': patch
---

fix: preserve native form submission after async client validation

Conform previously re-dispatched the submit event as soon as async client validation resolved, but the browser could still ignore that follow-up native submission. It is now resumed on the next task so the original native form submission can continue correctly.
