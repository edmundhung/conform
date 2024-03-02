# getFormProps

フォーム要素をアクセシブルにするために必要なすべてのプロパティを返すヘルパーです。

```tsx
const props = getFormProps(form, options);
```

## 例

```tsx
import { useForm, getFormProps } from '@conform-to/react';

function Example() {
  const [form, fields] = useForm();

  return <form {...getFormProps(form)} />;
}
```

## オプション

### `ariaAttributes`

結果のプロパティに `aria-invalid` と `aria-describedby` を含めるかどうかを決定します。デフォルトは **true** です。

### `ariaInvalid`

aria 属性が `meta.errors` または `meta.allErrors` に基づくべきかを決定します。デフォルトは **errors** です。

### `ariaDescribedBy`

追加の **id** を `aria-describedby` 属性に追加します。フィールドのメタデータから `meta.descriptionId` を渡すことができます。

## Tips

### ヘルパーは任意です

ヘルパーは、定型文を減らし、読みやすくするための便利な関数にすぎません。フォーム要素のプロパティを設定するには、いつでもフォームのメタデータを直接使うことができます。

```tsx
// Before
function Example() {
  return (
    <form
      id={form.id}
      onSubmit={form.onSubmit}
      noValidate={form.noValidate}
      aria-invalid={!form.valid || undefined}
      aria-describedby={!form.valid ? form.errorId : undefined}
    />
  );
}

// After
function Example() {
  return <form {...getFormProps(form)} />;
}
```

### 自分のヘルパーを作る

ヘルパーはネイティブのフォーム要素のために設計されています。カスタムコンポーネントを使う必要がある場合、いつでも独自のヘルパーを作ることができます。
