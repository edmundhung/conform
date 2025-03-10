# unstable_coerceFormValue

空の値を取り除き、フォーム値を期待される型に変換するための追加の前処理ステップでスキーマを強化するヘルパー関数です。

```ts
const enhancedSchema = coerceFormValue(schema, options);
```

デフォルトでは、以下のルールが適用されます：

1. 値が空の文字列/ファイルの場合、スキーマに `undefined` を渡します
2. スキーマが `v.number()` の場合、値をトリムして `Number` コンストラクタでキャストします
3. スキーマが `v.boolean()` の場合、値が `on`（ブラウザのチェックボックス/ラジオボタンのデフォルト `value`）と等しい場合、`true` として扱います
4. スキーマが `v.date()` の場合、値を `Date` コンストラクタでキャストします
5. スキーマが `v.bigint()` の場合、値を `BigInt` コンストラクタでキャストします

## パラメータ

### `schema`

拡張するvalibotスキーマ。

### `options.defaultCoercion`

[デフォルトの動作をオーバーライド](#デフォルトの動作をオーバーライドする)したい場合に設定します。

### `options.defineCoercion`

特定のスキーマに対して[カスタム変換を定義](#カスタム変換を定義する)するために使用します。

## 例

```ts
import { parseWithValibot, unstable_coerceFormValue as coerceFormValue } from '@conform-to/valibot';
import { useForm } from '@conform-to/react';
import { object, string, date, number, boolean } from 'valibot';
import { jsonSchema } from './jsonSchema';

const schema = coerceFormValue(
  object({
    ref: string()
    date: date(),
    amount: number(),
    confirm: boolean(),
  }),
);

function Example() {
  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithValibot(formData, {
        schema,
        defaultTypeCoercion: false,
      });
    },
  });

  // ...
}
```

## ヒント

### デフォルトの動作をオーバーライドする

オプションで `defaultCoercion` マッピングを指定することで、デフォルトの変換をオーバーライドできます。

```ts
const schema = coerceFormValue(
  object({
    // ...
  }),
  {
    defaultCoercion: {
      // `string()` のデフォルト変換をオーバーライドする
      string: (value) => {
        if (typeof value !== 'string') {
          return value;
        }

        const result = value.trim();

        // 値が空の場合は `undefined` として扱う
        if (result === '') {
          return undefined;
        }

        return result;
      },

      // `number()` のデフォルト変換をオーバーライドする
      number: (value) => {
        // 文字列でない場合はそのまま値を渡す
        if (typeof value !== 'string') {
          return value;
        }

        // 数値にキャストする前に、トリムしてカンマを削除する
        return Number(value.trim().replace(/,/g, ''));
      },

      // `boolean()` の変換を無効にする
      boolean: false,
    },
  },
);
```

### デフォルト値

`coerceFormValue` は常に空の値を `undefined` に変換します。デフォルト値が必要な場合は、`optional()` を使用して代わりに返されるフォールバック値を定義します。

```ts
const schema = object({
  foo: optional(string()), // string | undefined
  bar: optional(string(), ''), // string
  baz: optional(nullable(optional()), null), // string | null
});
```

### カスタム変換を定義する

`defineCoercion` オプションを設定することで、特定のスキーマに対してカスタム変換を定義できます。

```ts
import {
  parseWithValibot,
  unstable_coerceFormValue as coerceFormValue,
} from '@conform-to/valibot';
import { useForm } from '@conform-to/react';
import { object, string, number, boolean } from 'valibot';
import { json } from './schema';

const metadata = object({
  number: number(),
  confirmed: boolean(),
});

const schema = coerceFormValue(
  object({
    ref: string(),
    metadata,
  }),
  {
    defineCoercion(schema) {
      // `metadata` フィールドの値がどのように変換されるかをカスタマイズする
      if (schema === metadata) {
        return (value) => {
          if (typeof value !== 'string') {
            return value;
          }

          // 値をJSONとしてパースする
          return JSON.parse(value);
        };
      }

      // デフォルトの動作を維持するために `null` を返す
      return null;
    },
  },
);
```
