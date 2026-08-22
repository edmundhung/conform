# TanStack Start Example

This example demonstrates how to combine Conform with TanStack Start server
functions:

- [Basic form with manual validation](./src/routes/login.tsx)
- [Async validation](./src/routes/signup.tsx) ([with an async schema](./src/routes/signup-async-schema.tsx))
- [Dynamic form with data persistence](./src/routes/todos.tsx)
- [File uploads](./src/routes/file-upload.tsx) with `FormData` and native `File` values

Each route passes Conform's `FormData` to a TanStack Start server function with
`useServerFn`. The server function performs trusted validation and the mutation,
then its Conform submission report is applied back to the form. Redirects are
handled by `useServerFn`.

Try it out on [StackBlitz](https://stackblitz.com/github/edmundhung/conform/tree/main/examples/tanstack-start).
