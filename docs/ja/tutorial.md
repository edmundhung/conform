# チュートリアル

このチュートリアルでは、最初に Remix と Zod だけを使用して基本的なお問い合わせフォームを構築します。その後、 Conform を使用してそれを強化する方法をご紹介します。

## インストール

開始する前に、プロジェクトに Conform をインストールしてください。

```sh
npm install @conform-to/react @conform-to/zod --save
```

## 初期設定

まず、スキーマを定義しましょう。ここでは、フォームデータの検証に使用する zod スキーマを示します:

```ts
import { z } from 'zod';

const schema = z.object({
  // zodが必要なチェックを適切に実行するためには、前処理ステップが必要です。
  // 空の入力の値は通常、空の文字列であるためです。
  email: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string({ required_error: 'Email is required' }).email('Email is invalid'),
  ),
  message: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z
      .string({ required_error: 'Message is required' })
      .min(10, 'Message is too short')
      .max(100, 'Message is too long'),
  ),
});
```

action ハンドラでは、フォームデータを解析し、zod で検証します。エラーがある場合は、送信された値とともにクライアントに返します。

```tsx
import { type ActionFunctionArgs, redirect } from '@remix-run/node';
import { z } from 'zod';
import { sendMessage } from '~/message';

const schema = z.object({
  // ...
});

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  // `Object.fromEntries` を使用してオブジェクトを構築します。
  const payload = Object.fromEntries(formData);
  // その後、zodでパースします。
  const result = schema.safeParse(payload);

  // データが有効でない場合は、エラーをクライアントに返します。
  if (!result.success) {
    const error = result.error.flatten();

    return {
      payload,
      formErrors: error.formErrors,
      fieldErrors: error.fieldErrors,
    };
  }

  // チュートリアルにとって重要ではないので、実装はスキップします。
  const message = await sendMessage(result.data);

  // メッセージが送信されない場合は、フォームエラーを返します。
  if (!message.sent) {
    return {
      payload,
      formErrors: ['Failed to send the message. Please try again later.'],
      fieldErrors: {},
    };
  }

  return redirect('/messages');
}
```

次に、お問い合わせフォームを実装します。`useActionData()`から送信結果が返された場合、各フィールドの隣にエラーメッセージを表示します。フィールドは送信された値で初期化されるため、ドキュメントが再読み込みされた場合でもフォームデータが保持されます。

```tsx
import { type ActionFunctionArgs } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { z } from 'zod';
import { sendMessage } from '~/message';

const schema = z.object({
  // ...
});

export async function action({ request }: ActionFunctionArgs) {
  // ...
}

export default function ContactUs() {
  const result = useActionData<typeof action>();

  return (
    <Form method="POST">
      <div>{result?.formErrors}</div>
      <div>
        <label>Email</label>
        <input type="email" name="email" defaultValue={result?.payload.email} />
        <div>{result?.fieldsErrors.email}</div>
      </div>
      <div>
        <label>Message</label>
        <textarea name="message" defaultValue={result?.payload.message} />
        <div>{result?.fieldsErrors.message}</div>
      </div>
      <button>Send</button>
    </Form>
  );
}
```

まだ終わっていません。アクセシビリティは決して見過ごされるべきではありません。次の属性を追加して、フォームをよりアクセシブルにしましょう:

- それぞれのラベルが一意の **id** を用いて適切に入力と関連付けられていることを確認してください。
- zod スキーマに似たバリデーション属性を設定する
- 有効性に基づいてフォーム要素の **aria-invalid** 属性を設定する
- エラーメッセージが **aria-describedby** 属性を用いてフォーム要素にリンクされていることを確認してください。

```tsx
import { type ActionFunctionArgs } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { z } from 'zod';
import { sendMessage } from '~/message';

const schema = z.object({
  // ...
});

export async function action({ request }: ActionFunctionArgs) {
  // ...
}

export default function ContactUs() {
  const result = useActionData<typeof action>();

  return (
    <Form
      method="POST"
      aria-describedby={result?.formErrors ? 'contact-error' : undefined}
    >
      <div id="contact-error">{result?.formErrors}</div>
      <div>
        <label htmlFor="contact-email">Email</label>
        <input
          id="contact-email"
          type="email"
          name="email"
          defaultValue={result?.payload.email}
          required
          aria-invalid={result?.fieldErrors.email ? true : undefined}
          aria-describedby={
            result?.fieldErrors.email ? 'contact-email-error' : undefined
          }
        />
        <div id="contact-email-error">{result?.fieldErrors.email}</div>
      </div>
      <div>
        <label htmlFor="contact-message">Message</label>
        <textarea
          id="contact-message"
          name="message"
          defaultValue={result?.payload.message}
          required
          minLength={10}
          maxLength={100}
          aria-invalid={result?.fieldErrors.message ? true : undefined}
          aria-describedby={
            result?.fieldErrors.message ? 'contact-email-message' : undefined
          }
        />
        <div id="contact-email-message">{result?.fieldErrors.message}</div>
      </div>
      <button>Send</button>
    </Form>
  );
}
```

たとえシンプルなお問い合わせフォームであっても、これは多くの作業を要します。また、すべての ID を維持することはエラーが発生しやすいです。これをどのように簡素化できるでしょう？

## Conform の導入

ここで Conform の出番です。始めるにあたり、 Conform の zod 統合機能が空文字列を自動的に除去してくれるため、 zod スキーマから前処理を削除できます。

```tsx
import { z } from 'zod';

const schema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Email is invalid'),
  message: z
    .string({ required_error: 'Message is required' })
    .min(10, 'Message is too short')
    .max(100, 'Message is too long'),
});
```

次に、 `parseWithZod()` ヘルパー関数を使って action を簡素化できます。この関数はフォームデータを解析し、解析された値またはエラーを含む送信オブジェクトを返します。

```tsx
import { parseWithZod } from '@conform-to/zod';
import { type ActionFunctionArgs } from '@remix-run/node';
import { z } from 'zod';
import { sendMessage } from '~/message';

const schema = z.object({
  // ...
});

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  // `Object.fromEntries()` をparseWithZodヘルパーに置き換えます。
  const submission = parseWithZod(formData, { schema });

  // submission が成功しなかった場合、クライアントに送信結果を報告します。
  if (submission.status !== 'success') {
    return submission.reply();
  }

  const message = await sendMessage(submission.value);

  //メッセージが送信されなかった場合は、フォームエラーを返します。
  if (!message.sent) {
    return submission.reply({
      formErrors: ['Failed to send the message. Please try again later.'],
    });
  }

  return redirect('/messages');
}
```

これで、 [useForm](./api/react/useForm.md) フックを使って、すべてのフォームメタデータを管理できます。また、 `getZodConstraint()` ヘルパーを使用して、 zod スキーマからバリデーション属性を導出します。

```tsx
import { useForm } from '@conform-to/react';
import { parseWithZod, getZodConstraint } from '@conform-to/zod';
import { type ActionFunctionArgs } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { z } from 'zod';
import { sendMessage } from '~/message';
import { getUser } from '~/session';

const schema = z.object({
  // ...
});

export async function action({ request }: ActionFunctionArgs) {
  // ...
}

export default function ContactUs() {
  const lastResult = useActionData<typeof action>();
  // useFormフックは、フォームをレンダリングするために必要なすべてのメタデータを返します。
  // そして、フォームが送信されたときに最初の無効なフィールドにフォーカスします。
  const [form, fields] = useForm({
    //これにより、サーバーからのエラーが同期されるだけでなく、
    // フォームのデフォルト値としても使用されます。
    // プログレッシブエンハンスメントのためにドキュメントが再読み込みされた場合、

    // 最後の結果からすべてのバリデーション属性を導出するために使用します。
    constraint: getZodConstraint(schema),
  });

  return (
    <Form
      method="post"
      {/* 追加で必要な属性は `id` 属性のみです。*/}
      id={form.id}
      aria-describedby={form.errors ? form.errorId : undefined}
    >
      <div id={form.errorId}>{form.errors}</div>
      <div>
        <label htmlFor={fields.email.id}>Email</label>
        <input
          id={fields.email.id}
          type="email"
          name={fields.email.name}
          defaultValue={fields.email.initialValue}
          required={fields.email.required}
          aria-invalid={fields.email.errors ? true : undefined}
          aria-describedby={
            fields.email.errors ? fields.email.errorId : undefined
          }
        />
        <div id={fields.email.errorId}>{fields.email.errors}</div>
      </div>
      <div>
        <label htmlFor={fields.message.id}>Message</label>
        <textarea
          id={fields.message.id}
          name={fields.message.name}
          defaultValue={fields.message.initialValue}
          required={fields.message.required}
          minLength={fields.message.minLength}
          maxLength={fields.message.maxLength}
          aria-invalid={fields.message.errors ? true : undefined}
          aria-describedby={
            fields.message.errors ? fields.message.errorId : undefined
          }
        />
        <div id={fields.message.errorId}>{fields.message.errors}</div>
      </div>
      <button>Send</button>
    </Form>
  );
}
```

## バリデーション体験の向上

現在、お問い合わせフォームはユーザーが送信したときにのみ検証されます。タイピングするたびにユーザーに早期フィードバックを提供したい場合はどうすればよいでしょうか？

`shouldValidate` オプションと `shouldRevalidate` オプションを設定しましょう。

```tsx
import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  json,
} from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { sendMessage } from '~/message';
import { getUser } from '~/session';

const schema = z.object({
  // ...
});

export async function loader({ request }: LoaderFunctionArgs) {
  // ...
}

export async function action({ request }: ActionFunctionArgs) {
  // ...
}

export default function ContactUs() {
  const user = useLoaderData<typeof loader>();
  const lastResult = useActionData<typeof action>();
  const [form, fields] = useForm({
    // ... previous config

    // Validate field once user leaves the field
    shouldValidate: 'onBlur',
    // Then, revalidate field as user types again
    shouldRevalidate: 'onInput',
  });

  // ...
}
```

この時点で、私たちのお問い合わせフォームはサーバー上でのみ検証され、ユーザーがタイプするたびにフォームを検証するためにサーバーへの往復が発生します。クライアント検証でフィードバックループを短縮しましょう。

```tsx
import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { sendMessage } from '~/message';
import { getUser } from '~/session';

const schema = z.object({
  // ...
});

export async function action({ request }: ActionFunctionArgs) {
  // ...
}

export default function ContactUs() {
  const user = useLoaderData<typeof loader>();
  const lastResult = useActionData<typeof action>();
  const [form, fields] = useForm({
    // ... 以前の設定

    //クライアント上で同じ検証ロジックを実行する
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
  });

  return (
    <Form
      method="post"
      id={form.id}
      {/* クライアント検証には `onSubmit` ハンドラが必要です。 */}
      onSubmit={form.onSubmit}
      aria-describedby={form.errors ? form.errorId : undefined}
    >
      {/* ... */}
    </Form>
  );
}
```

## ボイラープレートの削除

Conform がすべての ID とバリデーション属性を管理してくれるのは素晴らしいことです。しかし、フォームとフィールドを設定するのにはまだ多くの作業が必要です。ネイティブ入力を扱っている場合は、 [getFormProps](./api/react/getFormProps.md) や [getInputProps](./api/react/getInputProps.md) のようなヘルパーを使用してボイラープレートを最小限に抑えることができます。

```tsx
import {
  useForm,
  getFormProps,
  getInputProps,
  getTextareaProps,
} from '@conform-to/react';
import { parseWithZod, getZodConstraint } from '@conform-to/zod';
import { type ActionFunctionArgs } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { sendMessage } from '~/message';

const schema = z.object({
  // ...
});

export async function action({ request }: ActionFunctionArgs) {
  // ...
}

export default function ContactUs() {
  const lastResult = useActionData<typeof action>();
  const [form, fields] = useForm({
    // ...
  });

  return (
    <Form method="post" {...getFormProps(form)}>
      <div>
        <label htmlFor={fields.email.id}>Email</label>
        <input {...getInputProps(fields.email, { type: 'email' })} />
        <div id={fields.email.errorId}>{fields.email.errors}</div>
      </div>
      <div>
        <label htmlFor={fields.message.id}>Message</label>
        <textarea {...getTextareaProps(fields.message)} />
        <div id={fields.message.errorId}>{fields.message.errors}</div>
      </div>
      <button>Send</button>
    </Form>
  );
}
```

完了です！これが、このチュートリアルで構築した完全な例です:

```tsx
import {
  useForm,
  getFormProps,
  getInputProps,
  getTextareaProps,
} from '@conform-to/react';
import { parseWithZod, getZodConstraint } from '@conform-to/zod';
import { type ActionFunctionArgs } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { z } from 'zod';
import { sendMessage } from '~/message';

const schema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Email is invalid'),
  message: z
    .string({ required_error: 'Message is required' })
    .min(10, 'Message is too short')
    .max(100, 'Message is too long'),
});

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema });

  if (submission.status !== 'success') {
    return submission.reply();
  }

  const message = await sendMessage(submission.value);

  if (!message.sent) {
    return submission.reply({
      formErrors: ['Failed to send the message. Please try again later.'],
    });
  }

  return redirect('/messages');
}

export default function ContactUs() {
  const lastResult = useActionData<typeof action>();
  const [form, fields] = useForm({
    lastResult,
    constraint: getZodConstraint(schema),
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
  });

  return (
    <Form method="post" {...getFormProps(form)}>
      <div>
        <label htmlFor={fields.email.id}>Email</label>
        <input {...getInputProps(fields.email, { type: 'email' })} />
        <div id={fields.email.errorId}>{fields.email.errors}</div>
      </div>
      <div>
        <label htmlFor={fields.message.id}>Message</label>
        <textarea {...getTextareaProps(fields.message)} />
        <div id={fields.message.errorId}>{fields.message.errors}</div>
      </div>
      <button>Send</button>
    </Form>
  );
}
```
