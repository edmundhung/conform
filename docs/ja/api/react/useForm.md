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

フォームメタデータです。以下にプロパティの説明が続きます。

#### `id`

#### `errorId`

#### `descriptionId`

#### `name`

#### `initialValue`

#### `value`

#### `errors`

#### `allErrors`

#### `valid`

#### `dirty`


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
