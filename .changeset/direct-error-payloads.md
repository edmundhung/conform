---
'@conform-to/dom': minor
'@conform-to/react': minor
'@conform-to/zod': minor
'@conform-to/valibot': minor
---

feat: improve ErrorShape handling in future APIs

Previously, `form.errors` and `field.errors` were always arrays, even when you provided a custom `ErrorShape`. The future APIs now use `ErrorShape` as the final error shape directly, so custom validation can return a string or object without Conform wrapping it in another array.

You may need to update existing code in a few places:

If you were using a custom `ErrorShape`, either by specifying it in the generics or through the `isError` option from `configureForms`, update it from `ErrorShape` to `ErrorShape[]` to keep the array structure you had before. For example, if you previously used `string`, change it to `string[]` to keep the errors as arrays of strings:

```diff
const forms = configureForms({
-  isError: shape<string>(),
+  isError: shape<string[]>(),
});
```

`report()` now accepts either schema `issues` or an explicit error payload, but not both in the same `error` object. If you were using both to add more messages on top of schema validation, append another issue instead.

```diff
const result = schema.safeParse(submission.payload);
const isEmailUnique = await checkEmailUnique(submission.payload.email);

if (!result.success || !isEmailUnique) {
  const issues = !result.success ? [...result.error.issues] : [];

+ if (!isEmailUnique) {
+   issues.push({
+     message: 'Email is already taken',
+     path: ['email'],
+   });
+ }

  return {
    result: report(submission, {
      error: {
        issues,
-       fieldErrors: {
-         email: !isEmailUnique ? ['Email is already taken'] : [],
-       },
      },
    }),
  };
}
```
