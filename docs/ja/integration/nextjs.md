# Next.js

[Next.js](https://nextjs.org)と統合したログインフォームの例をこちらに示します。完全な例は[こちら](../../examples/nextjs)で見ることができます。

```tsx
// schema.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  remember: z.boolean().optional(),
});

// action.ts
('use server');

import { redirect } from 'next/navigation';
import { parseWithZod } from '@conform-to/zod';
import { loginSchema } from '@/app/schema';

export async function login(prevState: unknown, formData: FormData) {
  const submission = parseWithZod(formData, {
    schema: loginSchema,
  });

  if (submission.status !== 'success') {
    return submission.reply();
  }

  redirect('/dashboard');
}

// form.tsx
('use client');

import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { useFormState } from 'react-dom';
import { login } from '@/app/actions';
import { loginSchema } from '@/app/schema';

export function LoginForm() {
  const [lastResult, action] = useFormState(login, undefined);
  const [form, fields] = useForm({
    // 前回の送信結果を同期
    lastResult,

    // クライアントでバリデーション・ロジックを再利用する
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: loginSchema });
    },

    // blurイベント発生時にフォームを検証する
    shouldValidate: 'onBlur',
  });

  return (
    <form id={form.id} onSubmit={form.onSubmit} action={action} noValidate>
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
      <Button>Login</Button>
    </form>
  );
}
```
