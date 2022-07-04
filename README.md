# Conform &middot; [![latest release](https://img.shields.io/github/v/release/edmundhung/conform?include_prereleases)](https://github.com/edmundhung/conform/releases) [![GitHub license](https://img.shields.io/github/license/edmundhung/conform)](https://github.com/edmundhung/conform/blob/main/LICENSE)

> The API is not yet stable. Expect breaking changes on minor versions before v1 (stable release).

Conform is a form validation library built on top of the [Constraint Validation](https://developer.mozilla.org/en-US/docs/Web/API/Constraint_validation) API. [[Can I use?](https://caniuse.com/constraint-validation)]

- Transferable knowledge: Conform relies on the Web API heavily. From configuring the constraint to validating by setting custom validity. If you don't like part of the solution, you can always replace it with your own solution.
- Schema-first: Define the data structure and map it to smaller individual fieldset, then compose them to make complex form. Conform aims at making easy form easy, complex form simple.
- Framework agnostic: The DOM is the only thing it depends on. At the end, it's just HTML &copy;

## Packages

| Name                                        | Description                                                                                     | Size                                                                                                                                |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| [@conform-to/dom](packages/conform-dom)     | A set of opinionated helpers interacting with the DOM elements                                  | [![package size](https://img.shields.io/bundlephobia/minzip/@conform-to/dom)](https://bundlephobia.com/package/@conform-to/dom)     |
| [@conform-to/react](packages/conform-react) | View adapter for [react](https://github.com/facebook/react), built on top of `@conform-to/dom`  | [![package size](https://img.shields.io/bundlephobia/minzip/@conform-to/react)](https://bundlephobia.com/package/@conform-to/react) |
| [@conform-to/zod](packages/conform-zod)     | Schema resolver integrating [zod](https://github.com/colinhacks/zod) for end-to-end type safety | [![package size](https://img.shields.io/bundlephobia/minzip/@conform-to/zod)](https://bundlephobia.com/package/@conform-to/zod)     |
