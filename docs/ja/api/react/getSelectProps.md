# getSelectProps

セレクト要素をアクセシブルにするために必要なすべてのプロパティを返すヘルパーです。

```tsx
const props = getSelectProps(meta, options);
```

## 例

```tsx
import { useForm, getSelectProps } from '@conform-to/react';

function Example() {
  const [form, fields] = useForm();

  return <select {...getSelectProps(fields.category)} />;
}
```

## オプション

### `value`

このヘルパーは、例えばコントロールされた入力のように、これが `false` に設定されていない限り、 **defaultValue** を返します。

### `ariaAttributes`

結果のプロパティに `aria-invalid` と `aria-describedby` を含めるかどうかを決定します。デフォルトは **true** です。

### `ariaInvalid`

結果のプロパティに `aria-invalid` と `aria-describedby` を含めるかどうかを決定します。デフォルトは **true** です。

### `ariaDescribedBy`

`aria-describedby` 属性に追加の **id** を付加します。フィールドメタデータから `meta.descriptionId` を渡すことができます。

## Tips

### ヘルパーは任意です。

このヘルパーは、定型文を減らし、読みやすくするための便利な機能です。セレクト要素のプロパティを設定するために、いつでもフィールドメタデータを直接使用することができます。

```tsx
// Before
function Example() {
  return (
    <form>
      <select
        key={fields.category.key}
        id={fields.category.id}
        name={fields.category.name}
        form={fields.category.formId}
        defaultValue={fields.category.initialValue}
        aria-invalid={!fields.category.valid || undefined}
        aria-describedby={
          !fields.category.valid ? fields.category.errorId : undefined
        }
        required={fields.category.required}
        multiple={fields.category.multiple}
      />
    </form>
  );
}

// After
function Example() {
  return (
    <form>
      <select {...getSelectProps(fields.category)} />
    </form>
  );
}
```

### 自分のヘルパーを作る

このヘルパーは、ネイティブのセレクト要素用に設計されています。カスタムコンポーネントを使用する必要がある場合は、自分自身のヘルパーを作成することができます。
