---
"@conform-to/dom": patch
"@conform-to/react": patch
---

fix: revert auto field value update

Revert #729 and #766

The auto field value update feature introduced in v1.2.0 has caused several critical issues with significant user impact. While I appreciate what they accomplished, I’ve realized the current solution isn't robust enough to handle all potential use cases. To minimize the impact on everyone, I believe it's best to revert these changes for now.
