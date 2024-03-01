# バリデーション

Conform は異なるバリデーションモードをサポートしています。このセクションでは、異なる要件に基づいてフォームをバリデーションする方法を説明します。

## サーバーバリデーション

フォームを**完全にサーバーサイドで**バリデーションすることができます。これはフォームの送信に限らず、ユーザーがタイピングしているときやフィールドを離れるときにも機能します。これにより、バリデーションロジックをクライアントバンドルから除外することができます。しかし、ユーザーがタイピングしている間にバリデーションを行いたい場合、ネットワークの遅延が懸念されるかもしれません。

```tsx
import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { z } from 'zod';

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const submission = parseWithZod(formData, {
    schema: z.object({
      email: z.string().email(),
      message: z.string().max(100),
    }),
  });

  if (submission.status !== 'success') {
    return submission.reply();
  }

  return await signup(data);
}

export default function Signup() {
  // サーバーによって返された最後の結果
  const lastResult = useActionData<typeof action>();
  const [form] = useForm({
    // 最後の送信の結果を同期する
    lastResult,

    // 各フィールドをいつ検証するかを設定する
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
  });

  // ...
}
```

## クライアントバリデーション

クライアントサイドでバリデーションロジックを再利用し、即時のフィードバックを提供することができます。

```tsx
import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';

// スキーマ定義をアクションの外に移動する
const schema = z.object({
  email: z.string().email(),
  message: z.string().max(100),
});

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema });

  // ...
}

export default function Signup() {
  const lastResult = useActionData<typeof action>();
  const [form] = useForm({
    lastResult,
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',

    // クライアント バリデーションの設定
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
  });

  // ...
}
```

## 非同期バリデーション

Conform は、少し異なる方法で非同期バリデーションをサポートしています。別のエンドポイントにリクエストを送る代わりに、必要に応じてサーバーバリデーションにフォールバックします。

以下は、メールアドレスがユニークであるかを検証する例です。

```tsx
import { refine } from '@conform-to/zod';

// スキーマを共有する代わりに、スキーマクリエーターを準備します。
function createSchema(
  options?: {
    isEmailUnique: (email: string) => Promise<boolean>;
  },
) {
  return z
    .object({
      email: z
        .string()
        .email()
        // メールアドレスが有効な場合にのみ実行されるようにスキーマをパイプします。
        .pipe(
          // 注意：ここでのコールバックは非同期にはできません。
          // クライアント上でzodのバリデーションを同期的に実行するためです。
          z.string().superRefine((email, ctx) => {
            // これにより、バリデーションが定義されていないことを示すことで、
            // Conformはサーバーバリデーションにフォールバックします。
            if (typeof options?.isEmailUnique !== 'function') {
              ctx.addIssue({
                code: 'custom',
                message: conformZodMessage.VALIDATION_UNDEFINED,
                fatal: true,
              });
              return;
            }

            // ここに到達した場合、サーバー上でバリデーションが行われているはずです。
            // 結果をプロミスとして返すことで、Zodに非同期であることを知らせます。
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
    }),
    // ...
}

export function action() {
  const formData = await request.formData();
  const submission = await parseWithZod(formData, {
    // `isEmailUnique()` が実装された zod スキーマを作成します。
    schema: createSchema({
      async isEmailUnique(email) {
        // ...
      },
    }),

    // サーバー上で非同期バリデーションを有効にします。
    // クライアントバリデーションは同期的でなければならないため、
    // クライアントでは `async: true` を設定しません。
  });

  // ...
}

export default function Signup() {
  const lastResult = useActionData();
  const [form] = useForm({
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, {
        // isEmailUnique()を実装せずにスキーマを作成します。
        schema: createSchema(),
      });
    },
  });

  // ...
}
```

## バリデーションのスキップ

スキーマはすべてのフィールドを一緒に検証します。これは、特に非同期バリデーションの場合、実行コストがかかることがあります。一つの解決策は、送信の意図をチェックすることにより、バリデーションを最小限に抑えることです。

```tsx
import { parseWithZod, conformZodMessage } from '@conform-to/zod';

function createSchema(
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
        .pipe(
          z.string().superRefine((email, ctx) => {
            const isValidatingEmail =
              intent === null ||
              (intent.type === 'validate' && intent.payload.name === 'email');

            // これによってバリデーションがスキップされたことを示すことで、
            // Conformは前の結果を使用するようになります。
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
    }),
    // ...
}

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const submission = await parseWithZod(formData, {
    // Retrieve the intent by providing a function instead
    schema: (intent) =>
      createSchema(intent, {
        async isEmailUnique(email) {
          // ...
        },
      }),

    async: true,
  });

  // ...
}

export default function Signup() {
  const lastResult = useActionData();
  const [form] = useForm({
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, {
        // 上記のアクションと同様です。
        schema: (intent) => createSchema(intent),
      });
    },
  });

  // ...
}
```
