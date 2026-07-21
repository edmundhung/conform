# React SPA Example

This example uses React 19, React Router 8 in declarative mode, Vite 8, and Zod 4. It demonstrates:

- [Basic form with manual validation](./src/routes/login.tsx)
- [Async validation](./src/routes/signup.tsx) ([with async schema](./src/routes/signup-async-schema.tsx))
- [Dynamic form with data persistence](./src/routes/todos.tsx)

## Client-side submission

This SPA handles submissions through the `onSubmit` option passed to `useForm`. Each handler prevents the native form submission, performs asynchronous work in the browser, then either updates the form state or navigates with React Router.

Try it out on [Stackblitz](https://stackblitz.com/github/edmundhung/conform/tree/main/examples/react-spa).
