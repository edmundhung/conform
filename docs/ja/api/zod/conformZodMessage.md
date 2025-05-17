# conformZodMessage

検証動作を制御するためのカスタムメッセージのセットです。これは、フィールドの一つに対して非同期検証が必要な場合に便利です。

## オプション

### `conformZodMessage.VALIDATION_SKIPPED`

このメッセージは、検証がスキップされ、 Conform が前回の結果を代わりに使用すべきであることを示すために使用されます。

### `conformZodMessage.VALIDATION_UNDEFINED`

このメッセージは、検証が定義されていないことを示し、 Conform がサーバー検証にフォールバックすべきであることを示すために使用されます。

## 例

以下は、メールアドレスがユニークであるかを検証するサインアップフォームの例です。

```tsx
import type { Intent } from '@conform-to/react';
import { useForm } from '@conform-to/react';
import { parseWithZod, conformZodMessage } from '@conform-to/zod'; // もしくは、zod/v4かzod/v4-miniを使用する場合は `@conform-to/zod/v4` をインポートします。
import { z } from 'zod';

  // スキーマを共有する代わりに、スキーマを作成する関数 `createSchema` を準備します。
  // `intent` は `parseWithZod` ヘルパーによって提供されます。
  intent: Intent | null,
  options?: {
    isEmailUnique: (email: string) => Promise<boolean>;
  },
) {
  return z
    .object({
      email: z
        .string()
        .email()
        // スキーマをパイプして、メールアドレスが有効な場合にのみ実行されるようにします。
        .pipe(
          z.string().superRefine((email, ctx) => {
            const isValidatingEmail =
              intent === null ||
              (intent.type === 'validate' && intent.payload.name === 'email');

            if (!isValidatingEmail) {
              ctx.addIssue({
                code: 'custom',
                message: conformZodMessage.VALIDATION_SKIPPED,
              });
              return;
            }

            if (typeof options?.isEmailUnique !== 'function') {
              ctx.addIssue({
                code: 'custom',
                message: conformZodMessage.VALIDATION_UNDEFINED,
                fatal: true,
              });
              return;
            }

            return options.isEmailUnique(email).then((isUnique) => {
              if (!isUnique) {
                ctx.addIssue({
                  code: 'custom',
                  message: 'Email is already used',
                });
              }
            });
          }),
        ),
    })
    .and(
      z
        .object({
          password: z.string({ required_error: 'Password is required' }),
          confirmPassword: z.string({
            required_error: 'Confirm password is required',
          }),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: 'Password does not match',
          path: ['confirmPassword'],
        }),
    );
}

export async function action({ request }) {
  const formData = await request.formData();
  const submission = await parseWithZod(formData, {
    schema: (intent) =>
      // インテントに基づいてzodスキーマを作成します。
      createSchema(intent, {
        isEmailUnique(email) {
          // データベースをクエリ
        },
      }),
    async: true,
  });

  if (submission.status !== 'success') {
    return submission.reply();
  }

  // ...
}

export default function Signup() {
  const lastResult = useActionData();
  const [form, fields] = useForm({
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, {
        // `isEmailUnique` が定義されていない状態でスキーマを作成します。
        schema: (intent) => createSchema(intent),
      });
    },
  });

  // ...
}
```
