# Astro Example

This example demonstrates how to integrate Conform with [Astro Actions](https://docs.astro.build/en/guides/actions/) and a hydrated React island.

- [Basic form with manual validation](./src/pages/login.astro)
- [Async validation](./src/pages/signup.astro) ([with async schema](./src/pages/signup-async-schema.astro))
- [Dynamic form with data persistence](./src/pages/todos.astro)

The key integration points are:

- Accept raw `FormData` in an Astro action and parse it with `parseSubmission()`
- Return a discriminated action payload: `{ success: true, redirectTo }` or `{ success: false, result }`
- Wrap `report()` inside the failure branch so the Conform result can be passed back into `lastResult`
- Read `Astro.getActionResult()` on the page and pass the result into a React component hydrated with `client:load`
- Use `actions.login.queryString` to keep the form submission on the current page for the no-JS fallback

Try it out on [Stackblitz](https://stackblitz.com/github/edmundhung/conform/tree/main/examples/astro).
