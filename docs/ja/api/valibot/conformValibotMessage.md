# conformValibotMessage

検証動作を制御するためのカスタムメッセージのセットです。これは、フィールドの一つに対して非同期検証が必要な場合に便利です。

## Options

### `conformValibotMessage.VALIDATION_SKIPPED`

このメッセージは、検証がスキップされ、 Conform が前回の結果を代わりに使用すべきであることを示すために使用されます。

### `conformValibotMessage.VALIDATION_UNDEFINED`

このメッセージは、検証が定義されていないことを示し、 Conform がサーバー検証にフォールバックすべきであることを示すために使用されます。

## Example

検証をスキップして、以前の結果を使用できます。クライアント検証では、検証が定義されていないことを示すことで、サーバー検証にフォールバックできます。

```tsx
import type { Intent } from '@conform-to/react';
import { useForm } from '@conform-to/react';
import { parseWithValibot, conformValibotMessage } from 'conform-to-valibot';
import {
  check,
  forward,
  forwardAsync,
  object,
  partialCheck,
  partialCheckAsync,
  pipe,
  pipeAsync,
  string,
} from 'valibot';

function createBaseSchema(intent: Intent | null) {
  return object({
    email: pipe(
      string('Email is required'),
      // メールアドレスを検証しない場合は、メールエラーをそのままにしておきます。
      check(
        () =>
          intent === null ||
          (intent.type === 'validate' && intent.payload.name === 'email'),
        conformValibotMessage.VALIDATION_SKIPPED,
      ),
    ),
    password: string('Password is required'),
  });
}

function createServerSchema(
  intent: Intent | null,
  options: { isEmailUnique: (email: string) => Promise<boolean> },
) {
  return pipeAsync(
    createBaseSchema(intent),
    forwardAsync(
      partialCheckAsync(
        [['email']],
        async ({ email }) => options.isEmailUnique(email),
        'Email is already used',
      ),
      ['email'],
    ),
  );
}

function createClientSchema(intent: Intent | null) {
  return pipe(
    createBaseSchema(intent),
    forward(
      // メールアドレスが指定されている場合は、その一意性をチェックするためにサーバー検証にフォールバックします。
      partialCheck(
        [['email']],
        () => false,
        conformValibotMessage.VALIDATION_UNDEFINED,
      ),
      ['email'],
    ),
  );
}

export async function action({ request }) {
  const formData = await request.formData();
  const submission = await parseWithValibot(formData, {
    schema: (intent) =>
      createServerSchema(intent, {
        isEmailUnique: async (email) => {
          // データベースを参照して、メールアドレスが一意であるかどうかを確認します
        },
      }),
  });

  // ステータスが成功でない場合は、送信内容をクライアントに送り返します
  if (submission.status !== 'success') {
    return submission.reply();
  }

  // ...
}

function ExampleForm() {
  const [form, { email, password }] = useForm({
    onValidate({ formData }) {
      return parseWithValibot(formData, {
        schema: (intent) => createClientSchema(intent),
      });
    },
  });

  // ...
}
```
