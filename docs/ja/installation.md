# インストール

Conform を使用するにはサポートするスキーマライブラリに合わせてインストールする必要があります。

## Zod

[Zod](https://zod.dev/) を使用する場合はZod スキーマをサポートした検証ヘルパーライブラリを合わせてインストールします。

```bash
npm install @conform-to/react @conform-to/zod zod
```

FormDataの検証を行うには `parseWithZod` を使用します。

```ts
import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod'; // もしくは、zod/v4かzod/v4-miniを使用する場合は `@conform-to/zod/v4` をインポートします。
import { z } from 'zod'; // もしくは, zod/v4かzod/v4-mini

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

[Valibot](https://valibot.dev/) を使用する場合はValibot スキーマをサポートした検証ヘルパーライブラリを合わせてインストールします。

```bash
npm install @conform-to/react @conform-to/valibot valibot
```

FormDataの検証を行うには `parseWithValibot` を使用します。

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

[Valibot](https://github.com/jquense/yup) を使用する場合はYup スキーマをサポートした検証ヘルパーライブラリを合わせてインストールします。

```bash
npm install @conform-to/react @conform-to/yup yup
```

FormDataの検証を行うには `parseWithYup` を使用します。

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
