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

// Instead of sharing a schema, prepare a schema creator
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
        // Pipe the schema so it runs only if the email is valid
        .pipe(
          // Note: The callback cannot be async here
          // As we run zod validation synchronously on the client
          z.string().superRefine((email, ctx) => {
            // This makes Conform to fallback to server validation
            // by indicating that the validation is not defined
            if (typeof options?.isEmailUnique !== 'function') {
              ctx.addIssue({
                code: 'custom',
                message: conformZodMessage.VALIDATION_UNDEFINED,
                fatal: true,
              });
              return;
            }

            // If it reaches here, then it must be validating on the server
            // Return the result as a promise so Zod knows it's async instead
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
		// create the zod schema with `isEmailUnique()` implemented
		schema: createSchema({
			async isEmailUnique(email) {
				// ...
			},
		}),

		// Enable async validation on the server
    // We won't set `async: true` on the client
    // as client validation must be synchronous
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
				// Create the schema without implementing `isEmailUnique()`
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
