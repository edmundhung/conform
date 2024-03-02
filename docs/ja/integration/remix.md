# Remix

Here is a login form example integrating with [Remix](https://remix.run/) とインテグレーションしたログインフォームの例です。完全な例は [こちら](../../examples/remix) です。

```tsx
import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import type { ActionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string(),
  remember: z.boolean().optional(),
});

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema });

  if (submission.status !== 'success') {
    return json(submission.reply());
  }

  // ...
}

export default function Login() {
  // サーバーから最後に返された送信結果
  const lastResult = useActionData<typeof action>();
  const [form, fields] = useForm({
    // 前回の送信結果を同期
    lastResult,

    // クライアントでバリデーション・ロジックを再利用する
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },

    // blurイベント発生時にフォームを検証する
    shouldValidate: 'onBlur',
  });

  return (
    <Form method="post" id={form.id} onSubmit={form.onSubmit}>
      <div>
        <label>Email</label>
        <input type="email" name={fields.email.name} />
        <div>{fields.email.errors}</div>
      </div>
      <div>
        <label>Password</label>
        <input type="password" name={fields.password.name} />
        <div>{fields.password.errors}</div>
      </div>
      <label>
        <div>
          <span>Remember me</span>
          <input type="checkbox" name={fields.remember.name} />
        </div>
      </label>
      <hr />
      <button>Login</button>
    </Form>
  );
}
```
