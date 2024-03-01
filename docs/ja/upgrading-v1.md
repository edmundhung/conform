# v1 へのアップグレード

このガイドでは、 v1 で導入されたすべての変更点を説明し、既存のコードベースをアップグレードする方法をご案内します。

## 最小限必要な React バージョン

Conform は現在、 React 18 以降を要求します。もし古いバージョンの React を使用している場合は、まず React のバージョンをアップグレードする必要があります。

## `conform` オブジェクトは削除されました

まず、すべてのヘルパーが改名され、個別にインポートできるようになりました:

- `conform.input` -&gt; [getInputProps](./api/react/getInputProps.md)
- `conform.select` -&gt; [getSelectProps](./api/react/getSelectProps.md)
- `conform.textarea` -&gt; [getTextareaProps](./api/react/getTextareaProps.md)
- `conform.fieldset` -&gt; [getFieldsetProps](./api/react/getFieldsetProps.md)
- `conform.collection` -&gt; [getCollectionProps](./api/react/getCollectionProps.md)

以前 `conform.VALIDATION_UNDEFINED` および `conform.VALIDATION_SKIPPED` を使用していた場合、それらは zod インテグレーション (`@conform-to/zod`) に移されました。

- `conform.VALIDATION_SKIPPED` -&gt; [conformZodMessage.VALIDATION_SKIPPED](./api/zod/conformZodMessage.md#conformzodmessagevalidation_skipped)
- `conform.VALIDATION_UNDEFINED` -&gt; [conformZodMessage.VALIDATION_UNDEFINED](./api/zod/conformZodMessage.md#conformzodmessagevalidation_undefined)

`conform.INTENT` はもはやエクスポートされていないことに注意してください。インテントボタンを設定する必要がある場合は、より良い型安全性のために zod の [z.discriminatedUnion()](https://zod.dev/?id=discriminated-unions) と組み合わせて、それを **intent** （または好みの何か）と名付けることができます。

オプションに関してもいくつかの破壊的変更があります:

- `getInputProps` における `type` オプションが現在必須になりました。

```tsx
<input {...getInputProps(fields.title, { type: 'text' })} />
```

- `description` オプションは `ariaDescribedBy` に改名され、ブール値の代わりに文字列型（ description 要素の `id` ）になりました。

```tsx
<input
  {...getInputProps(fields.title, {
    ariaDescribedBy: fields.title.descriptionId,
  })}
/>
```

## フォーム設定の変更点

まず、`form.props` が削除されました。代わりに [getFormProps()](./api/react/getFormProps.md) ヘルパーを使用できます。

```tsx
import { useForm, getFormProps } from '@conform-to/react';

function Example() {
  const [form] = useForm();

  return <form {...getFormProps(form)} />;
}
```

`useFieldset` および `useFieldList` フックは削除されました。代わりにフィールドメタデータ上で `getFieldset()` または `getFieldList()` メソッドを呼び出すことができます。

```tsx
function Example() {
  const [form, fields] = useForm();

  // Before: useFieldset(form.ref, fields.address)
  const address = fields.address.getFieldset();
  // Before: useFieldList(form.ref, fields.tasks)
  const tasks = fields.tasks.getFieldList();

  return (
    <form>
      <ul>
        {tasks.map((task) => {
          // ネストされたリストを持つ追加のコンポーネントを定義する必要はなくなりました。
          // フィールドセットに直接アクセスできるようになったためです。
          const taskFields = task.getFieldset();

          return <li key={task.key}>{/* ... */}</li>;
        })}
      </ul>
    </form>
  );
}
```

`validate` と `list` のエクスポートは、フォームメタデータオブジェクトに統合されました:

```tsx
function Example() {
  const [form, fields] = useForm();
  const tasks = fields.tasks.getFieldList();

  return (
    <form>
      <ul>
        {tasks.map((task) => {
          return <li key={task.key}>{/* ... */}</li>;
        })}
      </ul>
      <button {...form.insert.getButtonProps({ name: fields.tasks.name })}>
        Add (Declarative API)
      </button>
      <button onClick={() => form.insert({ name: fields.tasks.name })}>
        Add (Imperative API)
      </button>
    </form>
  );
}
```

以下に、すべての同等のメソッドを示します:

- `validate` -&gt; `form.validate`
- `list.insert` -&gt; `form.insert`
- `list.remove` -&gt; `form.remove`
- `list.reorder` -&gt; `form.reorder`
- `list.replace` -&gt; `form.update`
- `list.append` および `list.prepend` は削除されました。代わりに `form.insert` を使用できます。

## スキーマ・インテグレーション

混乱を避けるために、各統合における API を一意の名前に変更しました。こちらが同等のメソッドです:

#### `@conform-to/zod`

- `parse` -&gt; [parseWithZod](./api/zod/parseWithZod.md)
- `getFieldsetConstraint` -&gt; [getZodConstraint](./api/zod/getZodConstraint.md)

#### `@conform-to/yup`

- `parse` -&gt; [parseWithYup](./api/yup/parseWithYup.md)
- `getFieldsetConstraint` -&gt; [getYupConstraint](./api/yup/getYupConstraint.md)

## 送信処理の改善

セットアップを簡素化するために、送信オブジェクトを再設計しました。

```tsx
export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema });

  /**
   * 送信ステータスは「success」、「error」、または undefined のいずれかになります。
   * ステータスが undefined の場合、送信が準備されていないことを意味します（つまり、 intent が submit ではありません）。
   */
  if (submission.status !== 'success') {
    return json(submission.reply(), {
      // また、ステータスを使用してHTTPステータスコードを決定することもできます。
      status: submission.status === 'error' ? 400 : 200,
    });
  }

  const result = await save(submission.value);

  if (!result.successful) {
    return json(
      submission.reply({
        // `reply` メソッドに追加のエラーを渡すこともできます。
        formErrors: ['Submission failed'],
        fieldErrors: {
          address: ['Address is invalid'],
        },

        // or avoid sending the the field value back to client by specifying the field names
        hideFields: ['password'],
      }),
    );
  }

  // `resetForm` オプションを使用して送信に応答します。
  return json(submission.reply({ resetForm: true }));
}

export default function Example() {
  const lastResult = useActionData<typeof action>();
  const [form, fields] = useForm({
    // 混乱を避けるために、 `lastSubmission` は `lastResult` に改名されました。
    lastResult,
  });

  // フォームメタデータからも送信のステータスを確認できるようになりました。
  console.log(form.status); // "success", "error" or undefined
}
```

## `useInputControl` フックを使用したインテグレーションがシンプルに

`useInputEvent` フックは、いくつかの新機能を備えた [useInputControl](./api/react/useInputControl.md) フックに置き換えられました。

- もはや input 要素の ref を提供する必要はありません。 DOM から入力要素を探し出し、見つからない場合は自動で挿入します。

- カスタム input を制御された input として統合するために `control.value` を使用し、 `control.change(value)` を通じて値の状態を更新できるようになりました。フォームがリセットされると、値もリセットされます。

```tsx
import { useForm, useInputControl } from '@conform-to/react';
import { CustomSelect } from './some-ui-library';

function Example() {
  const [form, fields] = useForm();
  const control = useInputControl(fields.title);

  return (
    <CustomSelect
      name={fields.title.name}
      value={control.value}
      onChange={(e) => control.change(e.target.value)}
      onFocus={control.focus}
      onBlur={control.blur}
    />
  );
}
```
