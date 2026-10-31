# React Router

[React Router](https://reactrouter.com/) の Framework Mode とインテグレーションしたログインフォームの例です。完全な例は [React Router のサンプル](../../../examples/react-router) を参照してください。

> このガイドでは Conform の future API を使用します。これらの API は実験的なもので、マイナーバージョンで変更される可能性があります。[詳しくはこちら](https://github.com/edmundhung/conform/discussions/954)

この例は `app/routes/login.tsx` のルートモジュールを想定しています。`Route` 型は React Router によって生成されます。

```tsx
import { useForm, parseSubmission, report } from '@conform-to/react/future';
import { coerceFormValue } from '@conform-to/zod/v4/future';
import { Form, redirect } from 'react-router';
import { z } from 'zod';
import type { Route } from './+types/login';

const schema = coerceFormValue(
  z.object({
    email: z.string({ error: 'Email is required' }).email('Email is invalid'),
    password: z.string({ error: 'Password is required' }),
    remember: z.boolean().default(false),
  }),
);

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const submission = parseSubmission(formData);
  const result = schema.safeParse(submission.payload);

  if (!result.success) {
    return {
      result: report(submission, {
        error: {
          issues: result.error.issues,
        },
      }),
    };
  }

  // ...

  return redirect('/');
}

export default function Login({ actionData }: Route.ComponentProps) {
  // クライアントでバリデーション・ロジックを再利用する
  const { form, fields } = useForm(schema, {
    // 前回の送信結果を同期
    lastResult: actionData?.result,

    // blurイベント発生時にフォームを検証する
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
  });

  return (
    <Form method="post" {...form.props}>
      <div>
        <label htmlFor={fields.email.id}>Email</label>
        <input
          id={fields.email.id}
          type="email"
          name={fields.email.name}
          defaultValue={fields.email.defaultValue}
          aria-invalid={!fields.email.valid || undefined}
          aria-describedby={fields.email.ariaDescribedBy}
        />
        <div id={fields.email.errorId}>{fields.email.errors}</div>
      </div>
      <div>
        <label htmlFor={fields.password.id}>Password</label>
        <input
          id={fields.password.id}
          type="password"
          name={fields.password.name}
          defaultValue={fields.password.defaultValue}
          aria-invalid={!fields.password.valid || undefined}
          aria-describedby={fields.password.ariaDescribedBy}
        />
        <div id={fields.password.errorId}>{fields.password.errors}</div>
      </div>
      <div>
        <label htmlFor={fields.remember.id}>Remember me</label>
        <input
          id={fields.remember.id}
          type="checkbox"
          name={fields.remember.name}
          defaultChecked={fields.remember.defaultChecked}
          aria-invalid={!fields.remember.valid || undefined}
          aria-describedby={fields.remember.ariaDescribedBy}
        />
      </div>
      <hr />
      <button>Login</button>
    </Form>
  );
}
```
