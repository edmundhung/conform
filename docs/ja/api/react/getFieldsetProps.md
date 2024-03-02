# getFieldsetProps

フィールドセット要素をアクセシブルにするために必要なすべてのプロパティを返すヘルパーです。

```tsx
const props = getFieldsetProps(meta, options);
```

## 例

```tsx
import { useForm, getFieldsetProps } from '@conform-to/react';

function Example() {
  const [form, fields] = useForm();

  return <fieldset {...getFieldsetProps(fields.address)} />;
}
```

## オプション

### `ariaAttributes`

結果のプロパティに `aria-invalid` と `aria-describedby` を含めるかどうかを決定します。デフォルトは **true** です。

### `ariaInvalid`

ARIA 属性が `meta.errors` または `meta.allErrors` に基づくべきかどうかを決定します。デフォルトは **errors** です。

### `ariaDescribedBy`

`aria-describedby` 属性に追加の **id** を付加します。フィールドメタデータから `meta.descriptionId` を渡すことができます。

## Tips

### ヘルパーは任意です

このヘルパーは、定型文を減らし、読みやすくするための便利な機能です。入力要素のプロパティを設定するために、常にフィールドのメタデータを直接使用することもできます。

```tsx
// Before
function Example() {
  return (
    <fieldset
      id={fields.address.id}
      name={fields.address.name}
      form={fields.address.formId}
      aria-invalid={!form.valid || undefined}
      aria-describedby={!form.valid ? form.errorId : undefined}
    />
  );
}

// After
function Example() {
  return <fieldset {...getFieldsetProps(fields.address)} />;
}
```

### 自分のヘルパーを作る

このヘルパーは、ネイティブの入力要素用に設計されています。カスタムコンポーネントを使用する必要がある場合は、自分自身のヘルパーを作成することができます。
