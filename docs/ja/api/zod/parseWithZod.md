# parseWithZod

提供された zod スキーマを使用してフォームデータを解析し、送信内容の概要を返すヘルパーです。

```tsx
const submission = parseWithZod(payload, options);
```

## パラメータ

### `payload`

フォームの送信方法に応じて、 **FormData** オブジェクトまたは **URLSearchParams** オブジェクトのいずれかになります。

### `options`

#### `schema`

Zod スキーマ、または Zod スキーマを返す関数のいずれかです。

#### `async`

**safeParse** の代わりに zod スキーマから **safeParseAsync** メソッドを使用してフォームデータを解析したい場合は、 **true** に設定してください。

#### `errorMap`

フォームデータを解析する際に使用される zod の [エラーマップ](https://github.com/colinhacks/zod/blob/master/ERROR_HANDLING.md#contextual-error-map) です。

#### `formatError`

エラー構造をカスタマイズし、必要に応じて追加のメタデータを含めることができる関数です。

## 例

```tsx
import { parseWithZod } from '@conform-to/zod';
import { useForm } from '@conform-to/react';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string(),
});

function Example() {
  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
  });

  // ...
}
```

## Tips

### 自動型変換

Conform は空の値を除去し、スキーマを内省することでフォームデータを期待される型に強制し、追加の前処理ステップを注入します。以下のルールが適用されます:

1. 値が空の文字列 / ファイルである場合、スキーマに `undefined` を渡します。
2. スキーマが `z.string()` の場合、値をそのまま渡します。
3. スキーマが `z.number()` の場合、値をトリムして `Number` コンストラクタでキャストします。
4. スキーマが `z.boolean()` の場合、値が `on` に等しい場合には `true` として扱います。
5. スキーマが `z.date()` の場合、値を `Date` コンストラクタでキャストします。
6. スキーマが `z.bigint()` の場合、値を `BigInt` コンストラクタでキャストします。

この挙動は、スキーマ内で独自の `z.preprocess` ステップを設定することで上書きすることができます。

> 注意: v3.22 以降、 `z.preprocess` の挙動に関して Zod のリポジトリには複数のバグレポートがあります。例えば、 https://github.com/colinhacks/zod/issues/2671 および <br> https://github.com/colinhacks/zod/issues/2677 があります。問題を経験している場合は、v3.21.4 にダウングレードしてください。

```tsx
const schema = z.object({
  amount: z.preprocess((value) => {
    // 値が提供されていない場合は、 `undefined` を返します。
    if (!value) {
      return undefined;
    }

    // 書式をクリアして値を数値に変換します。
    return Number(value.trim().replace(/,/g, ''));
  }, z.number()),
});
```

### デフォルト値

Conform は常に空の文字列を削除し、それらを「undefined」にします。 `.transform()` をスキーマに追加して、代わりに返されるデフォルト値を定義します。

```tsx
const schema = z.object({
  foo: z.string().optional(), // string | undefined
  bar: z
    .string()
    .optional()
    .transform((value) => value ?? ''), // string
  baz: z
    .string()
    .optional()
    .transform((value) => value ?? null), // string | null
});
```
