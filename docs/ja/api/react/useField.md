# useField

[FormProvider](./FormProvider.md) に設定されたコンテキストを購読することで、フィールドメタデータを返す React フックです。これは **最も近い** [FormProvider](./FormProvider.md) に基づいています。

```tsx
const [meta, form] = useField(name, options);
```

## パラメーター

### `name`

フィールドの名前。

### `options`

現時点での **オプション** は 1 つだけです。入れ子になったフォームコンテキストがあり、最も近い [FormProvider](./FormProvider.md) からではないフィールドにアクセスしたい場合は、 `formId` を渡して、正しいフィールドメタデータが返されるようにすることができます。

## 戻り値

### `meta`

フィールドメタデータです。これは、 [useForm](./useForm.md) フックを使用した場合の `fields.fieldName` に相当します。

### `form`

フォームメタデータです。これは、 [useForm](./useForm.md) または [useFormMetadata](./useFormMetadata.md) フックによって返されるオブジェクトと同じものです。

## Tips

### `FieldName` 型を使用することで、より良い型安全性を実現します。

フィールドやフォームのメタデータの型推論を改善するために、 `string` の代わりに `FieldName<FieldSchema, FormSchema, FormError>` 型を使用できます。

```tsx
import { type FormName, useFormMetadata } from '@conform-to/react';

type ExampleComponentProps = {
  name: FieldName<FieldSchema, FormSchema, FormError>;
};

function ExampleComponent({ name }: ExampleComponentProps) {
  // これで、 'meta.value', 'meta.errors', 'form.errors' などの型が認識されます。
  const [meta, form] = useField(name);

  return <div>{/* ... */}</div>;
}
```

コンポーネントをレンダリングする際には、 Conform によって提供される名前（例: `fields.fieldName.name` ）を使用します。これは既に `FieldName<FieldSchema, FormSchema, FormError>` として型付けされています。これにより、 TypeScript は型が互換性があるかをチェックし、互換性がない場合に警告を出すことができます。 `string` を渡すこともできますが、型チェックの機能は失われます。

```tsx
import { useForm } from '@conform-to/react';

function Example() {
  const [form, fields] = useForm();

  return <ExampleComponent name={fields.fieldName.name} />;
}
```

しかし、 `FieldName` 型をより具体的にすればするほど、コンポーネントの再利用は難しくなります。もしあなたのコンポーネントがジェネリックの一部を使用しないのであれば、いつでも省略することができます。

```ts
type ExampleComponentProps = {
  // 値やエラーなどの型を気にしない場合
  name: string;
  // フィールドの値にアクセスしている場合
  name: FieldName<number>;
  // 深くネストされたフォームがあり、トップレベルの特定のフィールドにアクセスしたい場合
  name: FieldName<number, { fieldName: string }>;
  // カスタムエラータイプを持っている場合
  name: FieldName<number, any, CustomFormError>;
};
```
