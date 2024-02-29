# 概要

Conformは、Web標準に基づいてHTMLフォームを段階的に強化し、[Remix](https://remix.run)や[Next.js](https://nextjs.org)のようなサーバーフレームワークを完全にサポートする、型安全なフォームバリデーションライブラリです。

## 機能

- プログレッシブエンハンスメント・ファーストな API
- 型安全なフィールド推論
- きめ細やかなサブスクリプション
- 組み込みのアクセシビリティ・ヘルパー
- Zod による自動型強制

## The Gist

Conformは、クライアントからサーバーへのフォーム送信ライフサイクルを制御し、`useForm()`フックを通じてフォームの状態を公開します。フォームのマークアップを制限せず、どのような有効なHTMLフォームとも動作します。フォームの値は[FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData) Web APIを使用してDOMからキャプチャされ、イベントデリゲーションを通じて同期されます。

```tsx
import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { z } from 'zod';
import { login } from './your-auth-library';
import { useActionResult, redirect } from './your-server-framework';

// フォームのスキーマを定義する
const schema = z.object({
  username: z.string(),
  password: z.string(),
});

// Optional: サーバーアクションハンドラ
export async function action({ request }) {
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema });

  // ステータスが成功でない場合は、送信内容をクライアントに返送する
  if (submission.status !== 'success') {
    return submission.reply();
  }

  const session = await login(submission.value);

  // ログインに失敗した場合は、追加のエラーメッセージとともに送信内容を送る
  if (!session) {
    return submission.reply({
      formErrors: ['Incorrect username or password'],
    });
  }

  return redirect('/dashboard');
}

// クライアントフォームコンポーネント
export default function LoginForm() {
  // サーバーアクションハンドラを定義している場合は、最後の送信結果を取得します。
  // これはフレームワークによってはuseActionData()またはuseFormState()になります。
  const lastResult = useActionResult();
  const [form, fields] = useForm({
    // 各フィールドをいつ検証するかを設定する
    shouldValidate: 'onBlur',
    // Optional: サーバー上で検証する場合のみ必要です。
    lastResult,
    // Optional: クライアント検証。提供されていない場合はサーバー検証にフォールバックします。
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
  });

  return (
    <form method="post" id={form.id} onSubmit={form.onSubmit}>
      <div>{form.errors}</div>
      <div>
        <label>Username</label>
        <input type="text" name={fields.username.name} />
        <div>{fields.username.errors}</div>
      </div>
      <div>
        <label>Password</label>
        <input type="password" name={fields.password.name} />
        <div>{fields.password.errors}</div>
      </div>
      <button>Login</button>
    </form>
  );
}
```
