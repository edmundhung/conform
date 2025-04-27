# Installation

To use Conform, you need to install it along with the schema library you want to support.

## Zod

If you are using [Zod](https://zod.dev/), install the validation helper library that supports Zod schemas.

```bash
npm install @conform-to/react @conform-to/zod zod
```

To validate FormData, use `parseWithZod`.

```ts
import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string(),
  password: z.string(),
});

function ExampleForm() {
  const [form, { email, password }] = useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema,
      });
    },
  });

  // ...
}
```

## Valibot

If you are using [Valibot](https://valibot.dev/), install the validation helper library that supports Valibot schemas.

```bash
npm install @conform-to/react @conform-to/valibot valibot
```

To validate FormData, use `parseWithValibot`.

```ts
import { useForm } from '@conform-to/react';
import { parseWithValibot } from '@conform-to/valibot';
import { object, string } from 'valibot';

const schema = object({
  email: string(),
  password: string(),
});

function ExampleForm() {
  const [form, { email, password }] = useForm({
    onValidate({ formData }) {
      return parseWithValibot(formData, {
        schema,
      });
    },
  });

  // ...
}
```

## Yup

If you are using [Yup](https://github.com/jquense/yup), install the validation helper library that supports Yup schemas.

```bash
npm install @conform-to/react @conform-to/yup yup
```

To validate FormData, use `parseWithYup`.

```ts
import { useForm } from '@conform-to/react';
import { parseWithYup } from '@conform-to/yup';
import * as yup from 'yup';

const schema = yup.object({
  email: yup.string(),
  password: yup.string(),
});

function ExampleForm() {
  const [form, { email, password }] = useForm({
    onValidate({ formData }) {
      return parseWithYup(formData, {
        schema,
      });
    },
  });

  // ...
}
```
