# useForm

HTML フォームを強化するためのフォームとフィールドのメタデータを返す React フックです。

```tsx
const [form, fields] = useForm(options);
```

## オプション

以下のオプションはすべて任意です。

### `id`

フォーム要素に設定される id 属性です。提供されない場合は、代わりにランダムな id が生成されます。これは、各フィールドの id を生成するためにも使用されます。

### `lastResult`

最後の送信の結果です。これは通常、サーバーから送信され、プログレッシブエンハンスメントのためのフォームの初期状態として使用されます。

### `defaultValue`

フォームの初期値です。

### `constraint`

各フィールドに設定されるバリデーション属性です。

### `shouldValidate`

Conform が各フィールドのバリデーションを開始するタイミングを 3 つのオプションで定義します: **onSubmit**, **onBlur**,または **onInput** 。デフォルトは **onSubmit** です。

### `shouldRevalidate`

フィールドがバリデーションされた後、Conform が各フィールドをいつ再バリデーションするかを定義します。デフォルトは **shouldValidate** の値です。

### `shouldDirtyConsider`

Conform がフィールドをダーティ状態とみなすべきかどうかを定義します。例えば、 CSRF トークンのように Conform によって管理されていないフォームフィールドを除外する場合などです。

### `onValidate`

フォームを（再）バリデーションする必要があるときに呼び出される関数です。

### `onSubmit`

フォームが送信される前に呼び出される関数です。 **onValidate** が設定されている場合、クライアントバリデーションが成功した場合にのみ呼び出されます。

### `defaultNoValidate`

DOM がハイドレートされる前に制約バリデーションを有効にします。デフォルトは **true** です。

## 戻り値

### `form`

フォームメタデータです。フォームの状態や操作に必要な情報を提供します。

#### `id` (string)

フォーム要素に設定される id 属性です。

#### `errorId` (string)

フォームのエラーメッセージを示す id 属性です。

#### `descriptionId` (string)

フォームの説明を示す id 属性です。

#### `name` (FieldName<Schema, FormSchema, FormError>)

フォームの名前です。

#### `initialValue` (FormValue<Schema>)

`useForm`によって設定されたフォームの初期値です。

#### `value` (FormValue<Schema>)

フォームの現在の値です。

#### `allErrors` (Record<string, FormError>)

フォームにおけるフィールド毎のバリデーションエラーです。キーはフィールド名、値はエラーメッセージの配列です。

#### `valid` (boolean)

フォームが有効かどうかを示します。`true` の場合、フォームはバリデーションチェックを通過したことを示します。

#### `dirty` (boolean)

フォームのいずれかのフィールドが一度でもフォーカスされたかどうかを示します。

#### `status` ('success' | 'error' | undefined)

フォームの送信結果を示します。`success` は成功、`error` は失敗、`undefined` は未送信を表します。

#### `getFieldset` (function)

フォームの各フィールドメタデータを返す関数です。

#### `onSubmit` (function)

フォームを送信するための関数です。

#### `noValidate` (boolean)

ブラウザによるデフォルトのフォームのバリデーションが無効かどうかを示します。デフォルトはtrueで、JavaScriptによる検証を行います。

#### `validate` (object)

バリデーションのためのインテントを提供します。

#### `reset` (object)

フォームやフィールドをリセットするためのインテントを提供します。

#### `update` (object)

フォームやフィールドを変更するためのインテントを提供します。

#### `reorder` (object)

フィールドの順序を変更するためのインテントを提供します。

#### `remove` (object)

フォームからフィールドを削除するためのインテントを提供します。

#### `insert` (object)

フォームにフィールドを挿入するためのインテントを提供します。


## Tips

### クライアントバリデーションは任意です。

Conform はクライアントバリデーションなしでライブバリデーション（つまり、ユーザーが入力から離れたときやタイプしたときにバリデーションする）をサポートしています。これは、バリデーションコードをクライアントバンドルに含めないようにするために便利です。ただし、ネットワークの遅延や、ユーザーがサーバーにアクセスする頻度（特にタイプするたびに再バリデーションする場合）を考慮することが重要です。

### `id` が変更されたときに自動的にフォームをリセットします。

異なる `id` を `useForm` フックに渡してフォームをリセットすることができます。これは、同じフォームを持つ別のページにナビゲートするときに便利です（例： `/articles/foo` から `/articles/bar` へ）。

```tsx
interface Article {
  id: string;
  title: string;
  content: string;
}

function EditArticleForm({ defaultValue }: { defaultValue: Article }) {
  const [form, fields] = useForm({
    id: `article-${defaultValue.id}`,
    defaultValue,
  });

  // ...
}
```
