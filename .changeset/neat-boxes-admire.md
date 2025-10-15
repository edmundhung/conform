---
'@conform-to/react': patch
---

Fixed an issue where React DevTools would throw an error when inspecting field metadata. The Proxy now handles symbol properties used by React internals gracefully.
