# parseWithValibot

提供された valibot スキーマを使用してフォームデータを解析し、送信内容の概要を返すヘルパーです。

```tsx
const submission = parseWithValibot(payload, options);
```

## パラメータ

### `payload`

フォームの送信方法に応じて、 **FormData** オブジェクトまたは **URLSearchParams** オブジェクトのいずれかになります。

### `options.schema`

Valibot スキーマ、または Valibot スキーマを返す関数のいずれかです。

### `options.info`

フォームデータの解析時に使用される Valibot の[解析設定](<https://github.com/fabian-hiller/valibot/blob/main/website/src/routes/guides/(main-concepts)/parse-data/index.mdx#configuration>)および[言語の選択](<https://github.com/fabian-hiller/valibot/blob/main/website/src/routes/guides/(advanced)/internationalization/index.mdx#select-language>) を指定します。

### `options.disableAutoCoercion`

[自動強制変換](#自動強制変換)を無効にして、フォームデータの解析方法を自分で管理する場合は、**true** に設定します。

## 例

```tsx
import { parseWithValibot } from '@conform-to/valibot';
import { useForm } from '@conform-to/react';
import { pipe, string, email, object } from 'valibot';

const schema = object({
  email: pipe(string(), email()),
  password: string(),
});

function Example() {
  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema });
    },
  });

  // ...
}
```

## ヒント

### 自動強制変換

デフォルトでは、`parseWithValibot` は空の値を削除し、スキーマをイントロスペクトしてフォームの値を正しい型に強制し、内部的に [coerceFormValue](./coerceFormValue) ヘルパーを使用して追加の前処理ステップを挿入します。

この動作をカスタマイズする場合は、`options.disableAutoCoercion` を `true` に設定して自動強制変換を無効にし、自分で管理できます。

```tsx
import { parseWithValibot } from '@conform-to/valibot';
import { useForm } from '@conform-to/react';
import { pipe, object, transform, unknown, number } from 'valibot';

const schema = object({
  // 空の値を削除し、自分で数値を強制します
  amount: pipe(
    unknown(),
    transform((value) => {
      if (typeof value !== 'string') {
        return value;
      }

      if (value === '') {
        return undefined;
      }

      return Number(value.trim().replace(/,/g, ''));
    }),
    number(),
  ),
});

function Example() {
  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithValibot(formData, {
        schema,
        disableAutoCoercion: true,
      });
    },
  });

  // ...
}
```
