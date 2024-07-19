# useFormMetadata

[FormProvider](./FormProvider.md) に設定されたコンテキストを登録することで、フォームのメタデータを返す React フックです。

```tsx
const form = useFormMetadata(formId);
```

## パラメータ

### `formId`

フォーム要素に設定される id 属性です。

## 戻り値

### `form`

フォームメタデータです。これは、 [useForm](./useForm.md) フックによって返されるオブジェクトと同じです。

## Tips

### `FormId` 型を用いたより良い型推論

フォームメタデータの型推論を改善するために、 `string` の代わりに `FormId<Schema, FormError>` 型を使用できます。

```tsx
import { type FormId, useFormMetadata } from '@conform-to/react';

type ExampleComponentProps = {
  formId: FormId<Schema, FormError>;
};

function ExampleComponent({ formId }: ExampleComponentProps) {
  // これで `form.errors` と `form.getFieldset()` の結果の型を認識する。
  const form = useFormMetadata(formId);

  return <div>{/* ... */}</div>;
}
```

コンポーネントをレンダリングする際には、 Conform によって提供されたフォーム ID を使用します。例えば、 `form.id` や `fields.fieldName.formId` は、既に `FormId<Schema, FormError>` として型付けされています。これにより、 TypeScript は型が互換性があるかをチェックし、互換性がない場合に警告を出すことができます。 `string` を渡すこともできますが、型チェックの能力は失われます。

```tsx
import { useForm } from '@conform-to/react';

function Example() {
  const [form, fields] = useForm();

  return (
    <>
      <ExampleComponent formId={form.id} />
      <ExampleComponent formId={fields.fieldName.formId} />
    </>
  );
}
```

しかし、 `FormId` 型をより具体的にするほど、コンポーネントの再利用が難しくなります。コンポーネントが `Schema` や `FormError` のジェネリクスを使用しない場合は、それを `string` としてシンプルに保つこともできます。

```ts
type ExampleComponentProps = {
  // スキーマやフォームエラーの型を気にしない場合
  formId: string;
  // フォームメタデータから特定のフィールドにアクセスしている場合
  formId: FormId<{ fieldName: string }>;
  // カスタムエラータイプを持っている場合
  formId: FormId<Record<string, any>, CustomFormError>;
};
```
