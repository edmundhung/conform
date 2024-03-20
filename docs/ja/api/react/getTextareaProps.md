# getTextareaProps

テキストエリア要素をアクセシブルにするために必要なすべてのプロパティを返すヘルパーです。

```tsx
const props = getTextareaProps(meta, options);
```

## 例

```tsx
import { useForm, getTextareaProps } from '@conform-to/react';

function Example() {
  const [form, fields] = useForm();

  return <textarea {...getTextareaProps(fields.content)} />;
}
```

## オプション

### `value`

このヘルパーは、例えばコントロールされた入力など、これが `false` に設定されていない限り、 **defaultValue** を返します。

### `ariaAttributes`

結果のプロパティに `aria-invalid` と `aria-describedby` を含めるかどうかを決定します。デフォルトは **true** です。

### `ariaInvalid`

ARIA 属性を `meta.errors` または `meta.allErrors` に基づいて設定するかどうかを決定します。デフォルトは **errors** です。

### `ariaDescribedBy`

`aria-describedby` 属性に追加の **id** を付加します。フィールドメタデータから `meta.descriptionId` を渡すことができます。

## Tips

### ヘルパーは任意です。

このヘルパーは、定型文を減らし、読みやすくするための便利な機能です。テキストエリア要素のプロパティを設定するために、いつでもフィールドメタデータを直接使用することができます。

```tsx
// Before
function Example() {
  return (
    <form>
      <textarea
        key={fields.content.key}
        id={fields.content.id}
        name={fields.content.name}
        form={fields.content.formId}
        defaultValue={fields.content.initialValue}
        aria-invalid={!fields.content.valid || undefined}
        aria-describedby={
          !fields.content.valid ? fields.content.errorId : undefined
        }
        required={fields.content.required}
        minLength={fields.content.minLength}
        maxLength={fields.content.maxLength}
      />
    </form>
  );
}

// After
function Example() {
  return (
    <form>
      <textarea {...getTextareaProps(fields.content)} />
    </form>
  );
}
```

### 自分のヘルパーを作る

ヘルパーはネイティブのフォーム要素のために設計されています。カスタムコンポーネントを使う必要がある場合、いつでも独自のヘルパーを作ることができます。
