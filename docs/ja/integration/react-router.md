# React Router

[React Router](https://reactrouter.com/) の Framework Mode とインテグレーションしたログインフォームの例です。完全な例は [React Router のサンプル](../../examples/react-router) を参照してください。

この例は `app/routes/login.tsx` のルートモジュールを想定しています。`Route` 型は React Router によって生成されます。

```tsx
import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import { Form, redirect } from 'react-router';
import { z } from 'zod';
import type { Route } from './+types/login';

const schema = z.object({
  email: z.string().email(),
  password: z.string(),
  remember: z.boolean().optional(),
});

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema });

  if (submission.status !== 'success') {
    return submission.reply();
  }

  // ...

  return redirect('/');
}

export default function Login({ actionData }: Route.ComponentProps) {
  const [form, fields] = useForm({
    // 前回の送信結果を同期
    lastResult: actionData,

    // クライアントでバリデーション・ロジックを再利用する
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },

    // blurイベント発生時にフォームを検証する
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
  });

  return (
    <Form method="post" id={form.id} onSubmit={form.onSubmit} noValidate>
      <div>
        <label>Email</label>
        <input
          type="email"
          key={fields.email.key}
          name={fields.email.name}
          defaultValue={fields.email.initialValue}
        />
        <div>{fields.email.errors}</div>
      </div>
      <div>
        <label>Password</label>
        <input
          type="password"
          key={fields.password.key}
          name={fields.password.name}
          defaultValue={fields.password.initialValue}
        />
        <div>{fields.password.errors}</div>
      </div>
      <label>
        <div>
          <span>Remember me</span>
          <input
            type="checkbox"
            key={fields.remember.key}
            name={fields.remember.name}
            defaultChecked={fields.remember.initialValue === 'on'}
          />
        </div>
      </label>
      <hr />
      <button>Login</button>
    </Form>
  );
}
```
