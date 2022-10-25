# Remix Integration

This page shows you how to integrate conform with Remix. All examples works without JavaScript.

<!-- aside -->

## Table of Contents

- [Basic setup](#basic-setup)
- [Server validation with Zod](#server-validation-with-zod)
- [Client validation with fallback](#client-validation-with-fallback)

<!-- /aside -->

## Basic setup

To begin, let's build a basic login form with Remix.

<!-- sandbox src="/examples/remix-run?initialpath=/basic" -->

Try it out on [Codesandbox](https://codesandbox.io/s/github/edmundhung/conform/tree/main/examples/remix-run?initialpath=/basic&file=/app/routes/basic.tsx&runonclick=1).

<!-- /sandbox -->

## Server validation with Zod

Hand writting validation is error-prone. How about using **Zod**?

<!-- sandbox src="/examples/remix-run?initialpath=/zod" -->

Try it out on [Codesandbox](https://codesandbox.io/s/github/edmundhung/conform/tree/main/examples/remix-run?initialpath=/zod&file=/app/routes/zod.tsx&runonclick=1).

<!-- /sandbox -->

## Client validation with fallback

Server validation is good enough for many cases. But we can further improve the UX by shorten the feedback loop with client validation.

<!-- sandbox src="/examples/remix-run?initialpath=/async-validation" -->

Try it out on [Codesandbox](https://codesandbox.io/s/github/edmundhung/conform/tree/main/examples/remix-run?initialpath=/async-validation&file=/app/routes/async-validation.tsx&runonclick=1).

<!-- /sandbox -->
